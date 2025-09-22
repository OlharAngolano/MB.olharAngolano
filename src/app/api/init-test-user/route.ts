import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: "admin@olharangolano.com" }
    });

    if (existingAdmin) {
      return NextResponse.json({
        message: "Admin user already exists",
        user: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await db.user.create({
      data: {
        email: "admin@olharangolano.com",
        name: "Admin Olhar Angolano",
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
        verificationType: "admin",
        bio: "Administrador da comunidade Olhar Angolano"
      }
    });

    // Create test user
    const existingTestUser = await db.user.findUnique({
      where: { email: "teste@olharangolano.com" }
    });

    let testUser;
    if (!existingTestUser) {
      const testHashedPassword = await bcrypt.hash("teste123", 10);
      testUser = await db.user.create({
        data: {
          email: "teste@olharangolano.com",
          name: "Usuário Teste",
          password: testHashedPassword,
          isAdmin: false,
          isVerified: true,
          verificationType: "member",
          bio: "Usuário de teste para demonstração"
        }
      });
    } else {
      testUser = existingTestUser;
    }

    return NextResponse.json({
      message: "Test users created successfully",
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name
      },
      testUser: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      }
    });
  } catch (error) {
    console.error("Init test user error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}