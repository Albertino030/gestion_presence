import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "eleves";
    const dateDebutParam = searchParams.get("dateDebut");
    const dateFinParam = searchParams.get("dateFin");
    const classeIdParam = searchParams.get("classeId");
    const matiereIdParam = searchParams.get("matiereId");
    const search = searchParams.get("search")?.trim() || "";

    const maintenant = new Date();

    const dateDebut = dateDebutParam
      ? new Date(`${dateDebutParam}T00:00:00`)
      : new Date(
          maintenant.getFullYear(),
          maintenant.getMonth(),
          maintenant.getDate()
        );

    const dateFin = dateFinParam
      ? new Date(`${dateFinParam}T23:59:59.999`)
      : new Date(
          maintenant.getFullYear(),
          maintenant.getMonth(),
          maintenant.getDate(),
          23,
          59,
          59,
          999
        );

    // ======================================================
    // RAPPORT ÉLÈVES
    // ======================================================

    if (type === "eleves") {
      const where: any = {
        datePresence: {
          gte: dateDebut,
          lte: dateFin,
        },
      };

      if (classeIdParam) {
        where.eleve = {
          classeId: Number(classeIdParam),
        };
      }

      if (matiereIdParam) {
        where.cours = {
          ...(where.cours || {}),
          matiereId: Number(matiereIdParam),
        };
      }

      if (search) {
        where.eleve = {
          ...(where.eleve || {}),
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
              matricule: {
                contains: search,
              },
            },
          ],
        };
      }

      const presences =
        await prisma.presenceEleve.findMany({
          where,

          include: {
            eleve: {
              include: {
                classe: true,
              },
            },

            cours: {
              include: {
                matiere: true,
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
            },
          },

          orderBy: [
            {
              datePresence: "desc",
            },
            {
              eleve: {
                nom: "asc",
              },
            },
          ],
        });

      return NextResponse.json({
        success: true,

        type: "eleves",

        periode: {
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
        },

        data: presences,
      });
    }

    // ======================================================
    // RAPPORT PROFESSEURS
    // ======================================================

    if (type === "professeurs") {
      const where: any = {
        datePresence: {
          gte: dateDebut,
          lte: dateFin,
        },
      };

      if (search) {
        where.professeur = {
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
        };
      }

      const presences =
        await prisma.presenceProfesseur.findMany({
          where,

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

          orderBy: {
            datePresence: "desc",
          },
        });

      return NextResponse.json({
        success: true,

        type: "professeurs",

        periode: {
          dateDebut: dateDebut.toISOString(),
          dateFin: dateFin.toISOString(),
        },

        data: presences,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Type de rapport invalide.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("GET /api/rapports :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du chargement du rapport.",
      },
      {
        status: 500,
      }
    );
  }
}