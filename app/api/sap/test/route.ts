import { NextResponse } from "next/server";
import { sapQuery } from "@/lib/server/sql-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabaseRow = Record<string, unknown> & { name: string };

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await sapQuery<DatabaseRow>("SELECT TOP 5 name FROM sys.databases");

    return NextResponse.json({
      success: true,
      rowCount: rows.length,
      rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isConfig = message.includes("Missing required env var");

    console.error("[SAP test] connection failed:", message);

    const devDetail =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? {
            message: err.message,
            code: (err as NodeJS.ErrnoException).code ?? null,
            name: err.name,
          }
        : undefined;

    return NextResponse.json(
      {
        success: false,
        rowCount: 0,
        rows: [],
        error: isConfig
          ? "SAP credentials are not configured."
          : "Failed to connect to SAP SQL Server.",
        ...(devDetail && { dev: devDetail }),
      },
      { status: isConfig ? 503 : 500 },
    );
  }
}
