"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

type Matiere = {
  id: number;
  nom: string;
  code: string | null;
  actif: boolean;
};

type Professeur = {
  id: number;
  telephone: string | null;
  actif: boolean;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  matieres: Matiere[];
};

export default function ProfesseursMatieresPage() {
  const [professeurs, setProfesseurs] = useState<
    Professeur[]
  >([]);

  const [matieres, setMatieres] = useState<Matiere[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMatieres, setLoadingMatieres] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedProfesseur, setSelectedProfesseur] =
    useState<Professeur | null>(null);

  const [selectedMatiereId, setSelectedMatiereId] =
    useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    professeurId: number;
    matiereId: number;
    professeurNom: string;
    matiereNom: string;
  } | null>(null);

  async function loadProfesseurs() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/professeurs-matieres?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de charger les professeurs."
        );
      }

      setProfesseurs(data.professeurs ?? []);
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

  async function loadMatieres() {
    try {
      setLoadingMatieres(true);

      const response = await fetch("/api/matieres", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de charger les matières."
        );
      }

      setMatieres(data.matieres ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les matières."
      );
    } finally {
      setLoadingMatieres(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfesseurs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadMatieres();
  }, []);

  function openModal(professeur: Professeur) {
    setSelectedProfesseur(professeur);
    setSelectedMatiereId("");
    setMessage("");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setSelectedProfesseur(null);
    setSelectedMatiereId("");
  }

  function isMatiereAlreadyAssigned(
    matiereId: number
  ) {
    if (!selectedProfesseur) {
      return false;
    }

    return selectedProfesseur.matieres.some(
      (matiere) => matiere.id === matiereId
    );
  }

  const matieresDisponibles = useMemo(() => {
    if (!selectedProfesseur) {
      return [];
    }

    return matieres.filter(
      (matiere) =>
        matiere.actif &&
        !selectedProfesseur.matieres.some(
          (assigned) => assigned.id === matiere.id
        )
    );
  }, [matieres, selectedProfesseur]);

  async function handleAssign() {
    if (!selectedProfesseur) {
      return;
    }

    const matiereId = Number(selectedMatiereId);

    if (!matiereId) {
      setError("Veuillez sélectionner une matière.");
      return;
    }

    if (isMatiereAlreadyAssigned(matiereId)) {
      setError(
        "Cette matière est déjà affectée à ce professeur."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/professeurs-matieres",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            professeurId: selectedProfesseur.id,
            matiereId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'affecter la matière."
        );
      }

      setMessage(
        "Matière affectée avec succès."
      );

      setShowModal(false);
      setSelectedProfesseur(null);
      setSelectedMatiereId("");

      await loadProfesseurs();
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

  async function handleRemove() {
    if (!deleteTarget) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams({
        professeurId: String(
          deleteTarget.professeurId
        ),
        matiereId: String(deleteTarget.matiereId),
      });

      const response = await fetch(
        `/api/professeurs-matieres?${params.toString()}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de retirer la matière."
        );
      }

      setMessage(
        "Matière retirée avec succès."
      );

      setDeleteTarget(null);

      await loadProfesseurs();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setRemoving(false);
    }
  }

  const totalAffectations = useMemo(() => {
    return professeurs.reduce(
      (total, professeur) =>
        total + professeur.matieres.length,
      0
    );
  }, [professeurs]);

  const professeursAvecMatiere = useMemo(() => {
    return professeurs.filter(
      (professeur) => professeur.matieres.length > 0
    ).length;
  }, [professeurs]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow">
                <BookOpen size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Professeurs & matières
                </h1>

                <p className="text-sm text-slate-500">
                  Gérez les matières enseignées par chaque
                  professeur
                </p>
              </div>
            </div>
          </div>
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Professeurs
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {professeurs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Professeurs avec matière
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {professeursAvecMatiere}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Affectations
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {totalAffectations}
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
              placeholder="Rechercher un professeur..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-slate-500">
              <Loader2
                size={24}
                className="animate-spin"
              />

              Chargement des professeurs...
            </div>
          ) : professeurs.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <UserRound
                size={46}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-semibold text-slate-700">
                Aucun professeur trouvé
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Vérifiez votre recherche.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-sm font-semibold text-slate-600">
                      <th className="px-5 py-4">
                        Professeur
                      </th>

                      <th className="px-5 py-4">
                        E-mail
                      </th>

                      <th className="px-5 py-4">
                        Matières enseignées
                      </th>

                      <th className="px-5 py-4 text-center">
                        Total
                      </th>

                      <th className="px-5 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {professeurs.map(
                      (professeur) => (
                        <tr
                          key={professeur.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {professeur.user.prenom
                                  .charAt(0)
                                  .toUpperCase()}
                                {professeur.user.nom
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    professeur.user
                                      .prenom
                                  }{" "}
                                  {
                                    professeur.user
                                      .nom
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  ID professeur :{" "}
                                  {professeur.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-600">
                            {professeur.user.email}
                          </td>

                          <td className="px-5 py-5">
                            {professeur.matieres.length ===
                            0 ? (
                              <span className="text-sm text-slate-400">
                                Aucune matière
                              </span>
                            ) : (
                              <div className="flex max-w-xl flex-wrap gap-2">
                                {professeur.matieres.map(
                                  (matiere) => (
                                    <div
                                      key={matiere.id}
                                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                                    >
                                      <BookOpen
                                        size={15}
                                      />

                                      <span>
                                        {matiere.nom}
                                      </span>

                                      {matiere.code && (
                                        <span className="text-xs text-blue-400">
                                          ({matiere.code})
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDeleteTarget(
                                            {
                                              professeurId:
                                                professeur.id,
                                              matiereId:
                                                matiere.id,
                                              professeurNom: `${professeur.user.prenom} ${professeur.user.nom}`,
                                              matiereNom:
                                                matiere.nom,
                                            }
                                          )
                                        }
                                        className="ml-1 rounded p-0.5 text-red-500 hover:bg-red-100"
                                        title="Retirer"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-5 text-center">
                            <span className="font-bold text-slate-700">
                              {
                                professeur.matieres
                                  .length
                              }
                            </span>
                          </td>

                          <td className="px-5 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openModal(professeur)
                              }
                              disabled={
                                !professeur.actif ||
                                loadingMatieres
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus size={17} />
                              Affecter
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {professeurs.map((professeur) => (
                  <div
                    key={professeur.id}
                    className="p-4"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {professeur.user.prenom
                            .charAt(0)
                            .toUpperCase()}
                          {professeur.user.nom
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {
                              professeur.user
                                .prenom
                            }{" "}
                            {
                              professeur.user
                                .nom
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {professeur.user.email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          professeur.actif
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {professeur.actif
                          ? "Actif"
                          : "Inactif"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Matières
                      </p>

                      {professeur.matieres.length ===
                      0 ? (
                        <p className="text-sm text-slate-400">
                          Aucune matière affectée.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {professeur.matieres.map(
                            (matiere) => (
                              <div
                                key={matiere.id}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                              >
                                <BookOpen
                                  size={15}
                                />

                                {matiere.nom}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      professeurId:
                                        professeur.id,
                                      matiereId:
                                        matiere.id,
                                      professeurNom: `${professeur.user.prenom} ${professeur.user.nom}`,
                                      matiereNom:
                                        matiere.nom,
                                    })
                                  }
                                  className="rounded p-0.5 text-red-500 hover:bg-red-100"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openModal(professeur)
                      }
                      disabled={
                        !professeur.actif ||
                        loadingMatieres
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus size={17} />
                      Affecter une matière
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal affectation */}
      {showModal && selectedProfesseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Affecter une matière
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    selectedProfesseur.user
                      .prenom
                  }{" "}
                  {
                    selectedProfesseur.user
                      .nom
                  }
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

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Choisir une matière
                </label>

                <select
                  value={selectedMatiereId}
                  onChange={(event) =>
                    setSelectedMatiereId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    -- Sélectionner une matière --
                  </option>

                  {matieresDisponibles.map(
                    (matiere) => (
                      <option
                        key={matiere.id}
                        value={matiere.id}
                      >
                        {matiere.nom}
                        {matiere.code
                          ? ` (${matiere.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {matieresDisponibles.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Toutes les matières actives sont déjà
                  affectées à ce professeur ou aucune
                  matière active n'existe.
                </div>
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
                  type="button"
                  onClick={handleAssign}
                  disabled={
                    saving ||
                    !selectedMatiereId ||
                    matieresDisponibles.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  )}

                  <Plus size={18} />

                  Affecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={24} />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Retirer cette matière ?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Voulez-vous retirer{" "}
              <strong>
                {deleteTarget.matiereNom}
              </strong>{" "}
              de la liste des matières enseignées par{" "}
              <strong>
                {deleteTarget.professeurNom}
              </strong>{" "}
              ?
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={removing}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {removing && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                <Trash2 size={18} />

                Retirer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}