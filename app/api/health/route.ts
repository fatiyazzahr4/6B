import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [timeRows, accountCount] = await Promise.all([
      prisma.$queryRaw<{ current_time: Date }[]>`SELECT NOW() AS current_time`,
      prisma.akun.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        currentTime: timeRows[0].current_time,
        accountCount,
      },
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { success: false, message: "Database connection is unavailable." },
      { status: 503 },
    );
  }
}
