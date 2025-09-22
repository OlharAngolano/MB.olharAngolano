import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
        { error: "Apenas administradores podem atribuir badges" },
        { status: 403 }
      );
    }

    const { userId, badgeId } = await request.json();

    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: "ID do usuário e ID do badge são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if badge exists
    const badge = await db.badge.findUnique({
      where: { id: badgeId }
    });

    if (!badge) {
      return NextResponse.json(
        { error: "Badge não encontrado" },
        { status: 404 }
      );
    }

    // Check if user already has this badge
    const existingUserBadge = await db.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: userId,
          badgeId: badgeId
        }
      }
    });

    if (existingUserBadge) {
      return NextResponse.json(
        { error: "Usuário já possui este badge" },
        { status: 400 }
      );
    }

    // Award the badge
    const userBadge = await db.userBadge.create({
      data: {
        userId: userId,
        badgeId: badgeId
      },
      include: {
        badge: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Badge atribuído com sucesso",
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