import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET - LISTE DES ÉLÈVES
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

    const classeIdParam = searchParams.get("classeId")?.trim() ?? "";

    const classeId = classeIdParam
      ? Number(classeIdParam)
      : null;

    if (
      classeIdParam &&
      (!Number.isInteger(classeId) || classeId! <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de classe invalide.",
        },
        { status: 400 }
      );
    }

    const eleves = await prisma.eleve.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  matricule: {
                    contains: search,
                  },
                },
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
                  telephone: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),

        ...(classeId
          ? {
              classeId,
            }
          : {}),
      },

      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        dateNaissance: true,
        telephone: true,
        actif: true,
        classeId: true,
        createdAt: true,
        updatedAt: true,

        classe: {
          select: {
            id: true,
            nom: true,
            niveau: true,
            actif: true,
          },
        },

        _count: {
          select: {
            presences: true,
          },
        },
      },

      orderBy: [
        {
          nom: "asc",
        },
        {
          prenom: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      nombre: eleves.length,
      eleves,
    });
  } catch (error) {
    console.error("Erreur GET /api/eleves :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la récupération des élèves.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - AJOUTER UN ÉLÈVE
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

    const matricule = String(
      body.matricule ?? ""
    )
      .trim()
      .toUpperCase();

    const nom = String(body.nom ?? "").trim();

    const prenom = String(
      body.prenom ?? ""
    ).trim();

    const telephone = String(
      body.telephone ?? ""
    ).trim();

    const dateNaissanceText = String(
      body.dateNaissance ?? ""
    ).trim();

    const classeId = Number(body.classeId);

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
      !matricule ||
      !nom ||
      !prenom ||
      !Number.isInteger(classeId) ||
      classeId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Matricule, nom, prénom et classe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // DATE DE NAISSANCE
    // --------------------------------------------------

    let dateNaissance: Date | null = null;

    if (dateNaissanceText) {
      const parsedDate = new Date(
        `${dateNaissanceText}T00:00:00`
      );

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              "La date de naissance est invalide.",
          },
          { status: 400 }
        );
      }

      dateNaissance = parsedDate;
    }

    // --------------------------------------------------
    // VÉRIFIER LE MATRICULE
    // --------------------------------------------------

    const existingEleve =
      await prisma.eleve.findUnique({
        where: {
          matricule,
        },
      });

    if (existingEleve) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ce matricule est déjà utilisé.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // VÉRIFIER LA CLASSE
    // --------------------------------------------------

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
          message:
            "Impossible d'ajouter un élève dans une classe inactive.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // CRÉATION
    // --------------------------------------------------

    const eleve = await prisma.eleve.create({
      data: {
        matricule,
        nom,
        prenom,
        dateNaissance,
        telephone: telephone || null,
        classeId,
      },

      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        dateNaissance: true,
        telephone: true,
        actif: true,
        classeId: true,
        createdAt: true,

        classe: {
          select: {
            id: true,
            nom: true,
            niveau: true,
            actif: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Élève créé avec succès.",
        eleve,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/eleves :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la création de l'élève.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT - MODIFIER UN ÉLÈVE
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

    const matricule = String(
      body.matricule ?? ""
    )
      .trim()
      .toUpperCase();

    const nom = String(body.nom ?? "").trim();

    const prenom = String(
      body.prenom ?? ""
    ).trim();

    const telephone = String(
      body.telephone ?? ""
    ).trim();

    const dateNaissanceText = String(
      body.dateNaissance ?? ""
    ).trim();

    const classeId = Number(body.classeId);

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identifiant de l'élève invalide.",
        },
        { status: 400 }
      );
    }

    if (
      !matricule ||
      !nom ||
      !prenom ||
      !Number.isInteger(classeId) ||
      classeId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Matricule, nom, prénom et classe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    let dateNaissance: Date | null = null;

    if (dateNaissanceText) {
      const parsedDate = new Date(
        `${dateNaissanceText}T00:00:00`
      );

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            message:
              "La date de naissance est invalide.",
          },
          { status: 400 }
        );
      }

      dateNaissance = parsedDate;
    }

    // --------------------------------------------------
    // VÉRIFIER L'ÉLÈVE
    // --------------------------------------------------

    const eleve =
      await prisma.eleve.findUnique({
        where: {
          id,
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

    // --------------------------------------------------
    // VÉRIFIER LE MATRICULE
    // --------------------------------------------------

    const matriculeExistant =
      await prisma.eleve.findFirst({
        where: {
          matricule,
          NOT: {
            id,
          },
        },
      });

    if (matriculeExistant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ce matricule est déjà utilisé par un autre élève.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // VÉRIFIER LA CLASSE
    // --------------------------------------------------

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
          message:
            "Impossible d'affecter l'élève à une classe inactive.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // MODIFICATION
    // --------------------------------------------------

    const eleveModifie =
      await prisma.eleve.update({
        where: {
          id,
        },

        data: {
          matricule,
          nom,
          prenom,
          dateNaissance,
          telephone: telephone || null,
          classeId,
        },

        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
          dateNaissance: true,
          telephone: true,
          actif: true,
          classeId: true,
          createdAt: true,
          updatedAt: true,

          classe: {
            select: {
              id: true,
              nom: true,
              niveau: true,
              actif: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "Élève modifié avec succès.",
      eleve: eleveModifie,
    });
  } catch (error) {
    console.error("Erreur PUT /api/eleves :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Erreur lors de la modification de l'élève.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE - SUPPRIMER UN ÉLÈVE
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

    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Identifiant de l'élève invalide.",
        },
        { status: 400 }
      );
    }

    const eleve =
      await prisma.eleve.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,

          _count: {
            select: {
              presences: true,
            },
          },
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

    // --------------------------------------------------
    // SUPPRESSION
    // --------------------------------------------------
    // Les présences liées sont supprimées automatiquement
    // grâce à onDelete: Cascade dans le schéma Prisma.

    await prisma.eleve.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Élève supprimé avec succès.",
      eleveSupprime: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        nombrePresencesSupprimees:
          eleve._count.presences,
      },
    });
  } catch (error) {
    console.error(
      "Erreur DELETE /api/eleves :",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer cet élève.",
      },
      { status: 500 }
    );
  }
}