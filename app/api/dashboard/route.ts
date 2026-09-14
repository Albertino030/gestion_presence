import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    // Date du jour
    const maintenant = new Date();

    const debutJour = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      maintenant.getDate(),
      0,
      0,
      0,
      0
    );

    const finJour = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      maintenant.getDate(),
      23,
      59,
      59,
      999
    );

    // Statistiques générales
    const [
      totalProfesseurs,
      totalEleves,
      totalClasses,
      totalMatieres,
      professeursActifs,
      elevesActifs,
    ] = await Promise.all([
      prisma.professeur.count(),

      prisma.eleve.count(),

      prisma.classe.count(),

      prisma.matiere.count(),

      prisma.professeur.count({
        where: {
          actif: true,
        },
      }),

      prisma.eleve.count({
        where: {
          actif: true,
        },
      }),
    ]);

    // Présences professeurs aujourd'hui
    const [
      profPresent,
      profAbsent,
      profRetard,
      totalPresenceProfesseurs,
    ] = await Promise.all([
      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "PRESENT",
        },
      }),

      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "ABSENT",
        },
      }),

      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "RETARD",
        },
      }),

      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
        },
      }),
    ]);

    // Présences élèves aujourd'hui
    const [
      elevesPresent,
      elevesAbsent,
      elevesRetard,
      totalPresenceEleves,
    ] = await Promise.all([
      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "PRESENT",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "ABSENT",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
          statut: "RETARD",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
        },
      }),
    ]);

    // Réclamations
    const [
      reclamationsTotal,
      reclamationsEnAttente,
      reclamationsAcceptees,
      reclamationsRefusees,
    ] = await Promise.all([
      prisma.reclamation.count(),

      prisma.reclamation.count({
        where: {
          statut: "EN_ATTENTE",
        },
      }),

      prisma.reclamation.count({
        where: {
          statut: "ACCEPTEE",
        },
      }),

      prisma.reclamation.count({
        where: {
          statut: "REFUSEE",
        },
      }),
    ]);

    // Dernières présences professeurs
    const dernieresPresencesProfesseurs =
      await prisma.presenceProfesseur.findMany({
        take: 8,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          professeur: {
            include: {
              user: {
                select: {
                  nom: true,
                  prenom: true,
                  email: true,
                },
              },
            },
          },
        },
      });

    // Dernières réclamations
    const dernieresReclamations = await prisma.reclamation.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        professeur: {
          include: {
            user: {
              select: {
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    // Classes actives
    const classesActives = await prisma.classe.count({
      where: {
        actif: true,
      },
    });

    // Matières actives
    const matieresActives = await prisma.matiere.count({
      where: {
        actif: true,
      },
    });

    return NextResponse.json({
      success: true,

      date: debutJour.toISOString(),

      statistiques: {
        totalProfesseurs,
        professeursActifs,

        totalEleves,
        elevesActifs,

        totalClasses,
        classesActives,

        totalMatieres,
        matieresActives,
      },

      presenceProfesseurs: {
        present: profPresent,
        absent: profAbsent,
        retard: profRetard,
        total: totalPresenceProfesseurs,
      },

      presenceEleves: {
        present: elevesPresent,
        absent: elevesAbsent,
        retard: elevesRetard,
        total: totalPresenceEleves,
      },

      reclamations: {
        total: reclamationsTotal,
        enAttente: reclamationsEnAttente,
        acceptees: reclamationsAcceptees,
        refusees: reclamationsRefusees,
      },

      dernieresPresencesProfesseurs,

      dernieresReclamations,
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du chargement du tableau de bord.",
      },
      {
        status: 500,
      }
    );
  }
}