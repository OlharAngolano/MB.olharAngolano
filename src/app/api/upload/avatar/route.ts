import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { db } from "@/lib/db";

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
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

    // Verify user
    const user = await db.user.findUnique({
      where: { id: session.value }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get("avatar") as unknown as File;
    const positionData = data.get("position") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Parse position data if provided
    let position: ImagePosition | null = null;
    if (positionData) {
      try {
        position = JSON.parse(positionData);
      } catch (error) {
        console.error("Error parsing position data:", error);
        // Continue with default positioning
      }
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. O tamanho máximo é 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    let processedBuffer = buffer;
    
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (metadata.width && metadata.height) {
        const avatarSize = 400; // Output avatar size
        
        // Calculate crop dimensions based on position and scale
        if (position && (metadata.width !== metadata.height)) {
          const scaledWidth = metadata.width * position.scale;
          const scaledHeight = metadata.height * position.scale;
          
          // Calculate the visible area after scaling
          const visibleWidth = Math.min(scaledWidth, avatarSize);
          const visibleHeight = Math.min(scaledHeight, avatarSize);
          
          // Calculate crop area (center by default, adjusted by position)
          const cropX = Math.max(0, (metadata.width - visibleWidth) / 2 + position.x);
          const cropY = Math.max(0, (metadata.height - visibleHeight) / 2 + position.y);
          
          // Ensure crop area is within image bounds
          const finalCropX = Math.min(cropX, metadata.width - visibleWidth);
          const finalCropY = Math.min(cropY, metadata.height - visibleHeight);
          const finalCropWidth = Math.min(visibleWidth, metadata.width - finalCropX);
          const finalCropHeight = Math.min(visibleHeight, metadata.height - finalCropY);
          
          processedBuffer = await image
            .extract({
              left: Math.round(finalCropX),
              top: Math.round(finalCropY),
              width: Math.round(finalCropWidth),
              height: Math.round(finalCropHeight)
            })
            .resize(avatarSize, avatarSize, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 90 })
            .toBuffer();
        } else {
          // For square images or when no position is provided, just resize
          processedBuffer = await image
            .resize(avatarSize, avatarSize, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 90 })
            .toBuffer();
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Fallback to original buffer if processing fails
      processedBuffer = buffer;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `avatar_${user.id}_${timestamp}_${randomId}.jpg`;

    // Save file to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    const filePath = join(uploadDir, fileName);

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    await writeFile(filePath, processedBuffer);

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`;
    await db.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl }
    });

    return NextResponse.json({
      message: "Avatar atualizado com sucesso",
      avatarUrl
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}