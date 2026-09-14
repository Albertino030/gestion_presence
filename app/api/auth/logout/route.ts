import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({
      success: true,
      message: "Déconnexion réussie.",
    });
  } catch (error) {
    console.error("Erreur logout :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la déconnexion.",
      },
      { status: 500 }
    );
  }
}