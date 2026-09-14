"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  School,
  Users,
  BookOpen,
  Loader2,
  GraduationCap,
} from "lucide-react";

type Classe = {
  id: number;
  nom: string;
  niveau: string | null;
  description: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    eleves: number;
    cours: number;
  };
};

type FormData = {
  id?: number;
  nom: string;
  niveau: string;
  description: string;
};

const initialForm: FormData = {
  nom: "",
  niveau: "",
  description: "",
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormData>(initialForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // CHARGER LES CLASSES
  // ======================================================

  async function loadClasses(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const url = searchValue
        ? `/api/classes?search=${encodeURIComponent(searchValue)}`
        : "/api/classes";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du chargement des classes."
        );
      }

      setClasses(data.classes || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les classes."
      );
    } finally {
      setLoading(false);
    }
  }

  // Chargement initial
  useEffect(() => {
    loadClasses();
  }, []);

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClasses(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // ======================================================
  // OUVRIR MODALE AJOUT
  // ======================================================

  function openAddModal() {
    setEditing(false);
    setForm(initialForm);
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  // ======================================================
  // OUVRIR MODALE MODIFICATION
  // ======================================================

  function openEditModal(classe: Classe) {
    setEditing(true);

    setForm({
      id: classe.id,
      nom: classe.nom,
      niveau: classe.niveau || "",
      description: classe.description || "",
    });

    setError("");
    setMessage("");
    setModalOpen(true);
  }

  // ======================================================
  // FERMER MODALE
  // ======================================================

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setForm(initialForm);
    setError("");
  }

  // ======================================================
  // CHANGEMENT FORMULAIRE
  // ======================================================

  function handleChange(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ======================================================
  // AJOUT / MODIFICATION
  // ======================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const body = {
        ...(editing ? { id: form.id } : {}),
        nom: form.nom.trim(),
        niveau: form.niveau.trim(),
        description: form.description.trim(),
      };

      const response = await fetch("/api/classes", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Une erreur est survenue."
        );
      }

      setMessage(data.message);
      setModalOpen(false);
      setForm(initialForm);

      await loadClasses(search);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // SUPPRESSION
  // ======================================================

  async function handleDelete(id: number) {
    const classe = classes.find(
      (item) => item.id === id
    );

    if (!classe) {
      return;
    }

    let confirmationMessage =
      "Voulez-vous vraiment supprimer cette classe ?";

    if (
      classe._count.eleves > 0 ||
      classe._count.cours > 0
    ) {
      confirmationMessage =
        "Cette classe contient déjà des élèves ou des cours.\n\n" +
        "Elle ne pourra pas être supprimée tant que ces éléments existent.\n\n" +
        "Voulez-vous continuer ?";
    }

    const confirmation = window.confirm(
      confirmationMessage
    );

    if (!confirmation) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/classes?id=${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer la classe."
        );
      }

      setMessage(data.message);

      await loadClasses(search);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            EN-TÊTE
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <School size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Classes
                </h1>

                <p className="text-sm text-slate-500">
                  Gestion des classes de l&apos;établissement
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={20} />
            Ajouter une classe
          </button>
        </div>

        {/* ==================================================
            MESSAGE SUCCÈS
        ================================================== */}

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* ==================================================
            MESSAGE ERREUR
        ================================================== */}

        {error && !modalOpen && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            RECHERCHE
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher par nom, niveau ou description..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Nombre classes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Classes trouvées
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {classes.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <School size={22} />
              </div>
            </div>
          </div>

          {/* Élèves */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Élèves
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {classes.reduce(
                    (total, classe) =>
                      total + classe._count.eleves,
                    0
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Users size={22} />
              </div>
            </div>
          </div>

          {/* Cours */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Cours
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {classes.reduce(
                    (total, classe) =>
                      total + classe._count.cours,
                    0
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BookOpen size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            TABLEAU
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2
                  size={22}
                  className="animate-spin"
                />

                Chargement des classes...
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <School size={28} />
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                Aucune classe
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Aucune classe ne correspond à votre recherche."
                  : "Aucune classe n'a encore été créée."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Ajouter la première classe
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ==================================================
                  VERSION ORDINATEUR
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                      <th className="px-6 py-4">
                        Classe
                      </th>

                      <th className="px-6 py-4">
                        Niveau
                      </th>

                      <th className="px-6 py-4">
                        Description
                      </th>

                      <th className="px-6 py-4">
                        Élèves
                      </th>

                      <th className="px-6 py-4">
                        Cours
                      </th>

                      <th className="px-6 py-4">
                        Statut
                      </th>

                      <th className="px-6 py-4 text-right">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {classes.map((classe) => (
                      <tr
                        key={classe.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* Classe */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <GraduationCap size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {classe.nom}
                              </p>

                              <p className="text-xs text-slate-500">
                                ID classe : {classe.id}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* Niveau */}
                        <td className="px-6 py-4">
                          {classe.niveau ? (
                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {classe.niveau}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Non défini
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="max-w-xs px-6 py-4">
                          {classe.description ? (
                            <p className="truncate text-sm text-slate-600">
                              {classe.description}
                            </p>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Aucune description
                            </span>
                          )}
                        </td>

                        {/* Élèves */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Users
                              size={16}
                              className="text-slate-400"
                            />
                            {classe._count.eleves}
                          </div>
                        </td>

                        {/* Cours */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <BookOpen
                              size={16}
                              className="text-slate-400"
                            />
                            {classe._count.cours}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-4">
                          {classe.actif ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Inactif
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(classe)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              title="Modifier"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(classe.id)
                              }
                              disabled={
                                deletingId === classe.id
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Supprimer"
                            >
                              {deletingId === classe.id ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              {/* ==================================================
                  VERSION MOBILE
              ================================================== */}

              <div className="divide-y divide-slate-100 md:hidden">

                {classes.map((classe) => (
                  <div
                    key={classe.id}
                    className="p-4"
                  >

                    {/* En-tête carte */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <GraduationCap size={21} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {classe.nom}
                          </p>

                          <p className="text-xs text-slate-500">
                            ID : {classe.id}
                          </p>
                        </div>

                      </div>

                      {classe.actif ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Inactif
                        </span>
                      )}

                    </div>

                    {/* Informations */}
                    <div className="mt-4 space-y-3">

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap
                          size={16}
                          className="text-slate-400"
                        />

                        <span>
                          Niveau :{" "}
                          <strong>
                            {classe.niveau ||
                              "Non défini"}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users
                          size={16}
                          className="text-slate-400"
                        />

                        <span>
                          Élèves :{" "}
                          <strong>
                            {classe._count.eleves}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen
                          size={16}
                          className="text-slate-400"
                        />

                        <span>
                          Cours :{" "}
                          <strong>
                            {classe._count.cours}
                          </strong>
                        </span>
                      </div>

                      {classe.description && (
                        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                          {classe.description}
                        </div>
                      )}

                    </div>

                    {/* Actions mobile */}
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(classe)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(classe.id)
                        }
                        disabled={
                          deletingId === classe.id
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                      >
                        {deletingId === classe.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}

                        Supprimer
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            </>
          )}
        </div>
      </div>

      {/* ======================================================
          MODALE AJOUT / MODIFICATION
      ====================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* En-tête modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editing
                    ? "Modifier la classe"
                    : "Ajouter une classe"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editing
                    ? "Modifiez les informations de la classe."
                    : "Créez une nouvelle classe."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                title="Fermer"
              >
                <X size={20} />
              </button>

            </div>

            {/* Formulaire */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* Erreur */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Nom */}
              <div>
                <label
                  htmlFor="nom"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nom de la classe *
                </label>

                <input
                  id="nom"
                  type="text"
                  value={form.nom}
                  onChange={(event) =>
                    handleChange(
                      "nom",
                      event.target.value
                    )
                  }
                  placeholder="Ex. 3ème A"
                  required
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              {/* Niveau */}
              <div>
                <label
                  htmlFor="niveau"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Niveau
                </label>

                <input
                  id="niveau"
                  type="text"
                  value={form.niveau}
                  onChange={(event) =>
                    handleChange(
                      "niveau",
                      event.target.value
                    )
                  }
                  placeholder="Ex. Collège / 3ème"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    handleChange(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Description de la classe..."
                  rows={4}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              {/* Boutons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Enregistrement..."
                    : editing
                    ? "Enregistrer les modifications"
                    : "Créer la classe"}

                </button>

              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}