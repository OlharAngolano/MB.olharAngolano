import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const defaultBadges = [
  {
    name: "Primeiro Post",
    description: "Criou seu primeiro post na comunidade",
    icon: "🎯",
    color: "#FFD700",
    category: "achievement"
  },
  {
    name: "Membro VIP",
    description: "Membro ativo e engajado da comunidade",
    icon: "⭐",
    color: "#FF6B6B",
    category: "vip"
  },
  {
    name: "Ajuda Comunitária",
    description: "Ajudou outros membros com respostas úteis",
    icon: "🤝",
    color: "#4ECDC4",
    category: "achievement"
  },
  {
    name: "Comentador Ativo",
    description: "Fez 50 comentários na comunidade",
    icon: "💬",
    color: "#45B7D1",
    category: "achievement"
  },
  {
    name: "Curtidor",
    description: "Curtiu 100 posts",
    icon: "❤️",
    color: "#FF69B4",
    category: "achievement"
  },
  {
    name: "Compartilhador",
    description: "Compartilhou 25 posts",
    icon: "🔄",
    color: "#9B59B6",
    category: "achievement"
  },
  {
    name: "Veterano",
    description: "Membro há mais de 1 ano",
    icon: "🏅",
    color: "#F39C12",
    category: "special"
  },
  {
    name: "Criador de Conteúdo",
    description: "Criou 10 posts com destaque",
    icon: "🎨",
    color: "#E74C3C",
    category: "achievement"
  }
];

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
        { error: "Apenas administradores podem inicializar badges" },
        { status: 403 }
      );
    }

    const createdBadges = [];
    const skippedBadges = [];

    for (const badgeData of defaultBadges) {
      // Check if badge already exists
      const existingBadge = await db.badge.findUnique({
        where: { name: badgeData.name }
      });

      if (existingBadge) {
        skippedBadges.push(badgeData.name);
        continue;
      }

      // Create the badge
      const badge = await db.badge.create({
        data: badgeData
      });

      createdBadges.push(badge);
    }

    return NextResponse.json({
      message: "Inicialização de badges concluída",
      created: createdBadges.length,
      skipped: skippedBadges.length,
      createdBadges,
      skippedBadges
    });
  } catch (error) {
    console.error("Initialize badges error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}