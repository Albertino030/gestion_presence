import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nom = String(body.nom ?? "").trim();
    const prenom = String(body.prenom ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!nom || !prenom || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Tous les champs sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Le mot de passe doit contenir au moins 6 caractères.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur créé avec succès.",
        utilisateur: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur register :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la création du compte.",
      },
      { status: 500 }
    );
  }
}
