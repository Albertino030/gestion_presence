import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function debutJour(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function finJour(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

function normaliserDatePresence(date = new Date()) {
  return debutJour(date);
}

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
          message: "Aucun profil professeur associé à ce compte.",
        },
        { status: 404 }
      );
    }

    const professeurId = user.professeur.id;

    const aujourdHuiDebut = debutJour();
    const aujourdHuiFin = finJour();

    const professeur = await prisma.professeur.findUnique({
      where: {
        id: professeurId,
      },
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
            matiere: true,
          },
          orderBy: {
            matiere: {
              nom: "asc",
            },
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
              gte: aujourdHuiDebut,
              lte: aujourdHuiFin,
            },
          },
          include: {
            eleve: {
              select: {
                id: true,
                matricule: true,
                nom: true,
                prenom: true,
              },
            },
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

    const coursDuJour = cours.filter((item) => {
      const jourActuel = new Date().getDay();

      const correspondance: Record<number, string> = {
        1: "LUNDI",
        2: "MARDI",
        3: "MERCREDI",
        4: "JEUDI",
        5: "VENDREDI",
        6: "SAMEDI",
      };

      return item.jour === correspondance[jourActuel];
    });

    const presenceProfesseur = await prisma.presenceProfesseur.findFirst({
      where: {
        professeurId,
        datePresence: {
          gte: aujourdHuiDebut,
          lte: aujourdHuiFin,
        },
      },
      orderBy: {
        datePresence: "desc",
      },
    });

    const totalEleves = coursDuJour.reduce(
      (total, coursItem) => total + coursItem.classe.eleves.length,
      0
    );

    const totalPresents = coursDuJour.reduce(
      (total, coursItem) =>
        total +
        coursItem.presencesEleves.filter(
          (presence) => presence.statut === "PRESENT"
        ).length,
      0
    );

    const totalAbsents = coursDuJour.reduce(
      (total, coursItem) =>
        total +
        coursItem.presencesEleves.filter(
          (presence) => presence.statut === "ABSENT"
        ).length,
      0
    );

    const totalRetards = coursDuJour.reduce(
      (total, coursItem) =>
        total +
        coursItem.presencesEleves.filter(
          (presence) => presence.statut === "RETARD"
        ).length,
      0
    );

    const reclamations = await prisma.reclamation.findMany({
      where: {
        professeurId,
      },
      orderBy: {
        dateReclamation: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,

      professeur: {
        id: professeur.id,
        nom: professeur.user.nom,
        prenom: professeur.user.prenom,
        email: professeur.user.email,
        telephone: professeur.telephone,
        actif: professeur.actif,
      },

      matieres: professeur.matieres.map((item) => ({
        id: item.matiere.id,
        nom: item.matiere.nom,
        code: item.matiere.code,
      })),

      coursDuJour,

      statistiques: {
        nombreCours: coursDuJour.length,
        totalEleves,
        totalPresents,
        totalAbsents,
        totalRetards,
        tauxPresence:
          totalEleves > 0
            ? Math.round((totalPresents / totalEleves) * 100)
            : 0,
      },

      presenceProfesseur,

      reclamations,
    });
  } catch (error) {
    console.error("Erreur espace professeur GET :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const statut = String(body.statut ?? "PRESENT");

    const statutsAutorises = ["PRESENT", "ABSENT", "RETARD"];

    if (
      !Number.isInteger(coursId) ||
      !Number.isInteger(eleveId) ||
      !statutsAutorises.includes(statut)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Données de présence invalides.",
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
      include: {
        classe: true,
      },
    });

    if (!cours) {
      return NextResponse.json(
        {
          success: false,
          message: "Cours introuvable ou non autorisé.",
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
    });

    if (!eleve) {
      return NextResponse.json(
        {
          success: false,
          message: "Élève introuvable dans cette classe.",
        },
        { status: 404 }
      );
    }

    const maintenant = new Date();
    const datePresence = normaliserDatePresence(maintenant);

    const presence = await prisma.presenceEleve.upsert({
      where: {
        eleveId_coursId_datePresence: {
          eleveId,
          coursId,
          datePresence,
        },
      },
      update: {
        statut: statut as "PRESENT" | "ABSENT" | "RETARD",
        heureAppel: maintenant,
      },
      create: {
        eleveId,
        coursId,
        datePresence,
        heureAppel: maintenant,
        statut: statut as "PRESENT" | "ABSENT" | "RETARD",
      },
      include: {
        eleve: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Présence enregistrée.",
      presence,
    });
  } catch (error) {
    console.error("Erreur espace professeur POST :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible d'enregistrer la présence.",
      },
      { status: 500 }
    );
  }
}
