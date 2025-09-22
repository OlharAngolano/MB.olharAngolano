import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const events = await db.event.findMany({
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
      skip: offset,
      take: limit
    });

    const total = await db.event.count();

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: sessionId }
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar eventos" },
        { status: 403 }
      );
    }

    const { title, description, startTime, endTime, location, isVirtual, maxAttendees } = await request.json();

    if (!title?.trim() || !description?.trim() || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Título, descrição, data de início e data de término são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "A data de início deve ser anterior à data de término" },
        { status: 400 }
      );
    }

    const event = await db.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        startTime: startDate,
        endTime: endDate,
        location: location?.trim(),
        isVirtual: isVirtual || false,
        maxAttendees: maxAttendees,
        createdBy: user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}