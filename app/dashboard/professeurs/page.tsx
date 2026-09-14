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
  Mail,
  BookOpen,
  Loader2,
  KeyRound,
  Copy,
  Check,
  LogIn,
} from "lucide-react";

type Matiere = {
  id: number;
  nom: string;
  code: string | null;
};

type Professeur = {
  id: number;
  telephone: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  matieres: {
    id: number;
    matiere: Matiere;
  }[];
};

type FormData = {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
};

type Credentials = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
};

const initialForm: FormData = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  password: "",
};

export default function ProfesseursPage() {
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<FormData>(initialForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Identifiants créés
  const [credentials, setCredentials] =
    useState<Credentials | null>(null);

  const [copied, setCopied] = useState(false);

  // =====================================================
  // CHARGER LES PROFESSEURS
  // =====================================================

  async function loadProfesseurs(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const url = searchValue
        ? `/api/professeurs?search=${encodeURIComponent(
            searchValue
          )}`
        : "/api/professeurs";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du chargement."
        );
      }

      setProfesseurs(data.professeurs || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les professeurs."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  useEffect(() => {
    loadProfesseurs();
  }, []);

  // =====================================================
  // RECHERCHE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfesseurs(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // OUVRIR MODAL AJOUT
  // =====================================================

  function openAddModal() {
    setEditing(false);
    setForm(initialForm);
    setMessage("");
    setError("");
    setCredentials(null);
    setModalOpen(true);
  }

  // =====================================================
  // OUVRIR MODAL MODIFICATION
  // =====================================================

  function openEditModal(professeur: Professeur) {
    setEditing(true);

    setForm({
      id: professeur.id,
      nom: professeur.user.nom,
      prenom: professeur.user.prenom,
      email: professeur.user.email,
      telephone: professeur.telephone || "",
      password: "",
    });

    setMessage("");
    setError("");
    setCredentials(null);
    setModalOpen(true);
  }

  // =====================================================
  // FERMER MODAL
  // =====================================================

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setForm(initialForm);
    setError("");
  }

  // =====================================================
  // MODIFIER FORMULAIRE
  // =====================================================

  function handleChange(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // =====================================================
  // COPIER LES IDENTIFIANTS
  // =====================================================

  async function copyCredentials() {
    if (!credentials) return;

    const text = `Compte professeur - Le Colino

Nom : ${credentials.prenom} ${credentials.nom}
E-mail : ${credentials.email}
Mot de passe : ${credentials.password}

Connexion :
http://localhost:3000/login`;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Impossible de copier les identifiants."
      );
    }
  }

  // =====================================================
  // ENREGISTRER
  // =====================================================

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
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim(),
        ...(form.password
          ? { password: form.password }
          : {}),
      };

      const response = await fetch(
        "/api/professeurs",
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

      // =================================================
      // CRÉATION
      // =================================================

      if (!editing) {
        const passwordCreated =
          form.password;

        setCredentials({
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email
            .trim()
            .toLowerCase(),
          password: passwordCreated,
        });

        setMessage(
          data.message ||
            "Le professeur a été créé avec succès."
        );

        setForm(initialForm);

        await loadProfesseurs(search);

        // On garde le modal ouvert pour afficher
        // les identifiants de connexion.
        return;
      }

      // =================================================
      // MODIFICATION
      // =================================================

      setMessage(
        data.message ||
          "Le professeur a été modifié avec succès."
      );

      setModalOpen(false);
      setForm(initialForm);

      await loadProfesseurs(search);
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

  // =====================================================
  // SUPPRIMER
  // =====================================================

  async function handleDelete(id: number) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer ce professeur ?\n\nSon compte utilisateur sera également supprimé."
    );

    if (!confirmation) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/professeurs?id=${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer le professeur."
        );
      }

      setMessage(
        data.message ||
          "Professeur supprimé avec succès."
      );

      await loadProfesseurs(search);
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

  // =====================================================
  // RENDU
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            EN-TÊTE
            ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Users size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Professeurs
                </h1>

                <p className="text-sm text-slate-500">
                  Gestion des enseignants de l'établissement
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
            Ajouter un professeur
          </button>

        </div>

        {/* =================================================
            MESSAGES
            ================================================= */}

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

        {/* =================================================
            BARRE DE RECHERCHE
            ================================================= */}

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
              placeholder="Rechercher par nom, prénom, e-mail ou téléphone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

        </div>

        {/* =================================================
            STATISTIQUE
            ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-500">
                  Professeurs trouvés
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {professeurs.length}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            TABLEAU
            ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (

            <div className="flex min-h-60 items-center justify-center">

              <div className="flex items-center gap-3 text-slate-500">

                <Loader2
                  size={22}
                  className="animate-spin"
                />

                Chargement des professeurs...

              </div>

            </div>

          ) : professeurs.length === 0 ? (

            <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Users size={28} />
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                Aucun professeur
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Aucun professeur ne correspond à votre recherche.
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Ajouter le premier professeur
                </button>
              )}

            </div>

          ) : (

            <>
              {/* =================================================
                  TABLEAU DESKTOP
                  ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                      <th className="px-6 py-4">
                        Professeur
                      </th>

                      <th className="px-6 py-4">
                        Contact
                      </th>

                      <th className="px-6 py-4">
                        Matières
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

                    {professeurs.map(
                      (professeur) => (

                        <tr
                          key={professeur.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          {/* PROFESSEUR */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                                {professeur.user.prenom
                                  .charAt(0)
                                  .toUpperCase()}

                                {professeur.user.nom
                                  .charAt(0)
                                  .toUpperCase()}

                              </div>

                              <div>

                                <p className="font-semibold text-slate-900">

                                  {professeur.user.prenom}{" "}
                                  {professeur.user.nom}

                                </p>

                                <p className="text-xs text-slate-500">

                                  ID professeur :{" "}
                                  {professeur.id}

                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td className="px-6 py-4">

                            <div className="space-y-1">

                              <div className="flex items-center gap-2 text-sm text-slate-700">

                                <Mail
                                  size={15}
                                  className="text-slate-400"
                                />

                                {professeur.user.email}

                              </div>

                              {professeur.telephone && (

                                <div className="flex items-center gap-2 text-sm text-slate-500">

                                  <Phone
                                    size={15}
                                    className="text-slate-400"
                                  />

                                  {professeur.telephone}

                                </div>

                              )}

                            </div>

                          </td>

                          {/* MATIERES */}

                          <td className="px-6 py-4">

                            {professeur.matieres.length ===
                            0 ? (

                              <span className="text-sm text-slate-400">
                                Aucune matière
                              </span>

                            ) : (

                              <div className="flex max-w-xs flex-wrap gap-1">

                                {professeur.matieres.map(
                                  (item) => (

                                    <span
                                      key={item.id}
                                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                    >

                                      <BookOpen size={12} />

                                      {item.matiere.nom}

                                    </span>

                                  )
                                )}

                              </div>

                            )}

                          </td>

                          {/* STATUT */}

                          <td className="px-6 py-4">

                            {professeur.actif ? (

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

                          {/* ACTIONS */}

                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    professeur
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                title="Modifier"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    professeur.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  professeur.id
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Supprimer"
                              >

                                {deletingId ===
                                professeur.id ? (

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

                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  CARTES MOBILE
                  ================================================= */}

              <div className="divide-y divide-slate-100 md:hidden">

                {professeurs.map(
                  (professeur) => (

                    <div
                      key={professeur.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                            {professeur.user.prenom
                              .charAt(0)
                              .toUpperCase()}

                            {professeur.user.nom
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <p className="font-semibold text-slate-900">

                              {professeur.user.prenom}{" "}
                              {professeur.user.nom}

                            </p>

                            <p className="text-xs text-slate-500">
                              ID : {professeur.id}
                            </p>

                          </div>

                        </div>

                        {professeur.actif ? (

                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            Actif
                          </span>

                        ) : (

                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Inactif
                          </span>

                        )}

                      </div>

                      <div className="mt-4 space-y-2">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <Mail
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="break-all">
                            {professeur.user.email}
                          </span>

                        </div>

                        {professeur.telephone && (

                          <div className="flex items-center gap-2 text-sm text-slate-600">

                            <Phone
                              size={16}
                              className="text-slate-400"
                            />

                            {professeur.telephone}

                          </div>

                        )}

                        <div className="flex items-start gap-2 text-sm text-slate-600">

                          <BookOpen
                            size={16}
                            className="mt-0.5 text-slate-400"
                          />

                          {professeur.matieres.length ===
                          0 ? (

                            <span className="text-slate-400">
                              Aucune matière
                            </span>

                          ) : (

                            <div className="flex flex-wrap gap-1">

                              {professeur.matieres.map(
                                (item) => (

                                  <span
                                    key={item.id}
                                    className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                                  >
                                    {item.matiere.nom}
                                  </span>

                                )
                              )}

                            </div>

                          )}

                        </div>

                      </div>

                      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              professeur
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                        >

                          <Pencil size={16} />

                          Modifier

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              professeur.id
                            )
                          }
                          disabled={
                            deletingId ===
                            professeur.id
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                        >

                          {deletingId ===
                          professeur.id ? (

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

                  )
                )}

              </div>

            </>

          )}

        </div>
      </div>

      {/* =====================================================
          MODAL AJOUT / MODIFICATION
          ===================================================== */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* =================================================
                MODAL IDENTIFIANTS APRÈS CRÉATION
                ================================================= */}

            {credentials ? (

              <div>

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      Professeur créé
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Le compte du professeur est prêt.
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

                <div className="space-y-5 p-6">

                  {/* SUCCÈS */}

                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">

                        <Check size={20} />

                      </div>

                      <div>

                        <p className="font-semibold text-green-800">
                          Compte créé avec succès
                        </p>

                        <p className="mt-1 text-sm text-green-700">
                          Le professeur peut maintenant se connecter à son espace.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* IDENTIFIANTS */}

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                    <div className="mb-4 flex items-center gap-2">

                      <KeyRound
                        size={20}
                        className="text-blue-600"
                      />

                      <h3 className="font-bold text-blue-900">
                        Identifiants de connexion
                      </h3>

                    </div>

                    <div className="space-y-3">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          Professeur
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">

                          {credentials.prenom}{" "}
                          {credentials.nom}

                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          Adresse e-mail
                        </p>

                        <div className="mt-1 flex items-center gap-2">

                          <Mail
                            size={16}
                            className="text-slate-400"
                          />

                          <p className="break-all font-medium text-slate-900">
                            {credentials.email}
                          </p>

                        </div>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          Mot de passe initial
                        </p>

                        <div className="mt-1 rounded-lg border border-blue-200 bg-white px-4 py-3">

                          <p className="break-all font-mono text-lg font-bold tracking-wide text-slate-900">
                            {credentials.password}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* INFORMATION */}

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                    <p className="text-sm text-amber-800">

                      <strong>Important :</strong> communiquez ces identifiants au professeur. Il pourra utiliser son adresse e-mail et ce mot de passe sur la page de connexion.

                    </p>

                  </div>

                  {/* CONNEXION */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">

                        <LogIn size={20} />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-800">
                          Page de connexion
                        </p>

                        <p className="text-sm text-slate-500">
                          /login
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">

                    <button
                      type="button"
                      onClick={copyCredentials}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >

                      {copied ? (
                        <>
                          <Check
                            size={17}
                            className="text-green-600"
                          />

                          Copié
                        </>
                      ) : (
                        <>
                          <Copy size={17} />

                          Copier les identifiants
                        </>
                      )}

                    </button>

                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >

                      <Check size={17} />

                      Terminer

                    </button>

                  </div>

                </div>

              </div>

            ) : (

              <>

                {/* =================================================
                    HEADER MODAL
                    ================================================= */}

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">

                      {editing
                        ? "Modifier le professeur"
                        : "Ajouter un professeur"}

                    </h2>

                    <p className="mt-1 text-sm text-slate-500">

                      {editing
                        ? "Modifiez les informations du professeur."
                        : "Créez le compte d'un nouveau professeur."}

                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>

                </div>

                {/* =================================================
                    FORMULAIRE
                    ================================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 p-6"
                >

                  {error && (

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>

                  )}

                  {/* INFO ROLE */}

                  {!editing && (

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                      <div className="flex items-start gap-3">

                        <Users
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                          <p className="font-semibold text-blue-900">
                            Compte professeur
                          </p>

                          <p className="mt-1 text-sm text-blue-700">
                            Le rôle <strong>PROFESSEUR</strong> sera attribué automatiquement.
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* NOM */}

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

                  {/* PRENOM */}

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

                  {/* EMAIL */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Adresse e-mail *
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleChange(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="professeur@lecolino.local"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {!editing && (

                      <p className="mt-1 text-xs text-slate-400">
                        Cette adresse sera utilisée pour la connexion du professeur.
                      </p>

                    )}

                  </div>

                  {/* TELEPHONE */}

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

                  {/* MOT DE PASSE */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">

                      {editing
                        ? "Nouveau mot de passe"
                        : "Mot de passe initial *"}

                    </label>

                    <div className="relative">

                      <KeyRound
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          handleChange(
                            "password",
                            event.target.value
                          )
                        }
                        placeholder={
                          editing
                            ? "Laisser vide pour conserver l'ancien"
                            : "Minimum 6 caractères"
                        }
                        required={!editing}
                        minLength={
                          editing
                            ? undefined
                            : 6
                        }
                        className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                    {editing ? (

                      <p className="mt-1 text-xs text-slate-400">
                        Laissez vide si vous ne voulez pas changer le mot de passe.
                      </p>

                    ) : (

                      <p className="mt-1 text-xs text-slate-400">
                        Ce mot de passe sera donné au professeur pour sa première connexion.
                      </p>

                    )}

                  </div>

                  {/* BOUTONS */}

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
                        : "Créer le professeur"}

                    </button>

                  </div>

                </form>

              </>

            )}

          </div>

        </div>

      )}

    </div>
  );
}