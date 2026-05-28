import { promises as fs } from "node:fs";
import path from "node:path";

const PROFILE_PATH = path.resolve(
  process.cwd(),
  "..",
  "src",
  "resume_vault",
  "candidate_profile.json"
);

export const runtime = "nodejs";

export async function GET() {
  try {
    const raw = await fs.readFile(PROFILE_PATH, "utf-8");
    const profile = JSON.parse(raw);
    return Response.json(profile, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to read candidate profile.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return Response.json(
        { error: "Invalid payload. Expected a JSON object." },
        { status: 400 }
      );
    }

    await fs.writeFile(PROFILE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to save candidate profile.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
