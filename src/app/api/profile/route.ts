import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const session = request.cookies.get("session");
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify user
    const user = await db.user.findUnique({
      where: { id: session.value },
      include: {
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const { name, bio, avatar, profile } = await request.json();

    // Update user basic info
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        bio: bio || user.bio,
        avatar: avatar || user.avatar
      },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true
          }
        }
      }
    });

    // Update or create profile
    if (profile) {
      if (user.profile) {
        await db.profile.update({
          where: { userId: user.id },
          data: {
            location: profile.location || user.profile.location,
            website: profile.website || user.profile.website,
            socialLinks: profile.socialLinks || user.profile.socialLinks
          }
        });
      } else {
        await db.profile.create({
          data: {
            userId: user.id,
            location: profile.location || null,
            website: profile.website || null,
            socialLinks: profile.socialLinks || {}
          }
        });
      }
    }

    // Get updated user with profile
    const finalUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        badges: {
          include: {
            badge: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      user: {
        id: finalUser!.id,
        email: finalUser!.email,
        name: finalUser!.name,
        isAdmin: finalUser!.isAdmin,
        isVerified: finalUser!.isVerified,
        verificationType: finalUser!.verificationType,
        avatar: finalUser!.avatar,
        bio: finalUser!.bio,
        profile: finalUser!.profile,
        badges: finalUser!.badges.map(ub => ub.badge)
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
