import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

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
    const { db } = await import("@/lib/db");
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
    const file: File | null = data.get("image") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for post images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. O tamanho máximo é 10MB." },
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
        // Resize large images to reasonable dimensions while maintaining aspect ratio
        const maxWidth = 1200;
        const maxHeight = 1200;
        
        let resizeOptions = {};
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          resizeOptions = {
            width: metadata.width > maxWidth ? maxWidth : undefined,
            height: metadata.height > maxHeight ? maxHeight : undefined,
            fit: 'inside',
            withoutEnlargement: true
          };
        }
        
        processedBuffer = await image
          .resize(resizeOptions)
          .jpeg({ quality: 85 })
          .toBuffer();
      }
    } catch (error) {
      console.error("Error processing image:", error);
      // Fallback to original buffer if processing fails
      processedBuffer = buffer;
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `post_${user.id}_${timestamp}_${randomId}.jpg`;

    // Save file to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", "posts");
    const filePath = join(uploadDir, fileName);

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    await writeFile(filePath, processedBuffer);

    const imageUrl = `/uploads/posts/${fileName}`;

    return NextResponse.json({
      message: "Imagem enviada com sucesso",
      imageUrl
    });
  } catch (error) {
    console.error("Upload post image error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}