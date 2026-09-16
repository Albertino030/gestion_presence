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
        userId: true,
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
// POST : créer un professeur + compte de connexion
// ======================================================
export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Vérification ADMIN
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Récupération des données
    // --------------------------------------------------
    const body = await request.json();

    const nom = String(body.nom ?? "").trim();
    const prenom = String(body.prenom ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const telephone = String(body.telephone ?? "").trim();

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Vérifier si l'e-mail existe déjà
    // --------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // Hash du mot de passe
    // --------------------------------------------------
    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // Création User + Professeur dans une transaction
    // --------------------------------------------------
    const professeur = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nom,
          prenom,
          email,
          password: hashedPassword,

          // IMPORTANT :
          // le rôle est imposé par le système.
          role: "PROFESSEUR",
        },
      });

      const nouveauProfesseur = await tx.professeur.create({
        data: {
          userId: user.id,
          telephone: telephone || null,
        },

        select: {
          id: true,
          userId: true,
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

      return nouveauProfesseur;
    });

    // --------------------------------------------------
    // Réponse
    // --------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message:
          "Professeur et compte de connexion créés avec succès.",

        professeur,

        compte: {
          email: professeur.user.email,
          role: professeur.user.role,
          message:
            "Le professeur peut maintenant se connecter avec cette adresse e-mail et le mot de passe fourni par l'administrateur.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la création du professeur.",
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
    // --------------------------------------------------
    // Vérification ADMIN
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Données
    // --------------------------------------------------
    const body = await request.json();

    const id = Number(body.id);

    const nom = String(body.nom ?? "").trim();
    const prenom = String(body.prenom ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const telephone = String(body.telephone ?? "").trim();

    // Le mot de passe est facultatif lors d'une modification.
    const password = String(body.password ?? "");

    // --------------------------------------------------
    // Validation ID
    // --------------------------------------------------
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant du professeur invalide.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Validation données obligatoires
    // --------------------------------------------------
    if (!nom || !prenom || !email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nom, prénom et e-mail sont obligatoires.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Vérifier le professeur
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Vérifier l'e-mail
    // --------------------------------------------------
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
          message:
            "Cette adresse e-mail est déjà utilisée.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // Données User
    // --------------------------------------------------
    const userData: {
      nom: string;
      prenom: string;
      email: string;
      password?: string;
      role?: "PROFESSEUR";
    } = {
      nom,
      prenom,
      email,

      // On garantit que ce compte reste professeur.
      role: "PROFESSEUR",
    };

    // --------------------------------------------------
    // Nouveau mot de passe facultatif
    // --------------------------------------------------
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

      userData.password = await bcrypt.hash(
        password,
        12
      );
    }

    // --------------------------------------------------
    // Modification
    // --------------------------------------------------
    const professeurModifie =
      await prisma.$transaction(async (tx) => {
        const updatedProfesseur =
          await tx.professeur.update({
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
              userId: true,
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

        return updatedProfesseur;
      });

    // --------------------------------------------------
    // Réponse
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      message:
        "Professeur et compte de connexion modifiés avec succès.",
      professeur: professeurModifie,
    });
  } catch (error) {
    console.error("Erreur PUT /api/professeurs :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la modification du professeur.",
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
    // --------------------------------------------------
    // Vérification ADMIN
    // --------------------------------------------------
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

    // --------------------------------------------------
    // ID
    // --------------------------------------------------
    const { searchParams } = new URL(request.url);

    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identifiant du professeur invalide.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Vérifier le professeur
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Suppression
    // --------------------------------------------------
    await prisma.$transaction(async (tx) => {
      // Le Professeur est supprimé en premier.
      await tx.professeur.delete({
        where: {
          id,
        },
      });

      // Puis son compte User.
      await tx.user.delete({
        where: {
          id: professeur.userId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Professeur et compte de connexion supprimés avec succès.",
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