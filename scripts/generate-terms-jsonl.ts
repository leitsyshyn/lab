// // scripts/generate-terms-jsonl.ts
// import { createWriteStream } from "fs";

// const OUT = "./terms.jsonl";
// const N = 1_000_000;

// // --- 2-letter prefixes only (dense, no overlap with multi-char constructs) ---
// function buildPrefixes(): string[] {
//   const heads = [
//     "a",
//     "e",
//     "i",
//     "o",
//     "u",
//     "s",
//     "t",
//     "r",
//     "n",
//     "m",
//     "l",
//     "c",
//     "d",
//     "p",
//     "b",
//     "g",
//     "h",
//     "f",
//   ];
//   const tails = "abcdefghijklmnopqrstuvwxyz".split("");
//   const res: string[] = [];
//   for (const h of heads) for (const t of tails) res.push(h + t);
//   // ~18*26 = 468; that’s a lot. Keep ~50–80 for heavier per-prefix density:
//   return res.slice(0, 64); // ≈15,625 items per prefix for N=1e6
// }
// const PREFIXES = buildPrefixes();

// // --- 2-letter CV syllables (expanded, all unique, fixed-length) ---
// function buildSyllables(): string[] {
//   const C = [
//     "b",
//     "c",
//     "d",
//     "f",
//     "g",
//     "h",
//     "j",
//     "k",
//     "l",
//     "m",
//     "n",
//     "p",
//     "r",
//     "s",
//     "t",
//     "v",
//     "w",
//     "y",
//     "z",
//   ];
//   const V = ["a", "e", "i", "o", "u"];
//   const S: string[] = [];
//   for (const c of C) for (const v of V) S.push(c + v); // CV
//   for (const c of C) for (const v of V) S.push(c + v); // duplicate pattern to enlarge? no — already unique
//   // Add VC to enlarge alphabet:
//   for (const v of V) for (const c of C) S.push(v + c); // VC
//   // Deduplicate defensively (not strictly necessary here)
//   const uniq = Array.from(new Set(S));
//   // Ensure we have a big base (>= 200); current is 19*5 + 5*19 = 190, so add some extra safe pairs:
//   const extras = [
//     "qa",
//     "qe",
//     "qi",
//     "qo",
//     "qu",
//     "xa",
//     "xe",
//     "xi",
//     "xo",
//     "xu",
//     "za",
//     "ze",
//     "zi",
//     "zo",
//     "zu",
//     "ya",
//     "ye",
//     "yi",
//     "yo",
//     "yu",
//   ];
//   return Array.from(new Set([...uniq, ...extras])); // ~210+
// }
// const SYLS = buildSyllables();
// const B = SYLS.length; // base for digits

// // Length distribution: deterministic but injective wrt index space.
// // 70% => L=2, 25% => L=3, 5% => L=4
// function pickLen(u: number): 2 | 3 | 4 {
//   const t = u % 20;
//   if (t < 14) return 2;
//   if (t < 19) return 3;
//   return 4;
// }

// // Map k -> exactly L base-B digits (least-significant first)
// function baseBdigits(k: number, L: number): number[] {
//   const ds = new Array<number>(L);
//   for (let i = 0; i < L; i++) {
//     ds[i] = k % B;
//     k = Math.floor(k / B);
//   }
//   return ds;
// }

// function makeTerm(prefix: string, digits: number[]): string {
//   let s = prefix;
//   for (const d of digits) s += SYLS[d];
//   return s;
// }

// async function main() {
//   const ws = createWriteStream(OUT, { encoding: "utf8" });

//   const P = PREFIXES.length; // e.g., 64
//   const perPrefix = Math.ceil(N / P);

//   // For each prefix, enumerate unique suffix sequences by a local counter u.
//   // (prefixIdx, u) is unique across the corpus -> unique term.
//   for (let i = 0; i < N; i++) {
//     const seq = i + 1;
//     const id = String(seq);

//     const pIdx = i % P; // round-robin prefixes (keeps collisions dense)
//     const prefix = PREFIXES[pIdx];
//     const u = Math.floor(i / P); // local counter within this prefix: 0..perPrefix-1

//     const L = pickLen(u); // 2 or 3 or 4 syllables (deterministic)
//     const k = u; // bijective within the prefix’s space
//     const digits = baseBdigits(k, L); // unique ordered syllables for this u & L

//     const term = makeTerm(prefix, digits);

//     // WRITE
//     ws.write(JSON.stringify({ id, term, seq }) + "\n");
//   }

//   ws.end();
//   await new Promise<void>((resolve, reject) => {
//     ws.once("finish", () => resolve());
//     ws.once("error", reject);
//   });
//   console.log(
//     "Wrote",
//     OUT,
//     "with",
//     N,
//     "unique rows. B=",
//     B,
//     "P=",
//     PREFIXES.length,
//   );
// }
// main();

// scripts/generate-terms-jsonl.ts
import { createReadStream, createWriteStream } from "fs";
import * as readline from "readline";

const IN = "./title.basics.tsv"; // downloaded & gunzipped IMDb file
const OUT = "./terms.jsonl";

const MAX_DOCS = 1_000_000;

// Focus on “real” film-ish things, skip episodes etc.
const ALLOWED_TYPES = new Set([
  "movie",
  "short",
  "tvMovie",
  "tvSeries",
  "tvMiniSeries",
  "tvShort",
]);

async function main() {
  const rl = readline.createInterface({
    input: createReadStream(IN, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const ws = createWriteStream(OUT, { encoding: "utf8" });

  let lineNo = 0;
  let seq = 0;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) {
      // skip header: tconst  titleType  primaryTitle ...
      continue;
    }
    if (!line) continue;

    const [
      tconst,
      titleType,
      primaryTitle,
      _originalTitle,
      _isAdult,
      _startYear,
      _endYear,
      _runtimeMinutes,
      _genres,
    ] = line.split("\t");

    if (!ALLOWED_TYPES.has(titleType)) continue;
    if (!primaryTitle || primaryTitle === "\\N") continue;

    seq++;
    const doc = {
      id: tconst,
      term: primaryTitle,
      seq,
    };

    ws.write(JSON.stringify(doc) + "\n");

    if (seq >= MAX_DOCS) break;
  }

  ws.end();

  await new Promise<void>((resolve, reject) => {
    ws.on("finish", () => resolve());
    ws.on("error", (err) => reject(err));
  });

  console.log(`Wrote ${seq} documents to ${OUT}`);
}

main().catch((err) => {
  console.error("Failed to generate terms.jsonl", err);
  process.exit(1);
});
