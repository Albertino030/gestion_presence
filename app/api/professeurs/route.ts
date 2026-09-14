import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET : liste des professeurs
// ======================================================
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
    const search = searchParams.get("search")?.trim() ?? "";

    const professeurs = await prisma.professeur.findMany({
      where: search
        ? {
            OR: [
              {
                user: {
                  nom: {
                    contains: search,
                  },
                },
              },
              {
                user: {
                  prenom: {
                    contains: search,
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                  },
                },
              },
              {
                telephone: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,

      select: {
        id: true,
        telephone: true,
        actif: true,
        createdAt: true,
        updatedAt: true,

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
          select: {
            id: true,
            matiere: {
              select: {
                id: true,
                nom: true,
                code: true,
              },
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

    return NextResponse.json({
      success: true,
      nombre: professeurs.length,
      professeurs,
    });
  } catch (error) {
    console.error("Erreur GET /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des professeurs.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST : créer un professeur
// ======================================================
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

    const nom = String(body.nom ?? "").trim();
    const prenom = String(body.prenom ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const telephone = String(body.telephone ?? "").trim();

    if (!nom || !prenom || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nom, prénom, e-mail et mot de passe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le mot de passe doit contenir au moins 6 caractères.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const professeur = await prisma.professeur.create({
      data: {
        telephone: telephone || null,

        user: {
          create: {
            nom,
            prenom,
            email,
            password: hashedPassword,
            role: "PROFESSEUR",
          },
        },
      },

      select: {
        id: true,
        telephone: true,
        actif: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Professeur créé avec succès.",
        professeur,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la création du professeur.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT : modifier un professeur
// ======================================================
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

    const id = Number(body.id);

    const nom = String(body.nom ?? "").trim();
    const prenom = String(body.prenom ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telephone = String(body.telephone ?? "").trim();
    const password = String(body.password ?? "");

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant du professeur invalide.",
        },
        { status: 400 }
      );
    }

    if (!nom || !prenom || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Nom, prénom et e-mail sont obligatoires.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
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

    const emailUtilisateur = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: professeur.userId,
        },
      },
    });

    if (emailUtilisateur) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    const userData: {
      nom: string;
      prenom: string;
      email: string;
      password?: string;
    } = {
      nom,
      prenom,
      email,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Le nouveau mot de passe doit contenir au moins 6 caractères.",
          },
          { status: 400 }
        );
      }

      userData.password = await bcrypt.hash(password, 12);
    }

    const professeurModifie = await prisma.professeur.update({
      where: {
        id,
      },

      data: {
        telephone: telephone || null,

        user: {
          update: userData,
        },
      },

      select: {
        id: true,
        telephone: true,
        actif: true,
        createdAt: true,
        updatedAt: true,

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
          select: {
            id: true,
            matiere: {
              select: {
                id: true,
                nom: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Professeur modifié avec succès.",
      professeur: professeurModifie,
    });
  } catch (error) {
    console.error("Erreur PUT /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la modification du professeur.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE : supprimer un professeur
// ======================================================
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

    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant du professeur invalide.",
        },
        { status: 400 }
      );
    }

    const professeur = await prisma.professeur.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
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

    await prisma.professeur.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Professeur supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer ce professeur. Il peut être lié à des données existantes.",
      },
      { status: 500 }
    );
  }
}