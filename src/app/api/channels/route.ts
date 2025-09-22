import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const channels = await db.channel.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            messages: true
          }
        }
      },
      orderBy: [
        { isPrivate: "asc" },
        { name: "asc" }
      ]
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Get channels error:", error);
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
        { error: "Apenas administradores podem criar canais" },
        { status: 403 }
      );
    }

    const { name, description, icon, color, isPrivate } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "O nome do canal é obrigatório" },
        { status: 400 }
      );
    }

    // Check if channel already exists
    const existingChannel = await db.channel.findUnique({
      where: { name: name.trim() }
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: "Já existe um canal com este nome" },
        { status: 400 }
      );
    }

    const channel = await db.channel.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        icon: icon || "💬",
        color: color || "#FF0000",
        isPrivate: isPrivate || false
      },
      include: {
        _count: {
          select: {
            posts: true,
            messages: true
          }
        }
      }
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Create channel error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}