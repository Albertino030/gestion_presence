import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// ======================================================
// GET : LISTE DES RÉCLAMATIONS
// ======================================================

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const statut = searchParams.get("statut") || "";

    const where: any = {};

    if (
      statut === "EN_ATTENTE" ||
      statut === "ACCEPTEE" ||
      statut === "REFUSEE"
    ) {
      where.statut = statut;
    }

    if (search) {
      where.OR = [
        {
          motif: {
            contains: search,
          },
        },
        {
          professeur: {
            user: {
              nom: {
                contains: search,
              },
            },
          },
        },
        {
          professeur: {
            user: {
              prenom: {
                contains: search,
              },
            },
          },
        },
        {
          professeur: {
            user: {
              email: {
                contains: search,
              },
            },
          },
        },
      ];
    }

    const reclamations = await prisma.reclamation.findMany({
      where,
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

        presenceProfesseur: {
          select: {
            id: true,
            datePresence: true,
            heureArrivee: true,
            heureDepart: true,
            statut: true,
            methodeDetection: true,
            commentaire: true,
          },
        },
      },

      orderBy: {
        dateReclamation: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reclamations,
    });
  } catch (error) {
    console.error("GET /api/reclamations :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Accès refusé ou erreur lors du chargement.",
      },
      { status: 403 }
    );
  }
}

// ======================================================
// POST : CRÉER UNE RÉCLAMATION
// ======================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      professeurId,
      presenceProfesseurId,
      motif,
    } = body;

    if (!professeurId) {
      return NextResponse.json(
        {
          success: false,
          message: "Le professeur est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!presenceProfesseurId) {
      return NextResponse.json(
        {
          success: false,
          message: "La présence est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!motif || !String(motif).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Le motif est obligatoire.",
        },
        { status: 400 }
      );
    }

    const professeur =
      await prisma.professeur.findUnique({
        where: {
          id: Number(professeurId),
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

    const presence =
      await prisma.presenceProfesseur.findUnique({
        where: {
          id: Number(presenceProfesseurId),
        },
      });

    if (!presence) {
      return NextResponse.json(
        {
          success: false,
          message: "Présence introuvable.",
        },
        { status: 404 }
      );
    }

    // Vérifier qu'une réclamation n'est pas déjà en attente
    const existante =
      await prisma.reclamation.findFirst({
        where: {
          professeurId: Number(professeurId),
          presenceProfesseurId: Number(
            presenceProfesseurId
          ),
          statut: "EN_ATTENTE",
        },
      });

    if (existante) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Une réclamation est déjà en attente pour cette présence.",
        },
        { status: 409 }
      );
    }

    const reclamation =
      await prisma.reclamation.create({
        data: {
          professeurId: Number(professeurId),
          presenceProfesseurId: Number(
            presenceProfesseurId
          ),
          motif: String(motif).trim(),
          statut: "EN_ATTENTE",
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

          presenceProfesseur: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Réclamation envoyée avec succès.",
        data: reclamation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reclamations :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la création de la réclamation.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PATCH : ACCEPTER / REFUSER
// ======================================================

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const {
      id,
      statut,
      commentaireAdmin,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID de la réclamation obligatoire.",
        },
        { status: 400 }
      );
    }

    if (
      statut !== "ACCEPTEE" &&
      statut !== "REFUSEE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut invalide.",
        },
        { status: 400 }
      );
    }

    const reclamation =
      await prisma.reclamation.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!reclamation) {
      return NextResponse.json(
        {
          success: false,
          message: "Réclamation introuvable.",
        },
        { status: 404 }
      );
    }

    const updated =
      await prisma.reclamation.update({
        where: {
          id: Number(id),
        },

        data: {
          statut,
          commentaireAdmin:
            commentaireAdmin !== undefined
              ? String(commentaireAdmin).trim() ||
                null
              : undefined,

          dateTraitement: new Date(),
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

          presenceProfesseur: true,
        },
      });

    // Si la réclamation est acceptée,
    // on corrige la présence du professeur.
    if (statut === "ACCEPTEE") {
      await prisma.presenceProfesseur.update({
        where: {
          id: reclamation.presenceProfesseurId,
        },

        data: {
          statut: "PRESENT",

          commentaire:
            commentaireAdmin &&
            String(commentaireAdmin).trim()
              ? String(commentaireAdmin).trim()
              : "Présence corrigée après acceptation de la réclamation.",
        },
      });
    }

    return NextResponse.json({
      success: true,

      message:
        statut === "ACCEPTEE"
          ? "Réclamation acceptée et présence corrigée."
          : "Réclamation refusée.",

      data: updated,
    });
  } catch (error) {
    console.error(
      "PATCH /api/reclamations :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors du traitement de la réclamation.",
      },
      { status: 500 }
    );
  }
}