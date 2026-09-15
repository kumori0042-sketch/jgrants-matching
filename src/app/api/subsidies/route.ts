import { NextRequest, NextResponse } from "next/server";

const JGRANTS_ENDPOINT = "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies";
const SORTABLE = new Set(["acceptance_end_datetime", "created_date", "subsidy_max_limit"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword")?.trim() ?? "";

  if (keyword.length < 2) {
    return NextResponse.json(
      { error: "検索キーワードは2文字以上で入力してください。" },
      { status: 400 }
    );
  }

  const sort = SORTABLE.has(searchParams.get("sort") ?? "")
    ? (searchParams.get("sort") as string)
    : "acceptance_end_datetime";
  const order = searchParams.get("order") === "DESC" ? "DESC" : "ASC";
  const acceptance = searchParams.get("acceptance") === "0" ? "0" : "1";

  const upstream = new URL(JGRANTS_ENDPOINT);
  upstream.searchParams.set("keyword", keyword);
  upstream.searchParams.set("sort", sort);
  upstream.searchParams.set("order", order);
  upstream.searchParams.set("acceptance", acceptance);

  const targetArea = searchParams.get("target_area_search");
  if (targetArea) upstream.searchParams.set("target_area_search", targetArea);

  const employees = searchParams.get("target_number_of_employees");
  if (employees) upstream.searchParams.set("target_number_of_employees", employees);

  try {
    const upstreamRes = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `jGrants APIエラー (${upstreamRes.status})` },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "検索中にエラーが発生しました。" }, { status: 502 });
  }
}
