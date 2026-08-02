// One-shot seed: writes insurance types into Firestore `insuranceTypes`.
// Uses the firebase-tools stored refresh token to mint an access token, then
// pushes each type via the Firestore REST API.
// Run: node scripts/seed-insurance-types.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

// name -> category (used as description)
const types = {
  // 1. Life
  "Term Life Insurance": "Life Insurance",
  "Whole Life Insurance": "Life Insurance",
  "Endowment Plan": "Life Insurance",
  "Unit Linked Insurance Plan (ULIP)": "Life Insurance",
  "Money Back Plan": "Life Insurance",
  "Child Insurance Plan": "Life Insurance",
  "Retirement/Pension Plan": "Life Insurance",
  "Group Term Life Insurance": "Life & Employee Benefits",
  "Group Health Insurance": "Life & Employee Benefits",
  "Group Personal Accident Insurance": "Life & Employee Benefits",
  "Keyman Insurance": "Life & Employee Benefits",
  "Employee Deposit Linked Insurance (EDLI)": "Life & Employee Benefits",
  // 2. Health
  "Individual Health Insurance": "Health Insurance",
  "Family Floater Health Insurance": "Health Insurance",
  "Senior Citizen Health Insurance": "Health Insurance",
  "Critical Illness Insurance": "Health Insurance",
  "Personal Accident Insurance": "Health Insurance",
  "Top-up & Super Top-up Health Insurance": "Health Insurance",
  "Family Floater Insurance": "Health Insurance",
  // 3. Motor
  "Two-Wheeler Insurance": "Motor Insurance",
  "Car Insurance": "Motor Insurance",
  "Commercial Vehicle Insurance": "Motor Insurance",
  "Third-Party Insurance": "Motor Insurance",
  "Comprehensive Insurance": "Motor Insurance",
  "Private Car Insurance": "Motor Insurance",
  "Fleet Insurance": "Motor Insurance",
  // 4. Property
  "Home Insurance": "Property Insurance",
  "Fire Insurance": "Property Insurance",
  "Shop Insurance": "Property Insurance",
  "Office Insurance": "Property Insurance",
  "Factory/Industrial Insurance": "Property Insurance",
  "Fire & Special Perils Insurance": "Property Insurance",
  "Standard Fire & Special Perils Policy": "Property Insurance",
  "Burglary Insurance": "Property Insurance",
  "Industrial All Risk (IAR) Insurance": "Property Insurance",
  "Machinery Breakdown Insurance": "Property Insurance",
  "Electronic Equipment Insurance": "Property Insurance",
  "Boiler & Pressure Plant Insurance": "Property Insurance",
  // 5. Engineering
  "Contractors All Risk (CAR) Insurance": "Engineering Insurance",
  "Erection All Risk (EAR) Insurance": "Engineering Insurance",
  "Contractors Plant & Machinery (CPM) Insurance": "Engineering Insurance",
  "Machinery Loss of Profits (MLOP) Insurance": "Engineering Insurance",
  "Deterioration of Stock Insurance": "Engineering Insurance",
  "Civil Engineering Completed Risks (CECR) Insurance": "Engineering Insurance",
  // 6. Marine
  "Marine Cargo Insurance": "Marine Insurance",
  "Marine Hull Insurance": "Marine Insurance",
  "Inland Transit Insurance": "Marine Insurance",
  "Cargo Insurance": "Marine Insurance",
  // 7. Liability
  "Public Liability Insurance": "Liability Insurance",
  "Product Liability Insurance": "Liability Insurance",
  "Employers' Liability Insurance": "Liability Insurance",
  "Workmen Compensation (WC) Insurance / Employees' Compensation Insurance": "Liability Insurance",
  "Professional Indemnity Insurance": "Liability Insurance",
  "Directors & Officers (D&O) Liability Insurance": "Liability Insurance",
  "Commercial General Liability (CGL) Insurance": "Liability Insurance",
  "Errors & Omissions (E&O) Insurance": "Liability Insurance",
  "Cyber Liability Insurance": "Liability Insurance",
  // 8. Financial & Crime
  "Fidelity Guarantee Insurance": "Financial & Crime Insurance",
  "Bankers Indemnity Insurance": "Financial & Crime Insurance",
  "Crime Insurance": "Financial & Crime Insurance",
  "Credit Insurance": "Financial & Crime Insurance",
  // 9. Business protection
  "Business Interruption (Loss of Profit) Insurance": "Business Insurance",
  "Loss of Rent Insurance": "Business Insurance",
  "Trade Credit Insurance": "Business Insurance",
  "Event Cancellation Insurance": "Business Insurance",
  "Business Interruption Insurance": "Business Insurance",
  "Marine Insurance": "Business Insurance",
  "Liability Insurance": "Business Insurance",
  "Directors & Officers (D&O) Insurance": "Business Insurance",
  "Cyber Insurance": "Business Insurance",
  // 10. Travel
  "Domestic Travel Insurance": "Travel Insurance",
  "International Travel Insurance": "Travel Insurance",
  "Student Travel Insurance": "Travel Insurance",
  // 11. Agriculture
  "Crop Insurance": "Agriculture Insurance",
  "Livestock Insurance": "Agriculture Insurance",
  "Poultry Insurance": "Agriculture Insurance",
  // 12. Specialty
  "Pet Insurance": "Specialty Insurance",
  "Mobile & Gadget Insurance": "Specialty Insurance",
  "Jewellery Insurance": "Specialty Insurance",
  "Event Insurance": "Specialty Insurance",
  "Wedding Insurance": "Specialty Insurance",
  // 13. Other
  "Education Insurance": "Other Insurance",
  "Loan Protection Insurance": "Other Insurance",
  "Group Insurance": "Other Insurance",
};

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

async function createType(token, name, category) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/insuranceTypes?documentId=${id}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          description: { stringValue: category },
          createdAt: { stringValue: now },
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
console.log(`seeding ${Object.keys(types).length} insurance types into ${PROJECT_ID}...`);
for (const [name, category] of Object.entries(types)) {
  await createType(token, name, category);
}
console.log("done");
