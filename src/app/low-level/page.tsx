"use client";

import { Camera, CameraOff, FileIcon, Hash } from "lucide-react";
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
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

function bytesToHex(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes);
  let hex = "";
  for (let i = 0; i < view.length; i++)
    hex += view[i].toString(16).padStart(2, "0");
  return hex;
}

const wasmMulModule = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 2, 127, 127, 1, 127, 3, 2, 1, 0, 7,
  7, 1, 3, 109, 117, 108, 0, 0, 10, 9, 1, 7, 0, 32, 0, 32, 1, 108, 11,
]);

export default function LowLevelApisPage() {
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
    sha256?: string;
    preview?: string;
  } | null>(null);
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
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
    });
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    setIsCameraOn(true);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => void t.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  }

  function snapshot() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 640;
    const h = v.videoHeight || 480;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
  }

  const [wasmReady, setWasmReady] = useState(false);
  const [nInput, setNInput] = useState("10");
  const [factorialResult, setFactorialResult] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const wasmExportsRef = useRef<{
    mul: (a: number, b: number) => number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { instance } = await WebAssembly.instantiate(wasmMulModule, {});
      wasmExportsRef.current = instance.exports as {
        mul: (a: number, b: number) => number;
      };
      setWasmReady(true);
    })().catch(console.error);
  }, []);

  function calculateFactorial() {
    const mul = wasmExportsRef.current?.mul;
    if (!mul) return;
    const n = Number.parseInt(nInput, 10);
    if (Number.isNaN(n) || n < 0 || n > 12) return;
    setCalculating(true);
    setTimeout(() => {
      let acc = 1;
      for (let i = 2; i <= n; i++) acc = mul(acc | 0, i | 0) | 0;
      setFactorialResult(acc);
      setCalculating(false);
    }, 0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low-level Web APIs</CardTitle>
        <CardDescription>
          File processing, camera access, and WebAssembly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-6">
          <Item className="p-0">
            <ItemHeader className="font-semibold">File API</ItemHeader>
            <ItemContent>
              <ItemDescription>
                Select a file to compute its SHA-256 and view metadata
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
                  <Item variant="outline" size="sm">
                    <ItemMedia variant="icon">
                      <FileIcon className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{fileInfo.name}</ItemTitle>
                      <ItemDescription>
                        {fileInfo.size.toLocaleString()} bytes · {fileInfo.type}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                  <Item variant="outline" size="sm">
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
                    <Item variant="muted" size="sm">
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
          </Item>

          <Item className="p-0">
            <ItemHeader className="font-semibold">
              WebRTC Camera
              <Badge variant={isCameraOn ? "default" : "secondary"}>
                {isCameraOn ? "Active" : "Inactive"}
              </Badge>
            </ItemHeader>
            <ItemContent>
              <ItemDescription>
                Access your camera and capture snapshots
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
                    <Button
                      variant="outline"
                      onClick={snapshot}
                      disabled={!isCameraOn}
                      size="sm"
                    >
                      Take Snapshot
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Live Feed
                  </div>
                  <video
                    ref={videoRef}
                    className="w-full rounded-md border bg-muted aspect-video object-contain"
                    playsInline
                    muted
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Snapshot
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="w-full rounded-md border bg-muted aspect-video object-contain"
                  />
                </div>
              </div>
            </ItemContent>
          </Item>

          <Item className="p-0">
            <ItemHeader className="font-semibold">
              WebAssembly
              <Badge variant={wasmReady ? "default" : "secondary"}>
                {wasmReady ? "Ready" : "Loading"}
              </Badge>
            </ItemHeader>
            <ItemContent>
              <ItemDescription>
                Compute n! by repeatedly multiplying in WASM (safe for n ≤ 12)
              </ItemDescription>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={nInput}
                  onChange={(e) => setNInput(e.target.value)}
                  placeholder="Enter n (0–12)"
                  className="flex-1"
                  disabled={!wasmReady}
                />
                <Button
                  onClick={calculateFactorial}
                  disabled={!wasmReady || calculating}
                  size="sm"
                >
                  {calculating ? "Calculating..." : "Calculate"}
                </Button>
              </div>
              {factorialResult !== null && (
                <Item variant="outline" size="sm" className="mt-3">
                  <ItemContent>
                    <ItemTitle>{nInput}! (factorial)</ItemTitle>
                    <ItemDescription className="font-mono text-base">
                      {factorialResult.toLocaleString()}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )}
              <Item variant="muted" size="sm" className="mt-3">
                <ItemContent>
                  <ItemDescription className="text-xs">
                    Using a tiny WASM module that exports{" "}
                    <code>mul(i32,i32)</code>; factorial is calculated by
                    looping in JS. i32 overflows past 12!.
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
