"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type Matiere = {
  id: number;
  nom: string;
  code: string | null;
  description: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    professeurs: number;
    cours: number;
  };
};

type FormData = {
  nom: string;
  code: string;
  description: string;
  actif: boolean;
};

const emptyForm: FormData = {
  nom: "",
  code: "",
  description: "",
  actif: true,
};

export default function MatieresPage() {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadMatieres() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/matieres?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger les matières."
        );
      }

      setMatieres(data.matieres ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMatieres();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(matiere: Matiere) {
    setEditingId(matiere.id);

    setForm({
      nom: matiere.nom,
      code: matiere.code ?? "",
      description: matiere.description ?? "",
      actif: matiere.actif,
    });

    setMessage("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(
    field: keyof FormData,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.nom.trim()) {
      setError("Le nom de la matière est obligatoire.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/matieres", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          nom: form.nom.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          actif: form.actif,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible d'enregistrer la matière."
        );
      }

      setMessage(
        editingId
          ? "Matière modifiée avec succès."
          : "Matière ajoutée avec succès."
      );

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadMatieres();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/matieres?id=${deleteId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de supprimer la matière."
        );
      }

      setMessage("Matière supprimée avec succès.");
      setDeleteId(null);

      await loadMatieres();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(matiere: Matiere) {
    try {
      setError("");
      setMessage("");

      const response = await fetch("/api/matieres", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: matiere.id,
          nom: matiere.nom,
          code: matiere.code ?? "",
          description: matiere.description ?? "",
          actif: !matiere.actif,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de modifier le statut."
        );
      }

      setMessage(
        !matiere.actif
          ? "Matière activée."
          : "Matière désactivée."
      );

      await loadMatieres();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    }
  }

  const stats = useMemo(() => {
    const total = matieres.length;
    const actives = matieres.filter((m) => m.actif).length;
    const inactives = total - actives;

    const professeurs = matieres.reduce(
      (sum, matiere) =>
        sum + (matiere._count?.professeurs ?? 0),
      0
    );

    const cours = matieres.reduce(
      (sum, matiere) =>
        sum + (matiere._count?.cours ?? 0),
      0
    );

    return {
      total,
      actives,
      inactives,
      professeurs,
      cours,
    };
  }, [matieres]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow">
                <BookOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Matières
                </h1>

                <p className="text-sm text-slate-500">
                  Gestion des matières de l'établissement
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <Plus size={20} />
            Ajouter une matière
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <CheckCircle2 size={20} />
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <XCircle size={20} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Statistiques */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total matières
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Matières actives
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {stats.actives}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Professeurs liés
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {stats.professeurs}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Cours liés
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {stats.cours}
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher par nom, code ou description..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-100">
                <tr className="text-left text-sm font-semibold text-slate-600">
                  <th className="px-5 py-4">Matière</th>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4 text-center">
                    Professeurs
                  </th>
                  <th className="px-5 py-4 text-center">
                    Cours
                  </th>
                  <th className="px-5 py-4 text-center">
                    Statut
                  </th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <div className="flex items-center justify-center gap-3 text-slate-500">
                        <Loader2
                          size={22}
                          className="animate-spin"
                        />
                        Chargement des matières...
                      </div>
                    </td>
                  </tr>
                ) : matieres.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center"
                    >
                      <BookOpen
                        size={42}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-slate-700">
                        Aucune matière trouvée
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Ajoutez votre première matière.
                      </p>
                    </td>
                  </tr>
                ) : (
                  matieres.map((matiere) => (
                    <tr
                      key={matiere.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                            <BookOpen size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {matiere.nom}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID : {matiere.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {matiere.code ? (
                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {matiere.code}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Aucun code
                          </span>
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate text-sm text-slate-600">
                          {matiere.description ||
                            "Aucune description"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {matiere._count?.professeurs ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {matiere._count?.cours ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(matiere)
                          }
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            matiere.actif
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {matiere.actif ? (
                            <>
                              <CheckCircle2 size={15} />
                              Actif
                            </>
                          ) : (
                            <>
                              <XCircle size={15} />
                              Inactif
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(matiere)
                            }
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteId(matiere.id)
                            }
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Version mobile */}
          {!loading && matieres.length > 0 && (
            <div className="divide-y divide-slate-100 md:hidden">
              {matieres.map((matiere) => (
                <div key={matiere.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                        <BookOpen size={18} />
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {matiere.nom}
                        </p>

                        <p className="text-xs text-slate-500">
                          {matiere.code || "Sans code"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(matiere)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        matiere.actif
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {matiere.actif ? "Actif" : "Inactif"}
                    </button>
                  </div>

                  <p className="mb-4 text-sm text-slate-600">
                    {matiere.description ||
                      "Aucune description"}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Professeurs
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {matiere._count?.professeurs ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Cours
                      </p>
                      <p className="mt-1 font-bold text-slate-800">
                        {matiere._count?.cours ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(matiere)
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                    >
                      <Edit size={16} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteId(matiere.id)
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId
                    ? "Modifier la matière"
                    : "Ajouter une matière"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Remplissez les informations de la matière.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nom de la matière *
                </label>

                <input
                  type="text"
                  value={form.nom}
                  onChange={(event) =>
                    handleChange(
                      "nom",
                      event.target.value
                    )
                  }
                  placeholder="Ex : Mathématiques"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Code
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    handleChange(
                      "code",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="Ex : MATH"
                  maxLength={30}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Le code est facultatif.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Description de la matière..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {editingId && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(event) =>
                      handleChange(
                        "actif",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 rounded"
                  />

                  <div>
                    <p className="font-semibold text-slate-800">
                      Matière active
                    </p>

                    <p className="text-xs text-slate-500">
                      Une matière inactive ne sera plus proposée
                      pour les nouveaux cours.
                    </p>
                  </div>
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  {editingId
                    ? "Enregistrer"
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={24} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Supprimer cette matière ?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Cette action est définitive. Une matière utilisée
              dans un cours ne pourra pas être supprimée.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}