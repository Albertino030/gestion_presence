import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function parseId(value: unknown): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/**
 * GET /api/professeurs-matieres
 *
 * Retourne les professeurs avec leurs matières.
 *
 * Recherche :
 * /api/professeurs-matieres?search=jean
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const search = String(
      searchParams.get("search") ?? ""
    ).trim();

    const professeurs = await prisma.professeur.findMany({
      where: search
        ? {
            user: {
              OR: [
                {
                  nom: {
                    contains: search,
                  },
                },
                {
                  prenom: {
                    contains: search,
                  },
                },
                {
                  email: {
                    contains: search,
                  },
                },
              ],
            },
          }
        : undefined,

      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },

        matieres: {
          include: {
            matiere: {
              select: {
                id: true,
                nom: true,
                code: true,
                actif: true,
              },
            },
          },
          orderBy: {
            matiere: {
              nom: "asc",
            },
          },
        },
      },

      orderBy: {
        user: {
          nom: "asc",
        },
      },
    });

    const resultat = professeurs.map((professeur) => ({
      id: professeur.id,
      telephone: professeur.telephone,
      actif: professeur.actif,

      user: professeur.user,

      matieres: professeur.matieres.map(
        (relation) => relation.matiere
      ),
    }));

    return NextResponse.json({
      success: true,
      professeurs: resultat,
    });
  } catch (error) {
    console.error(
      "Erreur GET /api/professeurs-matieres :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de récupérer les affectations.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/professeurs-matieres
 *
 * Affecter une matière à un professeur.
 *
 * Body :
 * {
 *   professeurId: 1,
 *   matiereId: 2
 * }
 */
export async function POST(request: Request) {
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

    const body = await request.json();

    const professeurId = parseId(body.professeurId);
    const matiereId = parseId(body.matiereId);

    if (!professeurId || !matiereId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le professeur et la matière sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
      where: {
        id: professeurId,
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!professeur) {
      return NextResponse.json(
        {
          success: false,
          message: "Professeur introuvable.",
        },
        { status: 404 }
      );
    }

    if (!professeur.actif) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible d'affecter une matière à un professeur inactif.",
        },
        { status: 400 }
      );
    }

    const matiere = await prisma.matiere.findUnique({
      where: {
        id: matiereId,
      },
    });

    if (!matiere) {
      return NextResponse.json(
        {
          success: false,
          message: "Matière introuvable.",
        },
        { status: 404 }
      );
    }

    if (!matiere.actif) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible d'affecter une matière inactive.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.professeurMatiere.findUnique(
      {
        where: {
          professeurId_matiereId: {
            professeurId,
            matiereId,
          },
        },
      }
    );

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette matière est déjà affectée à ce professeur.",
        },
        { status: 409 }
      );
    }

    const affectation =
      await prisma.professeurMatiere.create({
        data: {
          professeurId,
          matiereId,
        },

        include: {
          professeur: {
            include: {
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  email: true,
                },
              },
            },
          },

          matiere: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Matière affectée au professeur avec succès.",
        affectation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erreur POST /api/professeurs-matieres :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible d'affecter la matière.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/professeurs-matieres
 *
 * Retirer une matière d'un professeur.
 *
 * Exemple :
 * DELETE /api/professeurs-matieres?professeurId=1&matiereId=2
 */
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const professeurId = parseId(
      searchParams.get("professeurId")
    );

    const matiereId = parseId(
      searchParams.get("matiereId")
    );

    if (!professeurId || !matiereId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le professeur et la matière sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const affectation =
      await prisma.professeurMatiere.findUnique({
        where: {
          professeurId_matiereId: {
            professeurId,
            matiereId,
          },
        },
      });

    if (!affectation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette affectation n'existe pas.",
        },
        { status: 404 }
      );
    }

    await prisma.professeurMatiere.delete({
      where: {
        professeurId_matiereId: {
          professeurId,
          matiereId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Matière retirée du professeur avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur DELETE /api/professeurs-matieres :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de retirer la matière.",
      },
      { status: 500 }
    );
  }
}