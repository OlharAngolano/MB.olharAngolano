import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const { userId, badgeId } = await request.json();

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: "ID do usuário e ID da badge são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if user already has this badge
    const existingUserBadge = await db.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    if (existingUserBadge) {
      return NextResponse.json(
        { error: "Usuário já possui esta badge" },
        { status: 400 }
      );
    }

    // Award badge to user
    const userBadge = await db.userBadge.create({
      data: {
        userId,
        badgeId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        badge: true
      }
    });

    return NextResponse.json({
      message: "Badge atribuída com sucesso",
      userBadge
    });
  } catch (error) {
    console.error("Award badge error:", error);
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
    const userId = searchParams.get("userId");
    const badgeId = searchParams.get("badgeId");

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: "ID do usuário e ID da badge são obrigatórios" },
        { status: 400 }
      );
    }

    await db.userBadge.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    return NextResponse.json({
      message: "Badge removida com sucesso"
    });
  } catch (error) {
    console.error("Remove badge error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}