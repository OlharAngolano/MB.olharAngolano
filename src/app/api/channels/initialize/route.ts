import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const defaultChannels = [
  {
    name: "Dúvidas sobre YouTube",
    description: "Tire suas dúvidas sobre criação de conteúdo, SEO e monetização no YouTube",
    icon: "🎥",
    color: "#FF0000"
  },
  {
    name: "Equipamentos e Dicas de Edição",
    description: "Compartilhe dicas sobre câmeras, microfones, iluminação e softwares de edição",
    icon: "📹",
    color: "#4A90E2"
  },
  {
    name: "Marketing Digital e Parcerias",
    description: "Discuta estratégias de marketing, parcerias e crescimento de audiência",
    icon: "📈",
    color: "#50E3C2"
  },
  {
    name: "Geral",
    description: "Conversas gerais e networking entre membros da comunidade",
    icon: "💬",
    color: "#F5A623"
  },
  {
    name: "Feedback e Críticas",
    description: "Compartilhe seu conteúdo e receba feedback construtivo da comunidade",
    icon: "🎯",
    color: "#BD10E0"
  },
  {
    name: "Oportunidades",
    description: "Compartilhe oportunidades de colaboração, patrocínios e projetos",
    icon: "🌟",
    color: "#7ED321"
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
        { error: "Apenas administradores podem inicializar canais" },
        { status: 403 }
      );
    }

    const createdChannels = [];
    const skippedChannels = [];

    for (const channelData of defaultChannels) {
      // Check if channel already exists
      const existingChannel = await db.channel.findUnique({
        where: { name: channelData.name }
      });

      if (existingChannel) {
        skippedChannels.push(channelData.name);
        continue;
      }

      // Create the channel
      const channel = await db.channel.create({
        data: {
          ...channelData,
          isPrivate: false
        }
      });

      createdChannels.push(channel);
    }

    return NextResponse.json({
      message: "Inicialização de canais concluída",
      created: createdChannels.length,
      skipped: skippedChannels.length,
      createdChannels,
      skippedChannels
    });
  } catch (error) {
    console.error("Initialize channels error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}