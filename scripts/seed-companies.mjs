// One-shot seed: writes the India insurance companies into Firestore `companies`.
// Uses the firebase-tools stored refresh token to mint an access token, then
// pushes each company via the Firestore REST API.
// Run: node scripts/seed-companies.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const companies = [
  "Life Insurance Corporation of India (LIC)",
  "HDFC Life Insurance Company",
  "ICICI Prudential Life Insurance",
  "SBI Life Insurance",
  "Max Life Insurance",
  "Bajaj Allianz Life Insurance",
  "Tata AIA Life Insurance",
  "Aditya Birla Sun Life Insurance",
  "Kotak Mahindra Life Insurance",
  "PNB MetLife India Insurance",
  "Canara HSBC Life Insurance",
  "Axis Max Life Insurance",
  "New India Assurance",
  "United India Insurance",
  "National Insurance Company",
  "Oriental Insurance Company",
  "ICICI Lombard General Insurance",
  "Bajaj Allianz General Insurance",
  "HDFC ERGO General Insurance",
  "IFFCO Tokio General Insurance",
  "Tata AIG General Insurance",
  "Reliance General Insurance",
  "Royal Sundaram General Insurance",
  "Future Generali India Insurance",
  "Go Digit General Insurance",
  "Liberty General Insurance",
  "Zurich Kotak General Insurance",
  "Acko General Insurance",
  "Niva Bupa Health Insurance",
  "Care Health Insurance",
  "Star Health and Allied Insurance",
  "ManipalCigna Health Insurance",
  "General Insurance Corporation of India (GIC Re)",
];

const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
const tokens = JSON.parse(fs.readFileSync(configPath, "utf8")).tokens;

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token mint failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function createCompany(token, name) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/companies?documentId=${id}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          createdAt: { stringValue: now },
          updatedAt: { stringValue: now },
        },
      }),
    }
  );
  if (res.status === 409) {
    console.log(`skip (exists): ${name}`);
    return;
  }
  if (!res.ok) throw new Error(`create ${name} failed: ${res.status} ${await res.text()}`);
  console.log(`created: ${name}`);
}

const token = await getAccessToken();
console.log(`seeding ${companies.length} companies into ${PROJECT_ID}...`);
for (const name of companies) {
  await createCompany(token, name);
}
console.log("done");
