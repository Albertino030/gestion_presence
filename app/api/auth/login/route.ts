import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "L'e-mail et le mot de passe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "E-mail ou mot de passe incorrect.",
        },
        { status: 401 }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "E-mail ou mot de passe incorrect.",
        },
        { status: 401 }
      );
    }

    await setSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Connexion réussie.",
      utilisateur: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur login :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la connexion.",
      },
      { status: 500 }
    );
  }
}