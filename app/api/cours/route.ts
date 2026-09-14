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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

const joursValides = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
] as const;

type JourValide = (typeof joursValides)[number];

function isJourValide(value: string): value is JourValide {
  return joursValides.includes(value as JourValide);
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * GET /api/cours
 *
 * Recherche :
 * /api/cours?search=math
 *
 * Filtres :
 * /api/cours?classeId=1
 * /api/cours?professeurId=1
 * /api/cours?matiereId=1
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

    const search = clean(searchParams.get("search"));

    const classeIdParam = searchParams.get("classeId");
    const professeurIdParam =
      searchParams.get("professeurId");
    const matiereIdParam =
      searchParams.get("matiereId");

    const classeId = classeIdParam
      ? parseId(classeIdParam)
      : null;

    const professeurId = professeurIdParam
      ? parseId(professeurIdParam)
      : null;

    const matiereId = matiereIdParam
      ? parseId(matiereIdParam)
      : null;

    const cours = await prisma.cours.findMany({
      where: {
        ...(classeId ? { classeId } : {}),
        ...(professeurId ? { professeurId } : {}),
        ...(matiereId ? { matiereId } : {}),

        ...(search
          ? {
              OR: [
                {
                  professeur: {
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
                  },
                },
                {
                  matiere: {
                    nom: {
                      contains: search,
                    },
                  },
                },
                {
                  matiere: {
                    code: {
                      contains: search,
                    },
                  },
                },
                {
                  classe: {
                    nom: {
                      contains: search,
                    },
                  },
                },
                {
                  salle: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
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

        classe: {
          select: {
            id: true,
            nom: true,
            niveau: true,
            actif: true,
          },
        },

        matiere: {
          select: {
            id: true,
            nom: true,
            code: true,
            actif: true,
          },
        },

        _count: {
          select: {
            presencesEleves: true,
          },
        },
      },

      orderBy: [
        {
          jour: "asc",
        },
        {
          heureDebut: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      cours,
    });
  } catch (error) {
    console.error("Erreur GET /api/cours :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de récupérer les cours.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cours
 *
 * Créer un cours.
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
    const classeId = parseId(body.classeId);
    const matiereId = parseId(body.matiereId);

    const jour = clean(body.jour).toUpperCase();
    const heureDebut = clean(body.heureDebut);
    const heureFin = clean(body.heureFin);
    const salleValue = clean(body.salle);

    const salle = salleValue || null;

    if (!professeurId || !classeId || !matiereId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le professeur, la classe et la matière sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (!isJourValide(jour)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le jour sélectionné est invalide.",
        },
        { status: 400 }
      );
    }

    if (!isValidTime(heureDebut)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de début doit être au format HH:MM.",
        },
        { status: 400 }
      );
    }

    if (!isValidTime(heureFin)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de fin doit être au format HH:MM.",
        },
        { status: 400 }
      );
    }

    if (heureDebut >= heureFin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de fin doit être après l'heure de début.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
      where: {
        id: professeurId,
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
          message: "Ce professeur est inactif.",
        },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.findUnique({
      where: {
        id: classeId,
      },
    });

    if (!classe) {
      return NextResponse.json(
        {
          success: false,
          message: "Classe introuvable.",
        },
        { status: 404 }
      );
    }

    if (!classe.actif) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette classe est inactive.",
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
          message: "Cette matière est inactive.",
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
            "Cette matière n'est pas affectée à ce professeur.",
        },
        { status: 400 }
      );
    }

    const conflitClasse = await prisma.cours.findFirst({
      where: {
        classeId,
        jour: jour as JourValide,
        actif: true,
        OR: [
          {
            heureDebut: {
              lt: heureFin,
            },
            heureFin: {
              gt: heureDebut,
            },
          },
        ],
      },
    });

    if (conflitClasse) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La classe possède déjà un cours pendant cet horaire.",
        },
        { status: 409 }
      );
    }

    const conflitProfesseur =
      await prisma.cours.findFirst({
        where: {
          professeurId,
          jour: jour as JourValide,
          actif: true,
          OR: [
            {
              heureDebut: {
                lt: heureFin,
              },
              heureFin: {
                gt: heureDebut,
              },
            },
          ],
        },
      });

    if (conflitProfesseur) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ce professeur possède déjà un cours pendant cet horaire.",
        },
        { status: 409 }
      );
    }

    const cours = await prisma.cours.create({
      data: {
        professeurId,
        classeId,
        matiereId,
        jour: jour as JourValide,
        heureDebut,
        heureFin,
        salle,
        actif: true,
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

        classe: true,
        matiere: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Cours créé avec succès.",
        cours,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/cours :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de créer le cours.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cours
 *
 * Modifier un cours.
 */
export async function PUT(request: Request) {
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

    const id = parseId(body.id);
    const professeurId = parseId(body.professeurId);
    const classeId = parseId(body.classeId);
    const matiereId = parseId(body.matiereId);

    const jour = clean(body.jour).toUpperCase();
    const heureDebut = clean(body.heureDebut);
    const heureFin = clean(body.heureFin);
    const salleValue = clean(body.salle);

    const salle = salleValue || null;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant du cours invalide.",
        },
        { status: 400 }
      );
    }

    const existingCours = await prisma.cours.findUnique({
      where: {
        id,
      },
    });

    if (!existingCours) {
      return NextResponse.json(
        {
          success: false,
          message: "Cours introuvable.",
        },
        { status: 404 }
      );
    }

    if (!professeurId || !classeId || !matiereId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le professeur, la classe et la matière sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (!isJourValide(jour)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le jour sélectionné est invalide.",
        },
        { status: 400 }
      );
    }

    if (!isValidTime(heureDebut)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de début doit être au format HH:MM.",
        },
        { status: 400 }
      );
    }

    if (!isValidTime(heureFin)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de fin doit être au format HH:MM.",
        },
        { status: 400 }
      );
    }

    if (heureDebut >= heureFin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "L'heure de fin doit être après l'heure de début.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
      where: {
        id: professeurId,
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
          message: "Ce professeur est inactif.",
        },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.findUnique({
      where: {
        id: classeId,
      },
    });

    if (!classe) {
      return NextResponse.json(
        {
          success: false,
          message: "Classe introuvable.",
        },
        { status: 404 }
      );
    }

    if (!classe.actif) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette classe est inactive.",
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
          message: "Cette matière est inactive.",
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
            "Cette matière n'est pas affectée à ce professeur.",
        },
        { status: 400 }
      );
    }

    const conflitClasse = await prisma.cours.findFirst({
      where: {
        id: {
          not: id,
        },
        classeId,
        jour: jour as JourValide,
        actif: true,
        heureDebut: {
          lt: heureFin,
        },
        heureFin: {
          gt: heureDebut,
        },
      },
    });

    if (conflitClasse) {
      return NextResponse.json(
        {
          success: false,
          message:
            "La classe possède déjà un cours pendant cet horaire.",
        },
        { status: 409 }
      );
    }

    const conflitProfesseur =
      await prisma.cours.findFirst({
        where: {
          id: {
            not: id,
          },
          professeurId,
          jour: jour as JourValide,
          actif: true,
          heureDebut: {
            lt: heureFin,
          },
          heureFin: {
            gt: heureDebut,
          },
        },
      });

    if (conflitProfesseur) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ce professeur possède déjà un cours pendant cet horaire.",
        },
        { status: 409 }
      );
    }

    const actif =
      typeof body.actif === "boolean"
        ? body.actif
        : existingCours.actif;

    const cours = await prisma.cours.update({
      where: {
        id,
      },

      data: {
        professeurId,
        classeId,
        matiereId,
        jour: jour as JourValide,
        heureDebut,
        heureFin,
        salle,
        actif,
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

        classe: true,
        matiere: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cours modifié avec succès.",
      cours,
    });
  } catch (error) {
    console.error("Erreur PUT /api/cours :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de modifier le cours.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cours?id=1
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

    const id = parseId(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant du cours invalide.",
        },
        { status: 400 }
      );
    }

    const cours = await prisma.cours.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            presencesEleves: true,
          },
        },
      },
    });

    if (!cours) {
      return NextResponse.json(
        {
          success: false,
          message: "Cours introuvable.",
        },
        { status: 404 }
      );
    }

    if (cours._count.presencesEleves > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ce cours ne peut pas être supprimé car des présences d'élèves lui sont associées.",
        },
        { status: 409 }
      );
    }

    await prisma.cours.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cours supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/cours :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer le cours.",
      },
      { status: 500 }
    );
  }
}