import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUTS = ["PRESENT", "ABSENT", "RETARD"] as const;

type PresenceStatusValue = (typeof STATUTS)[number];

function getStartOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getEndOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getJourSemaine(date: Date) {
  const jours = [
    "DIMANCHE",
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
  ] as const;

  return jours[date.getDay()];
}

/**
 * GET
 *
 * Retourne les cours du professeur pour aujourd'hui,
 * les classes, les élèves et les présences déjà enregistrées.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous devez être connecté.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "PROFESSEUR") {
      return NextResponse.json(
        {
          success: false,
          message: "Accès réservé aux professeurs.",
        },
        { status: 403 }
      );
    }

    if (!user.professeur) {
      return NextResponse.json(
        {
          success: false,
          message: "Profil professeur introuvable.",
        },
        { status: 404 }
      );
    }

    const professeurId = user.professeur.id;

    const maintenant = new Date();

    const debutJour = getStartOfDay(maintenant);
    const finJour = getEndOfDay(maintenant);

    const jour = getJourSemaine(maintenant);

    // Dimanche = aucun cours
    if (jour === "DIMANCHE") {
      return NextResponse.json({
        success: true,
        date: maintenant.toISOString(),
        jour,
        cours: [],
      });
    }

    const cours = await prisma.cours.findMany({
      where: {
        professeurId,
        actif: true,
      },

      include: {
        classe: {
          include: {
            eleves: {
              where: {
                actif: true,
              },

              orderBy: [
                {
                  nom: "asc",
                },
                {
                  prenom: "asc",
                },
              ],
            },
          },
        },

        matiere: true,

        presencesEleves: {
          where: {
            datePresence: {
              gte: debutJour,
              lte: finJour,
            },
          },
        },
      },

      orderBy: {
        heureDebut: "asc",
      },
    });

    // On filtre le jour ici afin d'éviter les problèmes
    // de typage de l'enum Prisma.
    const coursDuJour = cours.filter(
      (coursItem) => coursItem.jour === jour
    );

    const resultat = coursDuJour.map((coursItem) => {
      const eleves = coursItem.classe.eleves.map((eleve) => {
        const presence = coursItem.presencesEleves.find(
          (item) => item.eleveId === eleve.id
        );

        return {
          id: eleve.id,
          matricule: eleve.matricule,
          nom: eleve.nom,
          prenom: eleve.prenom,
          telephone: eleve.telephone,

          statut: presence?.statut ?? null,

          presenceId: presence?.id ?? null,

          heureAppel: presence?.heureAppel ?? null,

          commentaire: presence?.commentaire ?? null,
        };
      });

      return {
        id: coursItem.id,

        jour: coursItem.jour,

        heureDebut: coursItem.heureDebut,

        heureFin: coursItem.heureFin,

        salle: coursItem.salle,

        actif: coursItem.actif,

        classe: {
          id: coursItem.classe.id,

          nom: coursItem.classe.nom,

          niveau: coursItem.classe.niveau,

          description: coursItem.classe.description,
        },

        matiere: {
          id: coursItem.matiere.id,

          nom: coursItem.matiere.nom,

          code: coursItem.matiere.code,
        },

        eleves,
      };
    });

    return NextResponse.json({
      success: true,

      date: maintenant.toISOString(),

      jour,

      cours: resultat,
    });
  } catch (error) {
    console.error(
      "Erreur GET présence professeur :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors du chargement des présences.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Enregistre ou modifie la présence d'un élève.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous devez être connecté.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "PROFESSEUR") {
      return NextResponse.json(
        {
          success: false,
          message: "Accès réservé aux professeurs.",
        },
        { status: 403 }
      );
    }

    if (!user.professeur) {
      return NextResponse.json(
        {
          success: false,
          message: "Profil professeur introuvable.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const coursId = Number(body.coursId);

    const eleveId = Number(body.eleveId);

    const statut =
      typeof body.statut === "string"
        ? body.statut.toUpperCase()
        : "";

    const commentaire =
      typeof body.commentaire === "string"
        ? body.commentaire.trim()
        : null;

    if (!Number.isInteger(coursId) || coursId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cours invalide.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(eleveId) || eleveId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Élève invalide.",
        },
        { status: 400 }
      );
    }

    if (
      !STATUTS.includes(
        statut as PresenceStatusValue
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut de présence invalide.",
        },
        { status: 400 }
      );
    }

    const cours = await prisma.cours.findFirst({
      where: {
        id: coursId,

        professeurId: user.professeur.id,

        actif: true,
      },

      select: {
        id: true,

        classeId: true,
      },
    });

    if (!cours) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cours introuvable ou non autorisé.",
        },
        { status: 404 }
      );
    }

    const eleve = await prisma.eleve.findFirst({
      where: {
        id: eleveId,

        classeId: cours.classeId,

        actif: true,
      },

      select: {
        id: true,

        matricule: true,

        nom: true,

        prenom: true,
      },
    });

    if (!eleve) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Élève introuvable dans cette classe.",
        },
        { status: 404 }
      );
    }

    const maintenant = new Date();

    const datePresence =
      getStartOfDay(maintenant);

    const presence =
      await prisma.presenceEleve.upsert({
        where: {
          eleveId_coursId_datePresence: {
            eleveId,

            coursId,

            datePresence,
          },
        },

        create: {
          eleveId,

          coursId,

          datePresence,

          heureAppel: maintenant,

          statut:
            statut as PresenceStatusValue,

          commentaire,
        },

        update: {
          heureAppel: maintenant,

          statut:
            statut as PresenceStatusValue,

          commentaire,
        },
      });

    return NextResponse.json({
      success: true,

      message:
        "Présence enregistrée avec succès.",

      presence: {
        id: presence.id,

        eleveId: presence.eleveId,

        coursId: presence.coursId,

        datePresence:
          presence.datePresence,

        heureAppel:
          presence.heureAppel,

        statut: presence.statut,

        commentaire:
          presence.commentaire,
      },
    });
  } catch (error) {
    console.error(
      "Erreur POST présence professeur :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de l'enregistrement de la présence.",
      },
      { status: 500 }
    );
  }
}