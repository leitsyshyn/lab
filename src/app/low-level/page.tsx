"use client";

import {
  Camera,
  CameraOff,
  Download,
  FileIcon,
  Hash,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

function bytesToHex(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes);
  let hex = "";
  for (let i = 0; i < view.length; i++)
    hex += view[i].toString(16).padStart(2, "0");
  return hex;
}

/**
 * Minimal valid WASM with 1 export:
 *  - mul(i32,i32) -> i32
 *
 * Textual WAT:
 * (module
 *   (func (export "mul") (param i32 i32) (result i32) local.get 0 local.get 1 i32.mul)
 * )
 */
const wasmImgModule = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 2, 127, 127, 1, 127, 3, 2, 1, 0, 7,
  7, 1, 3, 109, 117, 108, 0, 0, 10, 9, 1, 7, 0, 32, 0, 32, 1, 108, 11,
]);

type FileInfo = {
  name: string;
  size: number;
  type: string;
  sha256?: string;
  preview?: string;
  isImage: boolean;
  fileUrl?: string;
} | null;

type Snapshot = {
  id: string;
  timestamp: Date;
  dataUrl: string;
  width: number;
  height: number;
};

export default function LowLevelApisPage() {
  const [fileInfo, setFileInfo] = useState<FileInfo>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup file URL on unmount or when fileInfo changes
  useEffect(() => {
    return () => {
      if (fileInfo?.fileUrl) {
        URL.revokeObjectURL(fileInfo.fileUrl);
      }
    };
  }, [fileInfo?.fileUrl]);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {}
    }
    setIsCameraOn(true);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => void t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  }

  async function ensureCameraPreviewIfOn() {
    if (!isCameraOn) return;
    const v = videoRef.current;
    if (!v) return;
    const tracks = (v.srcObject as MediaStream | null)?.getVideoTracks() ?? [];
    const ended =
      tracks.length === 0 || tracks.every((t) => t.readyState === "ended");
    if (ended) return; // don’t auto re-request permission
    if (v.paused) {
      try {
        await v.play();
      } catch {}
    }
  }

  function snapshot() {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    if (!w || !h) return;

    // Create a temporary canvas for this snapshot
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);

    // Save snapshot to state
    const dataUrl = tempCanvas.toDataURL("image/png");
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      dataUrl,
      width: w,
      height: h,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // Revoke previous file URL if exists
    if (fileInfo?.fileUrl) {
      URL.revokeObjectURL(fileInfo.fileUrl);
    }

    const buf = await f.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);

    const isImage = f.type.startsWith("image/");
    let fileUrl: string | undefined;

    if (isImage) {
      fileUrl = URL.createObjectURL(f);
    }

    let preview: string | undefined;
    if (f.type.startsWith("text/") || f.type === "application/json") {
      preview = await f.text();
      if (preview.length > 400) preview = preview.slice(0, 400) + "…";
    }

    setFileInfo({
      name: f.name,
      size: f.size,
      type: f.type || "n/a",
      sha256: bytesToHex(hash),
      preview,
      isImage,
      fileUrl,
    });

    await ensureCameraPreviewIfOn();
  }

  async function drawImageUrlToCanvas(
    url: string,
    canvas: HTMLCanvasElement | null,
  ) {
    if (!canvas) return;
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1024;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2D context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve();
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  }

  async function loadImageToCanvas() {
    if (!fileInfo?.isImage || !fileInfo.fileUrl) return;
    await drawImageUrlToCanvas(fileInfo.fileUrl, inputCanvasRef.current);
  }

  async function loadSnapshotToCanvas(dataUrl: string) {
    await drawImageUrlToCanvas(dataUrl, inputCanvasRef.current);
  }

  function downloadSnapshot(snapshot: Snapshot) {
    const link = document.createElement("a");
    link.download = `snapshot-${snapshot.timestamp.getTime()}.png`;
    link.href = snapshot.dataUrl;
    link.click();
  }

  function downloadProcessedImage() {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `processed-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  const [wasmReady, setWasmReady] = useState(false);
  const wasmExportsRef = useRef<{
    mul: (a: number, b: number) => number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { instance } = await WebAssembly.instantiate(wasmImgModule, {});
      wasmExportsRef.current = instance.exports as {
        mul: (a: number, b: number) => number;
      };
      setWasmReady(true);
    })().catch(console.error);
  }, []);

  const [brightnessPct, setBrightnessPct] = useState(120);
  const [processing, setProcessing] = useState(false);

  function processImage() {
    const api = wasmExportsRef.current;
    if (!api) return;
    const src = inputCanvasRef.current;
    const dst = outputCanvasRef.current;
    if (!src || !dst) return;

    const w = src.width;
    const h = src.height;
    if (!w || !h) return;

    dst.width = w;
    dst.height = h;

    const sctx = src.getContext("2d");
    const dctx = dst.getContext("2d");
    if (!sctx || !dctx) return;

    const img = sctx.getImageData(0, 0, w, h);
    const data = img.data;

    setProcessing(true);
    setTimeout(() => {
      const factor = Math.max(0, brightnessPct);
      const factorInt = Math.round((factor / 100) * 255);
      for (let i = 0; i < data.length; i += 4) {
        const r = (api.mul(data[i] | 0, factorInt | 0) / 255) | 0;
        const g = (api.mul(data[i + 1] | 0, factorInt | 0) / 255) | 0;
        const b = (api.mul(data[i + 2] | 0, factorInt | 0) / 255) | 0;
        data[i] = r > 255 ? 255 : r;
        data[i + 1] = g > 255 ? 255 : g;
        data[i + 2] = b > 255 ? 255 : b;
      }
      dctx.putImageData(img, 0, 0);
      setProcessing(false);
    }, 0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low-level Web APIs</CardTitle>
        <CardDescription>
          File API, WebRTC, and WebAssembly working together
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-6">
          <Item className="p-0">
            <ItemHeader className="font-semibold">File API</ItemHeader>
            <ItemContent>
              <ItemDescription>
                Pick a file. Images can be loaded to the "Input" canvas; text
                files show metadata.
              </ItemDescription>
              <div className="mt-3">
                <Input
                  id="file"
                  type="file"
                  onChange={onPickFile}
                  className="cursor-pointer"
                />
              </div>
              {fileInfo && (
                <ItemGroup className="mt-4 gap-3">
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <FileIcon className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{fileInfo.name}</ItemTitle>
                      <ItemDescription>
                        {fileInfo.size.toLocaleString()} bytes · {fileInfo.type}
                      </ItemDescription>
                    </ItemContent>
                    {fileInfo.isImage && (
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadImageToCanvas}
                        >
                          Load to Canvas
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <Hash className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>SHA-256</ItemTitle>
                      <ItemDescription className="font-mono text-xs break-all">
                        {fileInfo.sha256}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                  {fileInfo.preview && (
                    <Item variant="muted">
                      <ItemContent>
                        <ItemTitle>Preview</ItemTitle>
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                          {fileInfo.preview}
                        </pre>
                      </ItemContent>
                    </Item>
                  )}
                </ItemGroup>
              )}
            </ItemContent>
          </Item>{" "}
          <Item className="p-0">
            <ItemHeader className="font-semibold">
              WebRTC Camera
              <Badge
                variant={isCameraOn ? "default" : "secondary"}
                className="ml-2"
              >
                {isCameraOn ? "Active" : "Inactive"}
              </Badge>
            </ItemHeader>
            <ItemContent>
              <ItemDescription>
                Capture a snapshot and it becomes the “Input” for processing.
              </ItemDescription>
              <div className="mt-3 flex items-center gap-2">
                {!isCameraOn ? (
                  <Button onClick={startCamera} size="sm">
                    <Camera className="size-4" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" onClick={stopCamera} size="sm">
                      <CameraOff className="size-4" />
                      Stop
                    </Button>
                    <Button variant="outline" onClick={snapshot} size="sm">
                      Take Snapshot
                    </Button>
                  </>
                )}
              </div>
              <video
                ref={videoRef}
                className="mt-4 w-full rounded-md border bg-muted aspect-video object-contain"
                playsInline
                muted
              />
              {snapshots.length > 0 && (
                <ItemGroup className="mt-4 gap-3">
                  {snapshots.map((snapshot) => (
                    <Item key={snapshot.id} variant="outline">
                      <ItemMedia variant="icon">
                        <ImageIcon className="size-4" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          Snapshot {snapshot.timestamp.toLocaleTimeString()}
                        </ItemTitle>
                        <ItemDescription>
                          {snapshot.width} × {snapshot.height} pixels
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSnapshotToCanvas(snapshot.dataUrl)}
                        >
                          Load to Canvas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSnapshot(snapshot)}
                        >
                          <Download className="size-4" />
                          Download
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </ItemContent>
          </Item>
          <Item className="p-0">
            <ItemHeader className="font-semibold">
              WebAssembly Image Processing
              <Badge
                variant={wasmReady ? "default" : "secondary"}
                className="ml-2"
              >
                {wasmReady ? "Ready" : "Loading"}
              </Badge>
            </ItemHeader>
            <ItemContent>
              <ItemDescription>
                Adjust brightness by calling WASM multiply function per color
                channel.
              </ItemDescription>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Brightness</Label>
                    <Badge variant="outline" className="w-16 justify-center">
                      {brightnessPct}%
                    </Badge>
                  </div>
                  <Slider
                    value={[brightnessPct]}
                    onValueChange={([v]) => setBrightnessPct(v)}
                    min={0}
                    max={300}
                    step={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={processImage}
                    disabled={!wasmReady || processing}
                    size="sm"
                  >
                    {processing ? "Processing…" : "Process Image"}
                  </Button>
                  <Button
                    onClick={downloadProcessedImage}
                    disabled={!outputCanvasRef.current?.width}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="size-4" />
                    Download Output
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Input Canvas
                  </Label>
                  <canvas
                    ref={inputCanvasRef}
                    className="mt-2 w-full rounded-md border bg-muted aspect-video object-contain"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Output Canvas
                  </Label>
                  <canvas
                    ref={outputCanvasRef}
                    className="mt-2 w-full rounded-md border bg-muted aspect-video object-contain"
                  />
                </div>
              </div>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
