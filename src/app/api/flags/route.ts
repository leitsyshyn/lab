import { type ApiData, verifyAccess } from "flags";
import { getProviderData } from "flags/next";
import { type NextRequest, NextResponse } from "next/server";
import { plusPlanFeatureFlag } from "@/lib/flags";

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get("Authorization"));
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const providerData = await getProviderData({
      plusPlanFeatureFlag,
    });

    return NextResponse.json<ApiData>(providerData);
  } catch (error) {
    console.error("Error fetching flags provider data:", error);
    return NextResponse.json(
      { error: "Failed to fetch flags data" },
      { status: 500 },
    );
  }
}
