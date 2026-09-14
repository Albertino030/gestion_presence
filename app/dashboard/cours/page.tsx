"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

type Professeur = {
  id: number;
  actif: boolean;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
};

type Classe = {
  id: number;
  nom: string;
  niveau: string | null;
  actif: boolean;
};

type Matiere = {
  id: number;
  nom: string;
  code: string | null;
  actif: boolean;
};

type Cours = {
  id: number;
  professeurId: number;
  classeId: number;
  matiereId: number;
  jour:
    | "LUNDI"
    | "MARDI"
    | "MERCREDI"
    | "JEUDI"
    | "VENDREDI"
    | "SAMEDI";
  heureDebut: string;
  heureFin: string;
  salle: string | null;
  actif: boolean;

  professeur: Professeur;
  classe: Classe;
  matiere: Matiere;

  _count?: {
    presencesEleves: number;
  };
};

type FormData = {
  professeurId: string;
  classeId: string;
  matiereId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  salle: string;
  actif: boolean;
};

const emptyForm: FormData = {
  professeurId: "",
  classeId: "",
  matiereId: "",
  jour: "LUNDI",
  heureDebut: "08:00",
  heureFin: "10:00",
  salle: "",
  actif: true,
};

const jours = [
  { value: "LUNDI", label: "Lundi" },
  { value: "MARDI", label: "Mardi" },
  { value: "MERCREDI", label: "Mercredi" },
  { value: "JEUDI", label: "Jeudi" },
  { value: "VENDREDI", label: "Vendredi" },
  { value: "SAMEDI", label: "Samedi" },
];

function nomJour(jour: string) {
  return (
    jours.find((item) => item.value === jour)?.label ??
    jour
  );
}

