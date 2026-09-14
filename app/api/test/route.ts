import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API + Prisma + SQLite fonctionnent correctement.",
      nombreUtilisateurs: users.length,
      utilisateurs: users,
    });
  } catch (error) {
    console.error("Erreur API test :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la connexion à la base de données.",
      },
      { status: 500 }
    );
  }
}