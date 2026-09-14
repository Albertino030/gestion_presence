"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  Phone,
  UserRound,
  CalendarDays,
  GraduationCap,
  Loader2,
  Filter,
} from "lucide-react";

type Classe = {
  id: number;
  nom: string;
  niveau: string | null;
  actif: boolean;
};

type Eleve = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string | null;
  telephone: string | null;
  actif: boolean;
  classeId: number;
  createdAt: string;
  updatedAt: string;
  classe: Classe;
  _count?: {
    presences: number;
  };
};

type FormData = {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  classeId: string;
};

const initialForm: FormData = {
  matricule: "",
  nom: "",
  prenom: "",
  dateNaissance: "",
  telephone: "",
  classeId: "",
};

export default function ElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);

  const [search, setSearch] = useState("");
  const [classeFilter, setClasseFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormData>(initialForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // CHARGER LES CLASSES
  // ======================================================

  async function loadClasses() {
    try {
      setLoadingClasses(true);

      const response = await fetch("/api/classes", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger les classes."
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
      setLoadingClasses(false);
    }
  }

  // ======================================================
  // CHARGER LES ÉLÈVES
  // ======================================================

  async function loadEleves(
    searchValue = "",
    classeIdValue = ""
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (classeIdValue) {
        params.set("classeId", classeIdValue);
      }

      const query = params.toString();

      const url = query
        ? `/api/eleves?${query}`
        : "/api/eleves";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du chargement des élèves."
        );
      }

      setEleves(data.eleves || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les élèves."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // INITIALISATION
  // ======================================================

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEleves(search, classeFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, classeFilter]);

  // ======================================================
  // MODALE AJOUT
  // ======================================================

  function openAddModal() {
    setEditing(false);

    setForm({
      ...initialForm,
      classeId: classes.length > 0 ? String(classes[0].id) : "",
    });

    setMessage("");
    setError("");
    setModalOpen(true);
  }

  // ======================================================
  // MODALE MODIFICATION
  // ======================================================

  function openEditModal(eleve: Eleve) {
    setEditing(true);

    setForm({
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      dateNaissance: eleve.dateNaissance
        ? eleve.dateNaissance.substring(0, 10)
        : "",
      telephone: eleve.telephone || "",
      classeId: String(eleve.classeId),
    });

    setMessage("");
    setError("");
    setModalOpen(true);
  }

  // ======================================================
  // FERMER MODALE
  // ======================================================

  function closeModal() {
    if (saving) return;

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
  // ENREGISTRER
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
        matricule: form.matricule,
        nom: form.nom,
        prenom: form.prenom,
        dateNaissance: form.dateNaissance,
        telephone: form.telephone,
        classeId: Number(form.classeId),
      };

      const response = await fetch(
        "/api/eleves",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Une erreur est survenue."
        );
      }

      setMessage(data.message);

      setModalOpen(false);
      setForm(initialForm);

      await loadEleves(search, classeFilter);
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
  // SUPPRIMER
  // ======================================================

  async function handleDelete(id: number) {
    const eleve = eleves.find(
      (item) => item.id === id
    );

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer l'élève ${
        eleve
          ? `${eleve.prenom} ${eleve.nom}`
          : ""
      } ?\n\nSes présences seront également supprimées.`
    );

    if (!confirmation) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/eleves?id=${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer l'élève."
        );
      }

      setMessage(data.message);

      await loadEleves(search, classeFilter);
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
  // FORMAT DATE
  // ======================================================

  function formatDate(date: string | null) {
    if (!date) return "Non renseignée";

    return new Intl.DateTimeFormat("fr-FR").format(
      new Date(date)
    );
  }

  // ======================================================
  // CALCUL AGE
  // ======================================================

  function calculateAge(date: string | null) {
    if (!date) return null;

    const birthDate = new Date(date);
    const today = new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // ======================================================
  // RENDU
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
                <GraduationCap size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Élèves
                </h1>

                <p className="text-sm text-slate-500">
                  Gestion des élèves de l'établissement
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={classes.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus size={20} />
            Ajouter un élève
          </button>
        </div>

        {/* ==================================================
            MESSAGES
        ================================================== */}

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && !modalOpen && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            RECHERCHE + FILTRE
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">

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
                placeholder="Rechercher par matricule, nom, prénom ou téléphone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="relative min-w-[220px]">
              <Filter
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={classeFilter}
                onChange={(event) =>
                  setClasseFilter(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Toutes les classes
                </option>

                {classes.map((classe) => (
                  <option
                    key={classe.id}
                    value={classe.id}
                  >
                    {classe.nom}
                    {classe.niveau
                      ? ` — ${classe.niveau}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Élèves affichés
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {eleves.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Élèves actifs
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {
                    eleves.filter(
                      (eleve) => eleve.actif
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <UserRound size={22} />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Classes concernées
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {
                    new Set(
                      eleves.map(
                        (eleve) => eleve.classeId
                      )
                    ).size
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <GraduationCap size={22} />
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
                Chargement des élèves...
              </div>
            </div>
          ) : eleves.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <GraduationCap size={28} />
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                Aucun élève
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {search || classeFilter
                  ? "Aucun élève ne correspond aux critères de recherche."
                  : "Aucun élève n'a encore été enregistré."}
              </p>

              {!search &&
                !classeFilter &&
                classes.length > 0 && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Ajouter le premier élève
                  </button>
                )}

              {classes.length === 0 && (
                <p className="mt-4 rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
                  Créez d'abord une classe avant d'ajouter un élève.
                </p>
              )}

            </div>
          ) : (
            <>
              {/* ==================================================
                  VERSION DESKTOP
              ================================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                      <th className="px-6 py-4">
                        Élève
                      </th>

                      <th className="px-6 py-4">
                        Matricule
                      </th>

                      <th className="px-6 py-4">
                        Classe
                      </th>

                      <th className="px-6 py-4">
                        Naissance
                      </th>

                      <th className="px-6 py-4">
                        Contact
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

                    {eleves.map((eleve) => (
                      <tr
                        key={eleve.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* Élève */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                              {eleve.prenom
                                .charAt(0)
                                .toUpperCase()}
                              {eleve.nom
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {eleve.prenom}{" "}
                                {eleve.nom}
                              </p>

                              <p className="text-xs text-slate-500">
                                ID : {eleve.id}
                              </p>
                            </div>

                          </div>

                        </td>

                        {/* Matricule */}

                        <td className="px-6 py-4">

                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                            {eleve.matricule}
                          </span>

                        </td>

                        {/* Classe */}

                        <td className="px-6 py-4">

                          <div>
                            <p className="font-medium text-slate-800">
                              {eleve.classe.nom}
                            </p>

                            {eleve.classe.niveau && (
                              <p className="text-xs text-slate-500">
                                {eleve.classe.niveau}
                              </p>
                            )}
                          </div>

                        </td>

                        {/* Naissance */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-700">

                            <CalendarDays
                              size={16}
                              className="text-slate-400"
                            />

                            <div>
                              <p>
                                {formatDate(
                                  eleve.dateNaissance
                                )}
                              </p>

                              {calculateAge(
                                eleve.dateNaissance
                              ) !== null && (
                                <p className="text-xs text-slate-400">
                                  {
                                    calculateAge(
                                      eleve.dateNaissance
                                    )
                                  }{" "}
                                  ans
                                </p>
                              )}
                            </div>

                          </div>

                        </td>

                        {/* Téléphone */}

                        <td className="px-6 py-4">

                          {eleve.telephone ? (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Phone
                                size={16}
                                className="text-slate-400"
                              />
                              {eleve.telephone}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Non renseigné
                            </span>
                          )}

                        </td>

                        {/* Statut */}

                        <td className="px-6 py-4">

                          {eleve.actif ? (
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
                                openEditModal(eleve)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              title="Modifier"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(eleve.id)
                              }
                              disabled={
                                deletingId ===
                                eleve.id
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Supprimer"
                            >
                              {deletingId ===
                              eleve.id ? (
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

                {eleves.map((eleve) => (
                  <div
                    key={eleve.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {eleve.prenom
                            .charAt(0)
                            .toUpperCase()}
                          {eleve.nom
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {eleve.prenom}{" "}
                            {eleve.nom}
                          </p>

                          <p className="text-xs text-slate-500">
                            {eleve.matricule}
                          </p>
                        </div>

                      </div>

                      {eleve.actif ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Actif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Inactif
                        </span>
                      )}

                    </div>

                    <div className="mt-4 space-y-3">

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap
                          size={16}
                          className="text-slate-400"
                        />

                        <span>
                          {eleve.classe.nom}

                          {eleve.classe.niveau
                            ? ` — ${eleve.classe.niveau}`
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays
                          size={16}
                          className="text-slate-400"
                        />

                        <span>
                          {formatDate(
                            eleve.dateNaissance
                          )}

                          {calculateAge(
                            eleve.dateNaissance
                          ) !== null &&
                            ` (${calculateAge(
                              eleve.dateNaissance
                            )} ans)`}
                        </span>
                      </div>

                      {eleve.telephone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone
                            size={16}
                            className="text-slate-400"
                          />
                          {eleve.telephone}
                        </div>
                      )}

                    </div>

                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(eleve)
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(eleve.id)
                        }
                        disabled={
                          deletingId === eleve.id
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                      >
                        {deletingId === eleve.id ? (
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
          MODALE
      ====================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* En-tête */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editing
                    ? "Modifier l'élève"
                    : "Ajouter un élève"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editing
                    ? "Modifiez les informations de l'élève."
                    : "Enregistrez un nouvel élève dans une classe."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>

            {/* Formulaire */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Ligne 1 */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Matricule *
                  </label>

                  <input
                    type="text"
                    value={form.matricule}
                    onChange={(event) =>
                      handleChange(
                        "matricule",
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ex. ELV001"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Classe *
                  </label>

                  <select
                    value={form.classeId}
                    onChange={(event) =>
                      handleChange(
                        "classeId",
                        event.target.value
                      )
                    }
                    required
                    disabled={loadingClasses}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingClasses
                        ? "Chargement..."
                        : "Sélectionner une classe"}
                    </option>

                    {classes
                      .filter(
                        (classe) => classe.actif
                      )
                      .map((classe) => (
                        <option
                          key={classe.id}
                          value={classe.id}
                        >
                          {classe.nom}

                          {classe.niveau
                            ? ` — ${classe.niveau}`
                            : ""}
                        </option>
                      ))}
                  </select>
                </div>

              </div>

              {/* Nom / prénom */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom *
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
                    placeholder="Ex. Rakoto"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prénom *
                  </label>

                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(event) =>
                      handleChange(
                        "prenom",
                        event.target.value
                      )
                    }
                    placeholder="Ex. Jean"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* Date / téléphone */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Date de naissance
                  </label>

                  <input
                    type="date"
                    value={form.dateNaissance}
                    onChange={(event) =>
                      handleChange(
                        "dateNaissance",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Téléphone
                  </label>

                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(event) =>
                      handleChange(
                        "telephone",
                        event.target.value
                      )
                    }
                    placeholder="0340000000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* Information */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <p className="font-semibold">
                  Information
                </p>

                <p className="mt-1">
                  L'élève sera automatiquement
                  enregistré comme actif dans la
                  classe sélectionnée.
                </p>
              </div>

              {/* Boutons */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingClasses ||
                    classes.length === 0
                  }
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
                    : "Créer l'élève"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
}