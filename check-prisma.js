/**
 * Prisma Schema Hash Checker
 *
 * Compares current schema.prisma hash against cached hash.
 * Returns exit code 0 if unchanged (skip generate), 1 if changed (need generate).
 *
 * Usage: node check-prisma.js
 *        node check-prisma.js --update   (update cached hash)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SCHEMA_PATH = path.join(__dirname, "prisma", "schema.prisma");
const SEED_PATH = path.join(__dirname, "prisma", "seed.ts");
const HASH_CACHE_PATH = path.join(__dirname, "prisma", ".schema-hash");
const HASH_CACHE_SEED = path.join(__dirname, "prisma", ".seed-hash");

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf-8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readCache(cachePath) {
  try {
    return fs.readFileSync(cachePath, "utf-8").trim();
  } catch {
    return "";
  }
}

function writeCache(cachePath, hash) {
  fs.writeFileSync(cachePath, hash, "utf-8");
}

const schemaHash = hashFile(SCHEMA_PATH);
const seedHash = hashFile(SEED_PATH);
const cachedSchemaHash = readCache(HASH_CACHE_PATH);
const cachedSeedHash = readCache(HASH_CACHE_SEED);

const schemaChanged = schemaHash !== cachedSchemaHash;
const seedChanged = seedHash !== cachedSeedHash;

const shouldUpdate = process.argv.includes("--update");

if (shouldUpdate) {
  writeCache(HASH_CACHE_PATH, schemaHash);
  writeCache(HASH_CACHE_SEED, seedHash);
  console.log(`Schema hash updated: ${schemaHash.slice(0, 12)}...`);
  console.log(`Seed hash updated: ${seedHash.slice(0, 12)}...`);
  process.exit(0);
}

if (schemaChanged) {
  console.log(`Schema changed: ${cachedSchemaHash.slice(0, 12) || "none"} → ${schemaHash.slice(0, 12)}...`);
  process.exit(1);
}

if (seedChanged) {
  console.log(`Seed changed: ${cachedSeedHash.slice(0, 12) || "none"} → ${seedHash.slice(0, 12)}...`);
  process.exit(1);
}

console.log(`Schema unchanged (${schemaHash.slice(0, 12)}...) — skip generate`);
process.exit(0);
