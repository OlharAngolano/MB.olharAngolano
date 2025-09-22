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
    const type = searchParams.get("type") || "posts"; // posts, comments
    const offset = (page - 1) * limit;

    if (type === "posts") {
      // Build where clause for search
      const where = search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } }
            ]
          }
        : {};

      const [posts, total] = await Promise.all([
        db.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            channel: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                shares: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit
        }),
        db.post.count({ where })
      ]);

      return NextResponse.json({
        type: "posts",
        data: posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // Comments
      const where = search
        ? {
            OR: [
              { content: { contains: search, mode: "insensitive" } },
              {
                post: {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { content: { contains: search, mode: "insensitive" } }
                  ]
                }
              }
            ]
          }
        : {};

      const [comments, total] = await Promise.all([
        db.comment.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            post: {
              select: {
                id: true,
                title: true,
                content: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit
        }),
        db.comment.count({ where })
      ]);

      return NextResponse.json({
        type: "comments",
        data: comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error("Get content error:", error);
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

    const { type, id, ...updateData } = await request.json();

    if (!type || !id) {
      return NextResponse.json(
        { error: "Tipo e ID são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "posts") {
      const updatedPost = await db.post.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      });

      return NextResponse.json({
        message: "Post atualizado com sucesso",
        data: updatedPost
      });
    } else if (type === "comments") {
      const updatedComment = await db.comment.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true
            }
          }
        }
      });

      return NextResponse.json({
        message: "Comentário atualizado com sucesso",
        data: updatedComment
      });
    } else {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Update content error:", error);
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
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Tipo e ID são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "posts") {
      await db.post.delete({
        where: { id }
      });

      return NextResponse.json({
        message: "Post excluído com sucesso"
      });
    } else if (type === "comments") {
      await db.comment.delete({
        where: { id }
      });

      return NextResponse.json({
        message: "Comentário excluído com sucesso"
      });
    } else {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Delete content error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}