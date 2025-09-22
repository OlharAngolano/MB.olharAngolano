import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    const events = await db.event.findMany({
      where: {
        startTime: {
          gte: now
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { startTime: "asc" },
      take: 10 // Limit to next 10 events
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}