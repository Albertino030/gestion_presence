import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous devez être connecté.",
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Erreur /api/auth/me :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue.",
        user: null,
      },
      { status: 500 }
    );
  }
}