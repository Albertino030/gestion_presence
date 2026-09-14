import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ======================================================
// GET — Liste des classes + recherche
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

    const classes = await prisma.classe.findMany({
      where: search
        ? {
            OR: [
              {
                nom: {
                  contains: search,
                },
              },
              {
                niveau: {
                  contains: search,
                },
              },
              {
                description: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,

      select: {
        id: true,
        nom: true,
        niveau: true,
        description: true,
        actif: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            eleves: true,
            cours: true,
          },
        },
      },

      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      nombre: classes.length,
      classes,
    });
  } catch (error) {
    console.error("Erreur GET /api/classes :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la récupération des classes.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — Création d'une classe
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
    const niveau = String(body.niveau ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!nom) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la classe est obligatoire.",
        },
        { status: 400 }
      );
    }

    const classeExistante = await prisma.classe.findFirst({
      where: {
        nom,
      },
    });

    if (classeExistante) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette classe existe déjà.",
        },
        { status: 409 }
      );
    }

    const classe = await prisma.classe.create({
      data: {
        nom,
        niveau: niveau || null,
        description: description || null,
      },

      select: {
        id: true,
        nom: true,
        niveau: true,
        description: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Classe créée avec succès.",
        classe,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/classes :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la création de la classe.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT — Modification d'une classe
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
    const niveau = String(body.niveau ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de classe invalide.",
        },
        { status: 400 }
      );
    }

    if (!nom) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la classe est obligatoire.",
        },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.findUnique({
      where: {
        id,
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

    const autreClasse = await prisma.classe.findFirst({
      where: {
        nom,
        NOT: {
          id,
        },
      },
    });

    if (autreClasse) {
      return NextResponse.json(
        {
          success: false,
          message: "Une autre classe porte déjà ce nom.",
        },
        { status: 409 }
      );
    }

    const classeModifiee = await prisma.classe.update({
      where: {
        id,
      },

      data: {
        nom,
        niveau: niveau || null,
        description: description || null,
      },

      select: {
        id: true,
        nom: true,
        niveau: true,
        description: true,
        actif: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            eleves: true,
            cours: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Classe modifiée avec succès.",
      classe: classeModifiee,
    });
  } catch (error) {
    console.error("Erreur PUT /api/classes :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la modification de la classe.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE — Suppression d'une classe
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
          message: "Identifiant de classe invalide.",
        },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            eleves: true,
            cours: true,
          },
        },
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

    if (classe._count.eleves > 0 || classe._count.cours > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de supprimer cette classe car elle contient des élèves ou des cours.",
        },
        { status: 409 }
      );
    }

    await prisma.classe.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Classe supprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/classes :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer cette classe. Elle peut être liée à des données existantes.",
      },
      { status: 500 }
    );
  }
}