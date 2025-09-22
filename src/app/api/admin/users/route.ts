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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          isVerified: true,
          verificationType: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              location: true,
              website: true,
              socialLinks: true
            }
          },
          _count: {
            select: {
              posts: true,
              comments: true,
              likes: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
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

    const { userId, ...updateData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isVerified: true,
        verificationType: true,
        avatar: true,
        bio: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user error:", error);
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

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // Don't allow deleting admin users
    const userToDelete = await db.user.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (userToDelete.isAdmin) {
      return NextResponse.json(
        { error: "Não é possível excluir usuários administradores" },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: "Usuário excluído com sucesso"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}