export default function CoursPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [professeurs, setProfesseurs] = useState<
    Professeur[]
  >([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(
    null
  );

  const [form, setForm] = useState<FormData>(emptyForm);

  const [deleteId, setDeleteId] = useState<number | null>(
    null
  );

  async function loadCours() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/cours?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger les cours."
        );
      }

      setCours(data.cours ?? []);
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

  async function loadOptions() {
    try {
      setLoadingOptions(true);

      const [
        professeursResponse,
        classesResponse,
        matieresResponse,
      ] = await Promise.all([
        fetch("/api/professeurs", {
          credentials: "include",
        }),
        fetch("/api/classes", {
          credentials: "include",
        }),
        fetch("/api/matieres", {
          credentials: "include",
        }),
      ]);

      const professeursData =
        await professeursResponse.json();

      const classesData = await classesResponse.json();

      const matieresData =
        await matieresResponse.json();

      if (!professeursResponse.ok) {
        throw new Error(
          professeursData.message ||
            "Impossible de charger les professeurs."
        );
      }

      if (!classesResponse.ok) {
        throw new Error(
          classesData.message ||
            "Impossible de charger les classes."
        );
      }

      if (!matieresResponse.ok) {
        throw new Error(
          matieresData.message ||
            "Impossible de charger les matières."
        );
      }

      setProfesseurs(
        professeursData.professeurs ?? []
      );

      setClasses(classesData.classes ?? []);

      setMatieres(matieresData.matieres ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les données."
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCours();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadOptions();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowModal(true);
  }

  function openEditModal(item: Cours) {
    setEditingId(item.id);

    setForm({
      professeurId: String(item.professeurId),
      classeId: String(item.classeId),
      matiereId: String(item.matiereId),
      jour: item.jour,
      heureDebut: item.heureDebut,
      heureFin: item.heureFin,
      salle: item.salle ?? "",
      actif: item.actif,
    });

    setError("");
    setMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof FormData,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.professeurId ||
      !form.classeId ||
      !form.matiereId
    ) {
      setError(
        "Veuillez sélectionner le professeur, la classe et la matière."
      );
      return;
    }

    if (form.heureDebut >= form.heureFin) {
      setError(
        "L'heure de fin doit être après l'heure de début."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/cours", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          professeurId: Number(form.professeurId),
          classeId: Number(form.classeId),
          matiereId: Number(form.matiereId),
          jour: form.jour,
          heureDebut: form.heureDebut,
          heureFin: form.heureFin,
          salle: form.salle.trim(),
          actif: form.actif,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'enregistrer le cours."
        );
      }

      setMessage(
        editingId
          ? "Cours modifié avec succès."
          : "Cours créé avec succès."
      );

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadCours();
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
        `/api/cours?id=${deleteId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer le cours."
        );
      }

      setMessage("Cours supprimé avec succès.");
      setDeleteId(null);

      await loadCours();
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

  async function toggleActive(item: Cours) {
    try {
      setError("");
      setMessage("");

      const response = await fetch("/api/cours", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: item.id,
          professeurId: item.professeurId,
          classeId: item.classeId,
          matiereId: item.matiereId,
          jour: item.jour,
          heureDebut: item.heureDebut,
          heureFin: item.heureFin,
          salle: item.salle ?? "",
          actif: !item.actif,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de modifier le statut."
        );
      }

      setMessage(
        !item.actif
          ? "Cours activé."
          : "Cours désactivé."
      );

      await loadCours();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    }
  }

  const stats = useMemo(() => {
    const actifs = cours.filter((item) => item.actif);

    return {
      total: cours.length,
      actifs: actifs.length,
      inactifs: cours.length - actifs.length,
      presences: cours.reduce(
        (total, item) =>
          total +
          (item._count?.presencesEleves ?? 0),
        0
      ),
    };
  }, [cours]);

  const professeurSelected = professeurs.find(
    (item) =>
      String(item.id) === form.professeurId
  );

  const matieresDuProfesseur = matieres.filter(
    (matiere) => {
      if (!form.professeurId) {
        return matiere.actif;
      }

      return matiere.actif;
    }
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow">
              <CalendarDays size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Cours
              </h1>

              <p className="text-sm text-slate-500">
                Gestion des emplois du temps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={loadingOptions}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={20} />
            Ajouter un cours
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

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total cours
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Cours actifs
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {stats.actifs}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Cours inactifs
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {stats.inactifs}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Présences élèves
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {stats.presences}
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
              placeholder="Rechercher par professeur, classe, matière ou salle..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-slate-500">
              <Loader2
                size={24}
                className="animate-spin"
              />
              Chargement des cours...
            </div>
          ) : cours.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <CalendarDays
                size={48}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-semibold text-slate-700">
                Aucun cours trouvé
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Ajoutez votre premier cours.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-sm font-semibold text-slate-600">
                      <th className="px-5 py-4">
                        Jour / Horaire
                      </th>

                      <th className="px-5 py-4">
                        Matière
                      </th>

                      <th className="px-5 py-4">
                        Professeur
                      </th>

                      <th className="px-5 py-4">
                        Classe
                      </th>

                      <th className="px-5 py-4">
                        Salle
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
                    {cours.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-5">
                          <div>
                            <p className="font-bold text-slate-900">
                              {nomJour(item.jour)}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                              <Clock3 size={15} />

                              {item.heureDebut}{" "}
                              - {item.heureFin}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                              <BookOpen size={17} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.matiere.nom}
                              </p>

                              {item.matiere.code && (
                                <p className="text-xs text-slate-400">
                                  {item.matiere.code}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <UserRound
                              size={17}
                              className="text-slate-400"
                            />

                            <div>
                              <p className="font-semibold text-slate-800">
                                {
                                  item.professeur.user
                                    .prenom
                                }{" "}
                                {
                                  item.professeur.user
                                    .nom
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                {
                                  item.professeur.user
                                    .email
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <GraduationCap
                              size={17}
                              className="text-slate-400"
                            />

                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.classe.nom}
                              </p>

                              {item.classe.niveau && (
                                <p className="text-xs text-slate-400">
                                  {item.classe.niveau}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={16} />

                            {item.salle || "Non définie"}
                          </div>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(item)
                            }
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                              item.actif
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {item.actif ? (
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

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(item)
                              }
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteId(item.id)
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {cours.map((item) => (
                  <div
                    key={item.id}
                    className="p-4"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.matiere.nom}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          {nomJour(item.jour)}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                          <Clock3 size={14} />
                          {item.heureDebut} -{" "}
                          {item.heureFin}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(item)
                        }
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.actif
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.actif
                          ? "Actif"
                          : "Inactif"}
                      </button>
                    </div>

                    <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <UserRound
                          size={17}
                          className="text-slate-400"
                        />

                        <div>
                          <p className="text-xs text-slate-400">
                            Professeur
                          </p>

                          <p className="font-semibold text-slate-800">
                            {
                              item.professeur.user
                                .prenom
                            }{" "}
                            {
                              item.professeur.user
                                .nom
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <GraduationCap
                          size={17}
                          className="text-slate-400"
                        />

                        <div>
                          <p className="text-xs text-slate-400">
                            Classe
                          </p>

                          <p className="font-semibold text-slate-800">
                            {item.classe.nom}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin
                          size={17}
                          className="text-slate-400"
                        />

                        <div>
                          <p className="text-xs text-slate-400">
                            Salle
                          </p>

                          <p className="font-semibold text-slate-800">
                            {item.salle ||
                              "Non définie"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(item)
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600"
                      >
                        <Edit size={17} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteId(item.id)
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
                      >
                        <Trash2 size={17} />
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

      {/* Modal ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId
                    ? "Modifier le cours"
                    : "Ajouter un cours"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Définissez le professeur, la matière,
                  la classe et l'horaire.
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
              {/* Professeur */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Professeur *
                </label>

                <select
                  value={form.professeurId}
                  onChange={(event) =>
                    updateForm(
                      "professeurId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    -- Sélectionner un professeur --
                  </option>

                  {professeurs
                    .filter((item) => item.actif)
                    .map((professeur) => (
                      <option
                        key={professeur.id}
                        value={professeur.id}
                      >
                        {professeur.user.prenom}{" "}
                        {professeur.user.nom}
                      </option>
                    ))}
                </select>

                {professeurSelected && (
                  <p className="mt-1 text-xs text-slate-400">
                    {professeurSelected.user.email}
                  </p>
                )}
              </div>

              {/* Matière */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Matière *
                </label>

                <select
                  value={form.matiereId}
                  onChange={(event) =>
                    updateForm(
                      "matiereId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    -- Sélectionner une matière --
                  </option>

                  {matieresDuProfesseur.map(
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

                <p className="mt-1 text-xs text-slate-400">
                  La matière doit être affectée au
                  professeur.
                </p>
              </div>

              {/* Classe */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Classe *
                </label>

                <select
                  value={form.classeId}
                  onChange={(event) =>
                    updateForm(
                      "classeId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    -- Sélectionner une classe --
                  </option>

                  {classes
                    .filter((item) => item.actif)
                    .map((classe) => (
                      <option
                        key={classe.id}
                        value={classe.id}
                      >
                        {classe.nom}
                        {classe.niveau
                          ? ` - ${classe.niveau}`
                          : ""}
                      </option>
                    ))}
                </select>
              </div>

              {/* Jour */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Jour *
                </label>

                <select
                  value={form.jour}
                  onChange={(event) =>
                    updateForm(
                      "jour",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {jours.map((jour) => (
                    <option
                      key={jour.value}
                      value={jour.value}
                    >
                      {jour.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Heure de début *
                  </label>

                  <input
                    type="time"
                    value={form.heureDebut}
                    onChange={(event) =>
                      updateForm(
                        "heureDebut",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Heure de fin *
                  </label>

                  <input
                    type="time"
                    value={form.heureFin}
                    onChange={(event) =>
                      updateForm(
                        "heureFin",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* Salle */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Salle
                </label>

                <input
                  type="text"
                  value={form.salle}
                  onChange={(event) =>
                    updateForm(
                      "salle",
                      event.target.value
                    )
                  }
                  placeholder="Ex : Salle 101"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Actif */}
              {editingId && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={(event) =>
                      updateForm(
                        "actif",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5"
                  />

                  <div>
                    <p className="font-semibold text-slate-800">
                      Cours actif
                    </p>

                    <p className="text-xs text-slate-500">
                      Un cours inactif ne sera pas utilisé
                      pour les prochaines opérations.
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
                    : "Créer le cours"}
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
              Supprimer ce cours ?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Cette action est définitive. Un cours
              possédant déjà des présences d'élèves ne
              pourra pas être supprimé.
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

                <Trash2 size={18} />

                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}