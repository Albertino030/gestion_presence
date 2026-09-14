import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET : récupérer les présences des professeurs
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const professeurId = searchParams.get("professeurId");
    const statut = searchParams.get("statut");

    const where: any = {};

    if (date) {
      const debut = new Date(`${date}T00:00:00`);
      const fin = new Date(`${date}T23:59:59.999`);

      where.datePresence = {
        gte: debut,
        lte: fin,
      };
    }

    if (professeurId) {
      where.professeurId = Number(professeurId);
    }

    if (
      statut &&
      ["PRESENT", "ABSENT", "RETARD"].includes(statut)
    ) {
      where.statut = statut;
    }

    const presences = await prisma.presenceProfesseur.findMany({
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
      },
      orderBy: [
        {
          datePresence: "desc",
        },
        {
          heureArrivee: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      presences,
    });
  } catch (error: any) {
    console.error(
      "Erreur GET présences professeurs :",
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

// POST : créer une présence
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const {
      professeurId,
      datePresence,
      heureArrivee,
      heureDepart,
      statut,
      methodeDetection,
      commentaire,
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
      !["PRESENT", "ABSENT", "RETARD"].includes(statut)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut de présence invalide.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
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

    const debutJour = new Date(`${datePresence}T00:00:00`);
    const finJour = new Date(`${datePresence}T23:59:59.999`);

    const existante =
      await prisma.presenceProfesseur.findFirst({
        where: {
          professeurId: Number(professeurId),
          datePresence: {
            gte: debutJour,
            lte: finJour,
          },
        },
      });

    if (existante) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Une présence existe déjà pour ce professeur à cette date.",
        },
        { status: 409 }
      );
    }

    const presence =
      await prisma.presenceProfesseur.create({
        data: {
          professeurId: Number(professeurId),

          datePresence: debutJour,

          heureArrivee: heureArrivee
            ? new Date(
                `${datePresence}T${heureArrivee}:00`
              )
            : null,

          heureDepart: heureDepart
            ? new Date(
                `${datePresence}T${heureDepart}:00`
              )
            : null,

          statut,

          methodeDetection:
            methodeDetection || "MANUELLE",

          commentaire: commentaire || null,
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
      "Erreur POST présence professeur :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Erreur lors de l'enregistrement de la présence.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}

// PUT : modifier une présence
export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const {
      id,
      professeurId,
      datePresence,
      heureArrivee,
      heureDepart,
      statut,
      methodeDetection,
      commentaire,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de présence obligatoire.",
        },
        { status: 400 }
      );
    }

    const anciennePresence =
      await prisma.presenceProfesseur.findUnique({
        where: {
          id: Number(id),
        },
      });

    if (!anciennePresence) {
      return NextResponse.json(
        {
          success: false,
          message: "Présence introuvable.",
        },
        { status: 404 }
      );
    }

    if (
      !["PRESENT", "ABSENT", "RETARD"].includes(statut)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Statut invalide.",
        },
        { status: 400 }
      );
    }

    const date = new Date(
      `${datePresence}T00:00:00`
    );

    const presence =
      await prisma.presenceProfesseur.update({
        where: {
          id: Number(id),
        },

        data: {
          professeurId: Number(professeurId),

          datePresence: date,

          heureArrivee: heureArrivee
            ? new Date(
                `${datePresence}T${heureArrivee}:00`
              )
            : null,

          heureDepart: heureDepart
            ? new Date(
                `${datePresence}T${heureDepart}:00`
              )
            : null,

          statut,

          methodeDetection:
            methodeDetection || "MANUELLE",

          commentaire: commentaire || null,
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
      "Erreur PUT présence professeur :",
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

// DELETE : supprimer une présence
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
      await prisma.presenceProfesseur.findUnique({
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

    await prisma.presenceProfesseur.delete({
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
      "Erreur DELETE présence professeur :",
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