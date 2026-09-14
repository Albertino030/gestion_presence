import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.status === 401
              ? "Vous devez être connecté."
              : "Accès réservé à l'administrateur.",
        },
        { status: auth.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Accès administrateur autorisé.",
      administrateur: auth.user,
    });
  } catch (error) {
    console.error("Erreur API admin test :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur interne du serveur.",
      },
      { status: 500 }
    );
  }
}