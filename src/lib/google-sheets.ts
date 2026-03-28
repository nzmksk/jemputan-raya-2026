const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const GUESTS_SHEET = "Guests";
const RSVPS_SHEET = "RSVPs";

async function getAccessToken(): Promise<string> {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;

  const pemBody = rawKey.replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
    "",
  );
  const keyDer = Buffer.from(pemBody, "base64");

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPES.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  ).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function encodeRange(range: string) {
  // Encode only spaces and characters that break URL paths; leave !, : and letters as-is
  return range.replace(/ /g, "%20").replace(/'/g, "%27");
}

async function sheetsGet(accessToken: string, range: string) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeRange(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Sheets GET error: ${res.status}`);
  return (await res.json()) as { values?: string[][] };
}

async function sheetsUpdate(
  accessToken: string,
  range: string,
  values: unknown[][],
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeRange(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    },
  );
  if (!res.ok) throw new Error(`Sheets update error: ${res.status}`);
}

async function sheetsAppend(
  accessToken: string,
  range: string,
  values: unknown[][],
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeRange(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    },
  );
  if (!res.ok) throw new Error(`Sheets append error: ${res.status}`);
}

export interface RSVPRecord {
  guestName: string;
  numPeople: number;
  nric: string;
  contact: string;
  plate: string;
  dietary: string[];
  dietaryOther: string;
}

export interface Guest {
  token: string;
  name: string;
  hasRsvp: boolean;
  rsvpAttending: boolean | null;
}

export interface RSVPData {
  token: string;
  guestName: string;
  attending: boolean;
  numPeople: number;
  nric: string;
  contact: string;
  plate: string;
  dietary: string[];
  dietaryOther: string;
}

export async function getGuest(token: string): Promise<Guest | null> {
  const accessToken = await getAccessToken();

  const [guestsRes, rsvpsRes] = await Promise.all([
    sheetsGet(accessToken, `${GUESTS_SHEET}!A:B`),
    sheetsGet(accessToken, `${RSVPS_SHEET}!A:C`),
  ]);

  const guestRows = guestsRes.values ?? [];
  const rsvpRows = rsvpsRes.values ?? [];
  const rsvpMap = new Map(
    rsvpRows.slice(1).map((row) => [row[0] as string, row[2] as string]),
  );

  for (let i = 1; i < guestRows.length; i++) {
    const [rowToken, rowName] = guestRows[i];
    if (rowToken === token) {
      const attendingStr = rsvpMap.get(token);
      return {
        token,
        name: rowName ?? "Guest",
        hasRsvp: rsvpMap.has(token),
        rsvpAttending: attendingStr == null ? null : attendingStr === "YES",
      };
    }
  }

  return null;
}

export async function getRsvp(token: string): Promise<RSVPRecord | null> {
  const accessToken = await getAccessToken();
  const res = await sheetsGet(accessToken, `${RSVPS_SHEET}!A:I`);
  const rows = res.values ?? [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      const [, guestName, , numPeopleStr, nric, contact, plate, , dietaryStr] = rows[i];
      const parts = dietaryStr ? dietaryStr.split(", ") : [];
      const dietary = parts.filter((d: string) => !d.startsWith("Other: "));
      const otherPart = parts.find((d: string) => d.startsWith("Other: "));
      return {
        guestName: guestName ?? "",
        numPeople: parseInt(numPeopleStr, 10) || 1,
        nric: nric === "-" ? "" : (nric ?? ""),
        contact: contact === "-" ? "" : (contact ?? ""),
        plate: plate === "-" ? "" : (plate ?? ""),
        dietary,
        dietaryOther: otherPart ? otherPart.replace("Other: ", "") : "",
      };
    }
  }
  return null;
}

export async function updateRsvp(token: string, data: RSVPData): Promise<void> {
  const accessToken = await getAccessToken();
  const tokenRes = await sheetsGet(accessToken, `${RSVPS_SHEET}!A:A`);
  const rows = tokenRes.values ?? [];

  let rowNum = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      rowNum = i + 1;
      break;
    }
  }
  if (rowNum === -1) throw new Error("RSVP record not found");

  const dietaryFull = [
    ...data.dietary,
    ...(data.dietaryOther ? [`Other: ${data.dietaryOther}`] : []),
  ].join(", ");

  const now = new Date().toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  await sheetsUpdate(accessToken, `${RSVPS_SHEET}!A${rowNum}:J${rowNum}`, [
    [
      data.token,
      data.guestName,
      data.attending ? "YES" : "NO",
      data.attending ? data.numPeople : 0,
      data.nric || "-",
      data.contact || "-",
      data.attending ? data.plate || "-" : "-",
      data.attending ? dietaryFull || "-" : "-",
      now,
    ],
  ]);
}

export async function submitRSVP(data: RSVPData): Promise<void> {
  const accessToken = await getAccessToken();

  const dietaryFull = [
    ...data.dietary,
    ...(data.dietaryOther ? [`Other: ${data.dietaryOther}`] : []),
  ].join(", ");

  const now = new Date().toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  await sheetsAppend(accessToken, `${RSVPS_SHEET}!A:J`, [
    [
      data.token,
      data.guestName,
      data.attending ? "YES" : "NO",
      data.attending ? data.numPeople : 0,
      data.nric || "-",
      data.contact || "-",
      data.attending ? data.plate || "-" : "-",
      data.attending ? dietaryFull || "-" : "-",
      now,
    ],
  ]);
}
