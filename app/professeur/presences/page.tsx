"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  Save,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

type Statut =
  | "PRESENT"
  | "ABSENT"
  | "RETARD";

type Eleve = {
  id: number;

  matricule: string | null;

  nom: string;

  prenom: string;
};

type Presence = {
  id: number;

  eleveId: number;

  coursId: number;

  datePresence: string;

  heureAppel: string;

  statut: Statut;

  eleve: Eleve;
};

type Matiere = {
  id: number;

  nom: string;

  code: string | null;
};

type Classe = {
  id: number;

  nom: string;

  niveau: string | null;

  eleves: Eleve[];
};

type Cours = {
  id: number;

  jour: string;

  heureDebut: string;

  heureFin: string;

  classe: Classe;

  matiere: Matiere;

  presences: Presence[];
};

type Professeur = {
  id: number;

  nom: string;

  prenom: string;

  email: string;

  telephone: string | null;

  actif: boolean;
};

type Statistiques = {
  nombreCours: number;

  totalEleves: number;

  totalPresents: number;

  totalAbsents: number;

  totalRetards: number;

  tauxPresence: number;
};

/* =========================================================
   PAGE
========================================================= */

export default function PresencePage() {
  const router = useRouter();

  const [professeur, setProfesseur] =
    useState<Professeur | null>(null);

  const [cours, setCours] =
    useState<Cours[]>([]);

  const [statistiques, setStatistiques] =
    useState<Statistiques | null>(null);

  const [
    coursSelectionne,
    setCoursSelectionne,
  ] = useState<number | null>(null);

  const [statuts, setStatuts] =
    useState<Record<number, Statut>>({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     CHARGER LES DONNÉES
  ======================================================= */

  useEffect(() => {
    chargerPresences();
  }, []);

  async function chargerPresences() {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        "/api/professeur/presence",
        {
          method: "GET",

          credentials: "include",

          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de charger les données."
        );
      }

      setProfesseur(data.professeur);

      setCours(data.cours || []);

      setStatistiques(
        data.statistiques || null
      );

      /* -----------------------------------------------
         Sélectionner le premier cours
      ------------------------------------------------ */

      if (
        data.cours &&
        data.cours.length > 0
      ) {
        preparerCours(data.cours[0]);

        setCoursSelectionne(
          data.cours[0].id
        );
      } else {
        setCoursSelectionne(null);

        setStatuts({});
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     PRÉPARER LES STATUTS
  ======================================================= */

  function preparerCours(
    coursChoisi: Cours
  ) {
    const nouveauxStatuts: Record<
      number,
      Statut
    > = {};

    coursChoisi.classe.eleves.forEach(
      (eleve) => {
        const presence =
          coursChoisi.presences.find(
            (item) =>
              item.eleveId === eleve.id
          );

        nouveauxStatuts[eleve.id] =
          presence?.statut || "PRESENT";
      }
    );

    setStatuts(nouveauxStatuts);
  }

  /* =======================================================
     SÉLECTIONNER UN COURS
  ======================================================= */

  function selectionnerCours(
    coursChoisi: Cours
  ) {
    setCoursSelectionne(
      coursChoisi.id
    );

    preparerCours(coursChoisi);

    setMessage("");

    setError("");
  }

  /* =======================================================
     COURS ACTUEL
  ======================================================= */

  const coursActuel = useMemo(() => {
    return (
      cours.find(
        (item) =>
          item.id ===
          coursSelectionne
      ) || null
    );
  }, [
    cours,
    coursSelectionne,
  ]);

  /* =======================================================
     CHANGER LE STATUT
  ======================================================= */

  function changerStatut(
    eleveId: number,
    statut: Statut
  ) {
    setStatuts((ancien) => ({
      ...ancien,

      [eleveId]: statut,
    }));

    setMessage("");
  }

  /* =======================================================
     COMPTEURS
  ======================================================= */

  const compteurs = useMemo(() => {
    let presents = 0;

    let absents = 0;

    let retards = 0;

    if (coursActuel) {
      coursActuel.classe.eleves.forEach(
        (eleve) => {
          const statut =
            statuts[eleve.id] ||
            "PRESENT";

          if (statut === "PRESENT") {
            presents++;
          }

          if (statut === "ABSENT") {
            absents++;
          }

          if (statut === "RETARD") {
            retards++;
          }
        }
      );
    }

    return {
      presents,

      absents,

      retards,
    };
  }, [
    coursActuel,
    statuts,
  ]);

  /* =======================================================
     ENREGISTRER TOUT L'APPEL
  ======================================================= */

  async function enregistrerAppel() {
    if (!coursActuel) {
      setError(
        "Veuillez sélectionner un cours."
      );

      return;
    }

    if (
      coursActuel.classe.eleves
        .length === 0
    ) {
      setError(
        "Cette classe ne contient aucun élève."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      setMessage("");

      /* -----------------------------------------------
         Enregistrer chaque élève
      ------------------------------------------------ */

      for (const eleve of coursActuel
        .classe.eleves) {
        const statut =
          statuts[eleve.id] ||
          "PRESENT";

        const response =
          await fetch(
            "/api/professeur/presence",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials: "include",

              body: JSON.stringify({
                coursId:
                  coursActuel.id,

                eleveId: eleve.id,

                statut,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Impossible d'enregistrer ${eleve.prenom} ${eleve.nom}.`
          );
        }
      }

      setMessage(
        "L'appel a été enregistré avec succès."
      );

      /* -----------------------------------------------
         Recharger depuis la base
      ------------------------------------------------ */

      await chargerPresences();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer l'appel."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">

          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />

          <p className="mt-4 text-slate-600">
            Chargement des présences...
          </p>

        </div>
      </div>
    );
  }

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push(
                  "/professeur"
                )
              }
              className="p-2 rounded-lg hover:bg-slate-100 transition"
              title="Retour à l'espace professeur"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                Gestion des présences
              </h1>

              <p className="text-xs text-slate-500 hidden sm:block">
                Faire l'appel des élèves
              </p>
            </div>

          </div>

          {professeur && (
            <div className="hidden sm:flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {professeur.prenom.charAt(
                  0
                )}
                {professeur.nom.charAt(
                  0
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {professeur.prenom}{" "}
                  {professeur.nom}
                </p>

                <p className="text-xs text-slate-500">
                  Professeur
                </p>
              </div>

            </div>
          )}

        </div>

      </header>

      {/* =================================================
          CONTENU
      ================================================= */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* TITRE */}

        <div className="mb-6">

          <div className="flex items-center gap-2">

            <CalendarDays className="w-6 h-6 text-blue-600" />

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Faire l'appel
            </h2>

          </div>

          <p className="text-slate-500 mt-2">
            Sélectionnez votre cours et
            indiquez la présence de chaque
            élève.
          </p>

        </div>

        {/* =================================================
            MESSAGE SUCCÈS
        ================================================= */}

        {message && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-3">

            <CheckCircle2 className="w-5 h-5" />

            <span className="text-sm font-medium">
              {message}
            </span>

          </div>
        )}

        {/* =================================================
            MESSAGE ERREUR
        ================================================= */}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center gap-3">

            <XCircle className="w-5 h-5" />

            <span className="text-sm font-medium">
              {error}
            </span>

          </div>
        )}

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <StatCard
            label="Élèves"
            value={
              coursActuel
                ? coursActuel.classe
                    .eleves.length
                : 0
            }
            icon={
              <Users className="w-5 h-5" />
            }
          />

          <StatCard
            label="Présents"
            value={
              compteurs.presents
            }
            icon={
              <UserCheck className="w-5 h-5" />
            }
          />

          <StatCard
            label="Absents"
            value={
              compteurs.absents
            }
            icon={
              <UserX className="w-5 h-5" />
            }
          />

          <StatCard
            label="Retards"
            value={
              compteurs.retards
            }
            icon={
              <Clock3 className="w-5 h-5" />
            }
          />

        </div>

        {/* =================================================
            COURS
        ================================================= */}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">

          <div className="flex items-center gap-2 mb-5">

            <ClipboardCheck className="w-5 h-5 text-blue-600" />

            <h3 className="font-bold text-slate-900">
              Mes cours aujourd'hui
            </h3>

          </div>

          {cours.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-200">

              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />

              <h3 className="font-semibold text-slate-800 mt-4">
                Aucun cours aujourd'hui
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Aucun cours actif ne vous
                est attribué pour
                aujourd'hui.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {cours.map((item) => {
                const selectionne =
                  item.id ===
                  coursSelectionne;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      selectionnerCours(
                        item
                      )
                    }
                    className={`text-left border rounded-xl p-4 transition ${
                      selectionne
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex justify-between gap-3">

                      <div className="min-w-0">

                        <p className="font-bold text-slate-900 truncate">
                          {item.matiere.nom}
                        </p>

                        {item.matiere
                          .code && (
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            {
                              item.matiere
                                .code
                            }
                          </p>
                        )}

                      </div>

                      {selectionne && (
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">

                          <Check className="w-4 h-4 text-white" />

                        </div>
                      )}

                    </div>

                    <div className="mt-4 space-y-2">

                      <div className="flex items-center gap-2 text-sm text-slate-600">

                        <Users className="w-4 h-4" />

                        <span>
                          {item.classe.nom}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">

                        <Clock3 className="w-4 h-4" />

                        <span>
                          {
                            item
                              .heureDebut
                          }{" "}
                          -{" "}
                          {
                            item
                              .heureFin
                          }
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500">

                        <UserCheck className="w-4 h-4" />

                        <span>
                          {
                            item.classe
                              .eleves
                              .length
                          }{" "}
                          élèves
                        </span>

                      </div>

                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>

        {/* =================================================
            LISTE DES ÉLÈVES
        ================================================= */}

        {coursActuel && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* EN-TÊTE */}

            <div className="p-5 border-b border-slate-200">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="text-xl font-bold text-slate-900">
                      {
                        coursActuel
                          .classe
                          .nom
                      }
                    </h3>

                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {
                        coursActuel
                          .matiere
                          .nom
                      }
                    </span>

                  </div>

                  <p className="text-sm text-slate-500 mt-2">

                    {coursActuel.jour} ·{" "}
                    {
                      coursActuel
                        .heureDebut
                    }{" "}
                    -{" "}
                    {
                      coursActuel
                        .heureFin
                    }

                  </p>

                </div>

                <div className="text-sm text-slate-500">

                  {
                    coursActuel
                      .classe
                      .eleves
                      .length
                  }{" "}
                  élèves

                </div>

              </div>

            </div>

            {/* LISTE */}

            {coursActuel.classe
              .eleves.length === 0 ? (
              <div className="p-10 text-center">

                <Users className="w-12 h-12 text-slate-300 mx-auto" />

                <p className="text-slate-500 mt-3">
                  Aucun élève dans cette
                  classe.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {coursActuel.classe.eleves.map(
                  (eleve, index) => {
                    const statut =
                      statuts[
                        eleve.id
                      ] ||
                      "PRESENT";

                    return (
                      <div
                        key={eleve.id}
                        className="p-4 sm:p-5"
                      >

                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                          {/* INFORMATIONS ÉLÈVE */}

                          <div className="flex items-center gap-3 flex-1">

                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
                              {index + 1}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-900">
                                {
                                  eleve
                                    .prenom
                                }{" "}
                                {
                                  eleve
                                    .nom
                                }
                              </p>

                              {eleve.matricule && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Matricule :{" "}
                                  {
                                    eleve.matricule
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                          {/* BOUTONS */}

                          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">

                            <StatusButton
                              label="Présent"
                              active={
                                statut ===
                                "PRESENT"
                              }
                              type="present"
                              icon={
                                <UserCheck className="w-4 h-4" />
                              }
                              onClick={() =>
                                changerStatut(
                                  eleve.id,
                                  "PRESENT"
                                )
                              }
                            />

                            <StatusButton
                              label="Absent"
                              active={
                                statut ===
                                "ABSENT"
                              }
                              type="absent"
                              icon={
                                <UserX className="w-4 h-4" />
                              }
                              onClick={() =>
                                changerStatut(
                                  eleve.id,
                                  "ABSENT"
                                )
                              }
                            />

                            <StatusButton
                              label="Retard"
                              active={
                                statut ===
                                "RETARD"
                              }
                              type="retard"
                              icon={
                                <Clock3 className="w-4 h-4" />
                              }
                              onClick={() =>
                                changerStatut(
                                  eleve.id,
                                  "RETARD"
                                )
                              }
                            />

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}

            {coursActuel.classe
              .eleves.length > 0 && (
              <div className="bg-slate-50 border-t border-slate-200 p-5">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="flex flex-wrap gap-4">

                    <div className="flex items-center gap-2 text-sm text-green-700">

                      <span className="w-3 h-3 rounded-full bg-green-500" />

                      <strong>
                        {
                          compteurs.presents
                        }
                      </strong>

                      présents

                    </div>

                    <div className="flex items-center gap-2 text-sm text-red-700">

                      <span className="w-3 h-3 rounded-full bg-red-500" />

                      <strong>
                        {
                          compteurs.absents
                        }
                      </strong>

                      absents

                    </div>

                    <div className="flex items-center gap-2 text-sm text-orange-700">

                      <span className="w-3 h-3 rounded-full bg-orange-500" />

                      <strong>
                        {
                          compteurs.retards
                        }
                      </strong>

                      retards

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      enregistrerAppel
                    }
                    disabled={saving}
                    className="w-full lg:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold flex items-center justify-center gap-2 transition"
                  >

                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />

                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />

                        Enregistrer
                        l'appel
                      </>
                    )}

                  </button>

                </div>

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;

  value: number;

  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value}
          </p>

        </div>

        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   BOUTON STATUT
========================================================= */

function StatusButton({
  label,
  active,
  type,
  icon,
  onClick,
}: {
  label: string;

  active: boolean;

  type:
    | "present"
    | "absent"
    | "retard";

  icon: React.ReactNode;

  onClick: () => void;
}) {
  let classes = "";

  if (type === "present") {
    classes = active
      ? "bg-green-100 border-green-500 text-green-700"
      : "bg-white border-slate-200 text-slate-500 hover:bg-green-50 hover:border-green-300";
  }

  if (type === "absent") {
    classes = active
      ? "bg-red-100 border-red-500 text-red-700"
      : "bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-300";
  }

  if (type === "retard") {
    classes = active
      ? "bg-orange-100 border-orange-500 text-orange-700"
      : "bg-white border-slate-200 text-slate-500 hover:bg-orange-50 hover:border-orange-300";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border rounded-xl px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition ${classes}`}
    >
      {icon}

      <span>{label}</span>
    </button>
  );
}