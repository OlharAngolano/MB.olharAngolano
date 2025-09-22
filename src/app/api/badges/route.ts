import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const badges = await db.badge.findMany({
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ]
    });

    return NextResponse.json({ badges });
  } catch (error) {
    console.error("Get badges error:", error);
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
        { error: "Apenas administradores podem criar badges" },
        { status: 403 }
      );
    }

    const { name, description, icon, color, category } = await request.json();

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Nome e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if badge already exists
    const existingBadge = await db.badge.findUnique({
      where: { name: name.trim() }
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: "Já existe um badge com este nome" },
        { status: 400 }
      );
    }

    const badge = await db.badge.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        icon: icon || "🏆",
        color: color || "#FFD700",
        category: category || "achievement"
      }
    });

    return NextResponse.json({ badge });
  } catch (error) {
    console.error("Create badge error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}