import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// ======================================================
// GET
// Récupérer les présences des élèves
// ======================================================

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const coursId = searchParams.get("coursId");
    const classeId = searchParams.get("classeId");
    const eleveId = searchParams.get("eleveId");
    const statut = searchParams.get("statut");

    const where: any = {};

    // Filtre par date
    if (date) {
      const debut = new Date(`${date}T00:00:00`);
      const fin = new Date(`${date}T23:59:59.999`);

      where.datePresence = {
        gte: debut,
        lte: fin,
      };
    }

    // Filtre par cours
    if (coursId) {
      where.coursId = Number(coursId);
    }

    // Filtre par élève
    if (eleveId) {
      where.eleveId = Number(eleveId);
    }

    // Filtre par classe
    if (classeId) {
      where.cours = {
        classeId: Number(classeId),
      };
    }

    // Filtre par statut
    if (
      statut &&
      ["PRESENT", "ABSENT", "RETARD"].includes(statut)
    ) {
      where.statut = statut;
    }

    const presences = await prisma.presenceEleve.findMany({
      where,

      include: {
        eleve: {
          include: {
            classe: true,
          },
        },

        cours: {
          include: {
            classe: true,
            matiere: true,
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
      presences,
    });
  } catch (error: any) {
    console.error(
      "Erreur GET présences élèves :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Erreur lors de la récupération des présences.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}

// ======================================================
// POST
// Enregistrer une présence pour un élève
//
// Peut également recevoir un tableau "presences"
// pour enregistrer tout un appel en une seule fois.
// ======================================================

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    // ==================================================
    // MODE APPEL COMPLET
    // ==================================================

    if (Array.isArray(body.presences)) {
      const liste = body.presences;

      if (liste.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Aucune présence à enregistrer.",
          },
          { status: 400 }
        );
      }

      const resultats = [];

      for (const item of liste) {
        const {
          eleveId,
          coursId,
          datePresence,
          heureAppel,
          statut,
          commentaire,
        } = item;

        if (!eleveId || !coursId || !datePresence) {
          continue;
        }

        if (
          !["PRESENT", "ABSENT", "RETARD"].includes(
            statut
          )
        ) {
          continue;
        }

        const debutJour = new Date(
          `${datePresence}T00:00:00`
        );

        const finJour = new Date(
          `${datePresence}T23:59:59.999`
        );

        const existante =
          await prisma.presenceEleve.findFirst({
            where: {
              eleveId: Number(eleveId),
              coursId: Number(coursId),
              datePresence: {
                gte: debutJour,
                lte: finJour,
              },
            },
          });

        if (existante) {
          const presence =
            await prisma.presenceEleve.update({
              where: {
                id: existante.id,
              },

              data: {
                statut,

                heureAppel: heureAppel
                  ? new Date(
                      `${datePresence}T${heureAppel}:00`
                    )
                  : new Date(),

                commentaire:
                  commentaire || null,
              },
            });

          resultats.push(presence);
        } else {
          const presence =
            await prisma.presenceEleve.create({
              data: {
                eleveId: Number(eleveId),
                coursId: Number(coursId),

                datePresence: debutJour,

                heureAppel: heureAppel
                  ? new Date(
                      `${datePresence}T${heureAppel}:00`
                    )
                  : new Date(),

                statut,

                commentaire:
                  commentaire || null,
              },
            });

          resultats.push(presence);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Appel enregistré avec succès.",
          nombre: resultats.length,
          presences: resultats,
        },
        { status: 201 }
      );
    }

    // ==================================================
    // MODE UNE SEULE PRÉSENCE
    // ==================================================

    const {
      eleveId,
      coursId,
      datePresence,
      heureAppel,
      statut,
      commentaire,
    } = body;

    if (!eleveId) {
      return NextResponse.json(
        {
          success: false,
          message: "L'élève est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!coursId) {
      return NextResponse.json(
        {
          success: false,
          message: "Le cours est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!datePresence) {
      return NextResponse.json(
        {
          success: false,
          message: "La date est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (
      !["PRESENT", "ABSENT", "RETARD"].includes(
        statut
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut invalide.",
        },
        { status: 400 }
      );
    }

    // Vérifier l'élève
    const eleve = await prisma.eleve.findUnique({
      where: {
        id: Number(eleveId),
      },
    });

    if (!eleve) {
      return NextResponse.json(
        {
          success: false,
          message: "Élève introuvable.",
        },
        { status: 404 }
      );
    }

    // Vérifier le cours
    const cours = await prisma.cours.findUnique({
      where: {
        id: Number(coursId),
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

    const debutJour = new Date(
      `${datePresence}T00:00:00`
    );

    const finJour = new Date(
      `${datePresence}T23:59:59.999`
    );

    const existante =
      await prisma.presenceEleve.findFirst({
        where: {
          eleveId: Number(eleveId),
          coursId: Number(coursId),

          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
        },
      });

    if (existante) {
      const presence =
        await prisma.presenceEleve.update({
          where: {
            id: existante.id,
          },

          data: {
            statut,

            heureAppel: heureAppel
              ? new Date(
                  `${datePresence}T${heureAppel}:00`
                )
              : new Date(),

            commentaire:
              commentaire || null,
          },
        });

      return NextResponse.json({
        success: true,
        message:
          "Présence mise à jour avec succès.",
        presence,
      });
    }

    const presence =
      await prisma.presenceEleve.create({
        data: {
          eleveId: Number(eleveId),
          coursId: Number(coursId),

          datePresence: debutJour,

          heureAppel: heureAppel
            ? new Date(
                `${datePresence}T${heureAppel}:00`
              )
            : new Date(),

          statut,

          commentaire:
            commentaire || null,
        },

        include: {
          eleve: {
            include: {
              classe: true,
            },
          },

          cours: {
            include: {
              classe: true,
              matiere: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Présence enregistrée avec succès.",
        presence,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "Erreur POST présence élève :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Erreur lors de l'enregistrement.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}

// ======================================================
// PUT
// Modifier une présence
// ======================================================

export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const {
      id,
      eleveId,
      coursId,
      datePresence,
      heureAppel,
      statut,
      commentaire,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!eleveId || !coursId || !datePresence) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Élève, cours et date sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (
      !["PRESENT", "ABSENT", "RETARD"].includes(
        statut
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut invalide.",
        },
        { status: 400 }
      );
    }

    const existante =
      await prisma.presenceEleve.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!existante) {
      return NextResponse.json(
        {
          success: false,
          message: "Présence introuvable.",
        },
        { status: 404 }
      );
    }

    const presence =
      await prisma.presenceEleve.update({
        where: {
          id: Number(id),
        },

        data: {
          eleveId: Number(eleveId),
          coursId: Number(coursId),

          datePresence: new Date(
            `${datePresence}T00:00:00`
          ),

          heureAppel: heureAppel
            ? new Date(
                `${datePresence}T${heureAppel}:00`
              )
            : null,

          statut,

          commentaire:
            commentaire || null,
        },

        include: {
          eleve: {
            include: {
              classe: true,
            },
          },

          cours: {
            include: {
              classe: true,
              matiere: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Présence modifiée avec succès.",
      presence,
    });
  } catch (error: any) {
    console.error(
      "Erreur PUT présence élève :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Erreur lors de la modification.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}

// ======================================================
// DELETE
// Supprimer une présence
// ======================================================

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID obligatoire.",
        },
        { status: 400 }
      );
    }

    const presence =
      await prisma.presenceEleve.findUnique({
        where: {
          id: Number(id),
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

    await prisma.presenceEleve.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Présence supprimée avec succès.",
    });
  } catch (error: any) {
    console.error(
      "Erreur DELETE présence élève :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Erreur lors de la suppression.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}