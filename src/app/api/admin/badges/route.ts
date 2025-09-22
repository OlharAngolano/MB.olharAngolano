import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await db.user.findUnique({
      where: { id: session.value }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const badges = await db.badge.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
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
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await db.user.findUnique({
      where: { id: session.value }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const { name, description, icon, color, category } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Nome e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    const badge = await db.badge.create({
      data: {
        name,
        description,
        icon: icon || "🏆",
        color: color || "#FFD700",
        category: category || "achievement"
      }
    });

    return NextResponse.json({
      message: "Badge criada com sucesso",
      badge
    });
  } catch (error) {
    console.error("Create badge error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await db.user.findUnique({
      where: { id: session.value }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const { badgeId, ...updateData } = await request.json();

    if (!badgeId) {
      return NextResponse.json(
        { error: "ID da badge é obrigatório" },
        { status: 400 }
      );
    }

    const updatedBadge = await db.badge.update({
      where: { id: badgeId },
      data: updateData
    });

    return NextResponse.json({
      message: "Badge atualizada com sucesso",
      badge: updatedBadge
    });
  } catch (error) {
    console.error("Update badge error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await db.user.findUnique({
      where: { id: session.value }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const badgeId = searchParams.get("badgeId");

    if (!badgeId) {
      return NextResponse.json(
        { error: "ID da badge é obrigatório" },
        { status: 400 }
      );
    }

    // Delete user badges first
    await db.userBadge.deleteMany({
      where: { badgeId }
    });

    // Delete badge
    await db.badge.delete({
      where: { id: badgeId }
    });

    return NextResponse.json({
      message: "Badge excluída com sucesso"
    });
  } catch (error) {
    console.error("Delete badge error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}