import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function parseId(value: unknown): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseBoolean(value: unknown, defaultValue = true): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
}

/**
 * GET /api/matieres
 *
 * Liste toutes les matières.
 * Recherche possible avec :
 * /api/matieres?search=math
 */
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
    const search = clean(searchParams.get("search"));

    const matieres = await prisma.matiere.findMany({
      where: search
        ? {
            OR: [
              {
                nom: {
                  contains: search,
                },
              },
              {
                code: {
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

      include: {
        _count: {
          select: {
            professeurs: true,
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
      matieres,
    });
  } catch (error) {
    console.error("Erreur GET /api/matieres :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de récupérer les matières.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matieres
 *
 * Créer une matière.
 */
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

    const nom = clean(body.nom);
    const codeValue = clean(body.code);
    const descriptionValue = clean(body.description);

    const code = codeValue ? codeValue.toUpperCase() : null;
    const description = descriptionValue || null;

    if (!nom) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la matière est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (nom.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la matière ne doit pas dépasser 100 caractères.",
        },
        { status: 400 }
      );
    }

    if (code && code.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Le code ne doit pas dépasser 30 caractères.",
        },
        { status: 400 }
      );
    }

    if (code) {
      const existingCode = await prisma.matiere.findUnique({
        where: {
          code,
        },
      });

      if (existingCode) {
        return NextResponse.json(
          {
            success: false,
            message: "Ce code matière existe déjà.",
          },
          { status: 409 }
        );
      }
    }

    const existingName = await prisma.matiere.findFirst({
      where: {
        nom: {
          equals: nom,
        },
      },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette matière existe déjà.",
        },
        { status: 409 }
      );
    }

    const matiere = await prisma.matiere.create({
      data: {
        nom,
        code,
        description,
        actif: true,
      },

      include: {
        _count: {
          select: {
            professeurs: true,
            cours: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Matière créée avec succès.",
        matiere,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/matieres :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de créer la matière.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/matieres
 *
 * Modifier une matière.
 */
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

    const id = parseId(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de matière invalide.",
        },
        { status: 400 }
      );
    }

    const existingMatiere = await prisma.matiere.findUnique({
      where: {
        id,
      },
    });

    if (!existingMatiere) {
      return NextResponse.json(
        {
          success: false,
          message: "Matière introuvable.",
        },
        { status: 404 }
      );
    }

    const nom = clean(body.nom);
    const codeValue = clean(body.code);
    const descriptionValue = clean(body.description);

    const code = codeValue ? codeValue.toUpperCase() : null;
    const description = descriptionValue || null;

    if (!nom) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la matière est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (nom.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom de la matière ne doit pas dépasser 100 caractères.",
        },
        { status: 400 }
      );
    }

    if (code && code.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Le code ne doit pas dépasser 30 caractères.",
        },
        { status: 400 }
      );
    }

    if (code) {
      const existingCode = await prisma.matiere.findFirst({
        where: {
          code,
          NOT: {
            id,
          },
        },
      });

      if (existingCode) {
        return NextResponse.json(
          {
            success: false,
            message: "Ce code matière est déjà utilisé.",
          },
          { status: 409 }
        );
      }
    }

    const existingName = await prisma.matiere.findFirst({
      where: {
        nom: {
          equals: nom,
        },
        NOT: {
          id,
        },
      },
    });

    if (existingName) {
      return NextResponse.json(
        {
          success: false,
          message: "Cette matière existe déjà.",
        },
        { status: 409 }
      );
    }

    const actif = parseBoolean(body.actif, existingMatiere.actif);

    const matiere = await prisma.matiere.update({
      where: {
        id,
      },

      data: {
        nom,
        code,
        description,
        actif,
      },

      include: {
        _count: {
          select: {
            professeurs: true,
            cours: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Matière modifiée avec succès.",
      matiere,
    });
  } catch (error) {
    console.error("Erreur PUT /api/matieres :", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de modifier la matière.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/matieres?id=1
 *
 * Supprimer une matière.
 */
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
    const id = parseId(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifiant de matière invalide.",
        },
        { status: 400 }
      );
    }

    const matiere = await prisma.matiere.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            professeurs: true,
            cours: true,
          },
        },
      },
    });

    if (!matiere) {
      return NextResponse.json(
        {
          success: false,
          message: "Matière introuvable.",
        },
        { status: 404 }
      );
    }

    if (matiere._count.cours > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette matière ne peut pas être supprimée car elle est utilisée dans des cours.",
        },
        { status: 409 }
      );
    }

    await prisma.matiere.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Matière supprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/matieres :", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Impossible de supprimer la matière. Elle est peut-être utilisée ailleurs.",
      },
      { status: 500 }
    );
  }
}