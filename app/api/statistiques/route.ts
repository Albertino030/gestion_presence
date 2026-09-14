import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const dateDebutParam =
      searchParams.get("dateDebut");

    const dateFinParam =
      searchParams.get("dateFin");

    const aujourdHui = new Date();

    const dateDebut = dateDebutParam
      ? new Date(`${dateDebutParam}T00:00:00`)
      : new Date(
          aujourdHui.getFullYear(),
          aujourdHui.getMonth(),
          aujourdHui.getDate()
        );

    const dateFin = dateFinParam
      ? new Date(`${dateFinParam}T23:59:59.999`)
      : new Date(
          aujourdHui.getFullYear(),
          aujourdHui.getMonth(),
          aujourdHui.getDate(),
          23,
          59,
          59,
          999
        );

    // ==================================================
    // DONNÉES GÉNÉRALES
    // ==================================================

    const [
      totalProfesseurs,
      professeursActifs,
      totalEleves,
      elevesActifs,
      totalClasses,
      classesActives,
      totalMatieres,
      matieresActives,
    ] = await Promise.all([
      prisma.professeur.count(),

      prisma.professeur.count({
        where: {
          actif: true,
        },
      }),

      prisma.eleve.count(),

      prisma.eleve.count({
        where: {
          actif: true,
        },
      }),

      prisma.classe.count(),

      prisma.classe.count({
        where: {
          actif: true,
        },
      }),

      prisma.matiere.count(),

      prisma.matiere.count({
        where: {
          actif: true,
        },
      }),
    ]);

    // ==================================================
    // PRÉSENCES PROFESSEURS
    // ==================================================

    const [
      professeursPresents,
      professeursAbsents,
      professeursRetard,
    ] = await Promise.all([
      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "PRESENT",
        },
      }),

      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "ABSENT",
        },
      }),

      prisma.presenceProfesseur.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "RETARD",
        },
      }),
    ]);

    // ==================================================
    // PRÉSENCES ÉLÈVES
    // ==================================================

    const [
      elevesPresents,
      elevesAbsents,
      elevesRetard,
      totalPresencesEleves,
    ] = await Promise.all([
      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "PRESENT",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "ABSENT",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "RETARD",
        },
      }),

      prisma.presenceEleve.count({
        where: {
          datePresence: {
            gte: dateDebut,
            lte: dateFin,
          },
        },
      }),
    ]);

    // ==================================================
    // RÉCLAMATIONS
    // ==================================================

    const [
      reclamationsTotal,
      reclamationsAttente,
      reclamationsAcceptees,
      reclamationsRefusees,
    ] = await Promise.all([
      prisma.reclamation.count({
        where: {
          dateReclamation: {
            gte: dateDebut,
            lte: dateFin,
          },
        },
      }),

      prisma.reclamation.count({
        where: {
          dateReclamation: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "EN_ATTENTE",
        },
      }),

      prisma.reclamation.count({
        where: {
          dateReclamation: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "ACCEPTEE",
        },
      }),

      prisma.reclamation.count({
        where: {
          dateReclamation: {
            gte: dateDebut,
            lte: dateFin,
          },
          statut: "REFUSEE",
        },
      }),
    ]);

    // ==================================================
    // TAUX
    // ==================================================

    const tauxPresenceEleves =
      totalPresencesEleves > 0
        ? Number(
            (
              (elevesPresents /
                totalPresencesEleves) *
              100
            ).toFixed(2)
          )
        : 0;

    const totalPresencesProfesseurs =
      professeursPresents +
      professeursAbsents +
      professeursRetard;

    const tauxPresenceProfesseurs =
      totalPresencesProfesseurs > 0
        ? Number(
            (
              (professeursPresents /
                totalPresencesProfesseurs) *
              100
            ).toFixed(2)
          )
        : 0;

    // ==================================================
    // STATISTIQUES PAR CLASSE
    // ==================================================

    const classes = await prisma.classe.findMany({
      where: {
        actif: true,
      },

      include: {
        eleves: {
          where: {
            actif: true,
          },

          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },

      orderBy: {
        nom: "asc",
      },
    });

    const statistiquesClasses = await Promise.all(
      classes.map(async (classe) => {
        const eleveIds = classe.eleves.map(
          (eleve) => eleve.id
        );

        const [presents, absents, retards] =
          await Promise.all([
            eleveIds.length
              ? prisma.presenceEleve.count({
                  where: {
                    eleveId: {
                      in: eleveIds,
                    },
                    datePresence: {
                      gte: dateDebut,
                      lte: dateFin,
                    },
                    statut: "PRESENT",
                  },
                })
              : 0,

            eleveIds.length
              ? prisma.presenceEleve.count({
                  where: {
                    eleveId: {
                      in: eleveIds,
                    },
                    datePresence: {
                      gte: dateDebut,
                      lte: dateFin,
                    },
                    statut: "ABSENT",
                  },
                })
              : 0,

            eleveIds.length
              ? prisma.presenceEleve.count({
                  where: {
                    eleveId: {
                      in: eleveIds,
                    },
                    datePresence: {
                      gte: dateDebut,
                      lte: dateFin,
                    },
                    statut: "RETARD",
                  },
                })
              : 0,
          ]);

        const total = presents + absents + retards;

        const taux =
          total > 0
            ? Number(
                (
                  (presents / total) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          id: classe.id,
          nom: classe.nom,
          niveau: classe.niveau,
          nombreEleves:
            classe.eleves.length,
          presents,
          absents,
          retards,
          total,
          tauxPresence: taux,
        };
      })
    );

    return NextResponse.json({
      success: true,

      periode: {
        dateDebut:
          dateDebut.toISOString(),
        dateFin:
          dateFin.toISOString(),
      },

      generales: {
        professeurs: {
          total: totalProfesseurs,
          actifs: professeursActifs,
        },

        eleves: {
          total: totalEleves,
          actifs: elevesActifs,
        },

        classes: {
          total: totalClasses,
          actives: classesActives,
        },

        matieres: {
          total: totalMatieres,
          actives: matieresActives,
        },
      },

      professeurs: {
        presents: professeursPresents,
        absents: professeursAbsents,
        retards: professeursRetard,
        total: totalPresencesProfesseurs,
        tauxPresence:
          tauxPresenceProfesseurs,
      },

      eleves: {
        presents: elevesPresents,
        absents: elevesAbsents,
        retards: elevesRetard,
        total: totalPresencesEleves,
        tauxPresence:
          tauxPresenceEleves,
      },

      reclamations: {
        total: reclamationsTotal,
        attente: reclamationsAttente,
        acceptees: reclamationsAcceptees,
        refusees: reclamationsRefusees,
      },

      classes: statistiquesClasses,
    });
  } catch (error) {
    console.error(
      "GET /api/statistiques :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors du chargement des statistiques.",
      },
      {
        status: 500,
      }
    );
  }
}