import { createReadStream, createWriteStream } from "fs";
import * as readline from "readline";
import Typesense from "typesense";

const IN_TSV = "/Users/tymofii.leitsyshyn/Downloads/title.basics.tsv";
const OUT_JSONL = "./terms.jsonl";

const MAX_DOCS = 1_000_000;
const CHUNK_SIZE = 50_000;

// Film-ish types only, skip episodes etc.
const ALLOWED_TYPES = new Set([
  "movie",
  "short",
  "tvMovie",
  "tvSeries",
  "tvMiniSeries",
  "tvShort",
]);

type TermDoc = {
  id: string;
  term: string;
  seq: number;
  year?: number;
  titleType?: string;
};

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TS_HOST!,
      port: Number(process.env.TS_PORT ?? 443),
      protocol: process.env.TS_PROTOCOL ?? "https",
    },
  ],
  apiKey: process.env.TS_ADMIN_KEY!,
  connectionTimeoutSeconds: 60,
});

async function generateJsonl(): Promise<number> {
  console.log("Generating terms.jsonl from", IN_TSV);

  const rl = readline.createInterface({
    input: createReadStream(IN_TSV, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const ws = createWriteStream(OUT_JSONL, { encoding: "utf8" });

  let lineNo = 0;
  let seq = 0;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) {
      // header: tconst  titleType  primaryTitle  originalTitle  isAdult  startYear ...
      continue;
    }
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 6) continue;

    const [
      tconst,
      titleType,
      primaryTitle,
      _originalTitle,
      isAdult,
      startYear,
      // ...rest ignored
    ] = parts;

    if (!ALLOWED_TYPES.has(titleType)) continue;
    if (!primaryTitle || primaryTitle === "\\N") continue;
    if (isAdult === "1") continue;

    const doc: TermDoc = {
      id: tconst,
      term: primaryTitle,
      seq: ++seq,
      titleType, // always a string for allowed types
    };

    if (startYear && startYear !== "\\N") {
      const parsed = parseInt(startYear, 10);
      if (!Number.isNaN(parsed)) {
        doc.year = parsed; // ONLY set when valid, never null
      }
    }

    ws.write(JSON.stringify(doc) + "\n");

    if (seq >= MAX_DOCS) break;
  }

  ws.end();

  await new Promise<void>((resolve, reject) => {
    ws.on("finish", () => resolve());
    ws.on("error", (err) => reject(err));
  });

  console.log(`Generated ${seq} documents into ${OUT_JSONL}`);
  return seq;
}

async function recreateCollection() {
  try {
    console.log('Dropping collection "terms" if it exists...');
    await client.collections("terms").delete();
    console.log('Dropped existing collection "terms".');
  } catch (err: any) {
    console.log(
      'Collection "terms" did not exist or could not be deleted, continuing.',
    );
  }

  console.log('Creating collection "terms"...');

  await client.collections().create({
    name: "terms",
    fields: [
      { name: "id", type: "string" },
      { name: "term", type: "string", facet: true },
      { name: "seq", type: "int32" },
      { name: "year", type: "int32", optional: true },
      { name: "titleType", type: "string", facet: true, optional: true },
    ],
    default_sorting_field: "seq",
  });

  console.log('Created collection "terms" with new schema.');
}

async function importJsonl() {
  console.log("Importing JSONL into Typesense from", OUT_JSONL);

  const rl = readline.createInterface({
    input: createReadStream(OUT_JSONL, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let buffer: string[] = [];
  let imported = 0;
  let batch = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    buffer.push(line);

    if (buffer.length >= CHUNK_SIZE) {
      batch++;
      const payload = buffer.join("\n") + "\n";

      console.log(
        `Importing batch ${batch} (${buffer.length} docs, total so far: ${imported})...`,
      );

      try {
        const result = await client
          .collections("terms")
          .documents()
          .import(payload, { action: "upsert" });

        const lines = String(result).split("\n");
        const errLines = lines.filter((l) => l.includes('"success":false'));
        if (errLines.length > 0) {
          console.warn(
            `Batch ${batch} had ${errLines.length} failed documents, first error:`,
          );
          console.warn(errLines[0]);
        }
      } catch (err: any) {
        console.error(
          `Batch ${batch} import failed with httpStatus=${err?.httpStatus}, message=${err?.message}`,
        );
        throw err;
      }

      imported += buffer.length;
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    batch++;
    const payload = buffer.join("\n") + "\n";

    console.log(
      `Importing final batch ${batch} (${buffer.length} docs, total so far: ${imported})...`,
    );

    try {
      const result = await client
        .collections("terms")
        .documents()
        .import(payload, { action: "upsert" });

      const lines = String(result).split("\n");
      const errLines = lines.filter((l) => l.includes('"success":false'));
      if (errLines.length > 0) {
        console.warn(
          `Final batch had ${errLines.length} failed documents, first error:`,
        );
        console.warn(errLines[0]);
      }
    } catch (err: any) {
      console.error(
        `Final batch import failed with httpStatus=${err?.httpStatus}, message=${err?.message}`,
      );
      throw err;
    }

    imported += buffer.length;
  }

  console.log(`Imported ${imported} documents in total.`);
}

async function main() {
  console.log("Seeding Typesense with IMDb titles...");
  console.log("Typesense config:", {
    host: process.env.TS_HOST,
    port: process.env.TS_PORT,
    protocol: process.env.TS_PROTOCOL,
    hasAdminKey: !!process.env.TS_ADMIN_KEY,
  });

  const count = await generateJsonl();
  console.log(`JSONL generated (${count} docs). Recreating collection...`);

  await recreateCollection();
  await importJsonl();

  console.log("Done seeding Typesense.");
}

main().catch((err) => {
  console.error("Failed to seed Typesense", err);
  process.exit(1);
});
