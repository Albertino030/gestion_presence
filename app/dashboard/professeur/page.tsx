"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Statut = "PRESENT" | "ABSENT" | "RETARD";

type Eleve = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
};

type Presence = {
  id: number;
  eleveId: number;
  coursId: number;
  statut: Statut;
  heureAppel: string | null;
  eleve: Eleve;
};

type Cours = {
  id: number;
  jour: string;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
  classe: {
    id: number;
    nom: string;
    niveau: string | null;
    eleves: Eleve[];
  };
  matiere: {
    id: number;
    nom: string;
    code: string | null;
  };
  presencesEleves: Presence[];
};

type DashboardData = {
  professeur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    actif: boolean;
  };

  matieres: {
    id: number;
    nom: string;
    code: string | null;
  }[];

  coursDuJour: Cours[];

  statistiques: {
    nombreCours: number;
    totalEleves: number;
    totalPresents: number;
    totalAbsents: number;
    totalRetards: number;
    tauxPresence: number;
  };

  presenceProfesseur: {
    id: number;
    heureArrivee: string | null;
    heureDepart: string | null;
    statut: Statut;
    methodeDetection: string;
  } | null;

  reclamations: {
    id: number;
    motif: string;
    statut: string;
    dateReclamation: string;
  }[];
};

type IconName =
  | "home"
  | "calendar"
  | "users"
  | "check"
  | "clock"
  | "book"
  | "message"
  | "user"
  | "logout"
  | "refresh"
  | "arrow"
  | "menu"
  | "x"
  | "chevron"
  | "checkCircle"
  | "alert"
  | "close"
  | "school"
  | "phone";

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M8 6h8M8 10h6" />
        </svg>
      );

    case "message":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4A8.1 8.1 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case "checkCircle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <path d="M10.3 3.5 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3l-7.9-13.5a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      );

    case "school":
      return (
        <svg {...common}>
          <path d="m3 10 9-6 9 6-9 6-9-6Z" />
          <path d="M7 12v5l5 3 5-3v-5M21 10v7" />
        </svg>
      );

    case "phone":
      return (
        <svg {...common}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M10 5h4M11 18h2" />
        </svg>
      );

    default:
      return null;
  }
}

function statutLabel(statut: Statut) {
  if (statut === "PRESENT") return "Présent";
  if (statut === "ABSENT") return "Absent";
  return "Retard";
}

function statutClass(statut: Statut) {
  if (statut === "PRESENT") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (statut === "ABSENT") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  return "bg-amber-50 text-amber-700 border-amber-100";
}

function getPresence(cours: Cours, eleveId: number) {
  return cours.presencesEleves.find(
    (presence) => presence.eleveId === eleveId
  );
}

function formatDate() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function ProfesseurDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [coursSelectionne, setCoursSelectionne] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const chargerDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/professeur/espace", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Impossible de charger votre espace."
        );
      }

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger votre espace."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    chargerDashboard();
  }, [chargerDashboard]);

  const coursActuel = useMemo(() => {
    if (!data || coursSelectionne === null) return null;

    return (
      data.coursDuJour.find((cours) => cours.id === coursSelectionne) ?? null
    );
  }, [data, coursSelectionne]);

  async function enregistrerPresence(
    coursId: number,
    eleveId: number,
    statut: Statut
  ) {
    try {
      setSaving(eleveId);
      setMessage("");

      const response = await fetch("/api/professeur/espace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coursId,
          eleveId,
          statut,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Impossible d'enregistrer la présence."
        );
      }

      setMessage("Présence enregistrée avec succès.");

      await chargerDashboard();

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(null);
    }
  }

  async function deconnexion() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  }

  function actualiser() {
    setRefreshing(true);
    chargerDashboard();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Icon name="alert" size={28} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Impossible de charger l’espace
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Une erreur est survenue."}
          </p>

          <button
            type="button"
            onClick={actualiser}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Icon name="refresh" size={18} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const taux = data.statistiques.tauxPresence;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOuvert(!menuOuvert)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label="Menu"
            >
              <Icon name={menuOuvert ? "x" : "menu"} size={21} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Icon name="school" size={21} />
            </div>

            <div>
              <p className="text-sm font-bold leading-none text-slate-900">
                Le Collino
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                Espace professeur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={actualiser}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              <Icon
                name="refresh"
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {data.professeur.prenom} {data.professeur.nom}
                </p>
                <p className="text-[11px] text-slate-400">Professeur</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700 ring-4 ring-blue-50/50">
                {data.professeur.prenom.charAt(0)}
                {data.professeur.nom.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`fixed inset-y-[73px] left-0 z-30 w-72 border-r border-slate-200 bg-white p-5 transition-transform duration-300 lg:static lg:inset-auto lg:block lg:min-h-[calc(100vh-73px)] lg:translate-x-0 ${
            menuOuvert ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col gap-1">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Navigation
            </p>

            <Link
              href="/dashboard/professeur"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <Icon name="home" size={19} />
              Tableau de bord
            </Link>

            <a
              href="#cours"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon name="calendar" size={19} />
              Mes cours
            </a>

            <a
              href="#appel"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon name="check" size={19} />
              Faire l’appel
            </a>

            <a
              href="#matieres"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon name="book" size={19} />
              Mes matières
            </a>

            <a
              href="#reclamations"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon name="message" size={19} />
              Réclamations
            </a>

            <div className="my-5 h-px bg-slate-100" />

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Mon compte
            </p>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600">
              <Icon name="user" size={19} />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {data.professeur.prenom} {data.professeur.nom}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {data.professeur.email}
                </p>
              </div>
            </div>
          </nav>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-800">
                  Système actif
                </p>
                <p className="text-[10px] text-emerald-600">
                  Présence synchronisée
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={deconnexion}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Icon name="logout" size={19} />
              Déconnexion
            </button>
          </div>
        </aside>

        {menuOuvert && (
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOuvert(false)}
            className="fixed inset-0 top-[73px] z-20 bg-slate-900/20 lg:hidden"
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Icon name="calendar" size={16} />
                  <span className="capitalize">{formatDate()}</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Bonjour, {data.professeur.prenom} 👋
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Bienvenue dans votre espace professeur. Gérez vos cours et
                  effectuez facilement l’appel de vos élèves.
                </p>
              </div>

              <a
                href="#appel"
                className="group inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Icon name="check" size={18} />
                Effectuer un appel
                <Icon
                  name="arrow"
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Cours aujourd’hui
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {data.statistiques.nombreCours}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:scale-110">
                  <Icon name="calendar" size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Cours programmés aujourd’hui
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Élèves
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {data.statistiques.totalEleves}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition duration-300 group-hover:scale-110">
                  <Icon name="users" size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Élèves de vos classes aujourd’hui
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Présents
                  </p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {data.statistiques.totalPresents}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition duration-300 group-hover:scale-110">
                  <Icon name="checkCircle" size={21} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Élèves actuellement marqués présents
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Taux de présence
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {taux}%
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:scale-110">
                  <Icon name="check" size={21} />
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${Math.min(taux, 100)}%` }}
                />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div
              id="cours"
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Mes cours aujourd’hui
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Sélectionnez un cours pour effectuer l’appel.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  <Icon name="calendar" size={15} />
                  {data.statistiques.nombreCours} cours
                </div>
              </div>

              <div className="p-5">
                {data.coursDuJour.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Icon name="calendar" size={27} />
                    </div>
                    <p className="font-semibold text-slate-700">
                      Aucun cours aujourd’hui
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Votre planning ne contient aucun cours pour cette
                      journée.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.coursDuJour.map((cours) => {
                      const total = cours.classe.eleves.length;

                      const presents = cours.presencesEleves.filter(
                        (p) => p.statut === "PRESENT"
                      ).length;

                      const absents = cours.presencesEleves.filter(
                        (p) => p.statut === "ABSENT"
                      ).length;

                      const selected = coursSelectionne === cours.id;

                      return (
                        <button
                          key={cours.id}
                          type="button"
                          onClick={() =>
                            setCoursSelectionne(
                              selected ? null : cours.id
                            )
                          }
                          className={`group w-full rounded-2xl border p-4 text-left transition duration-300 ${
                            selected
                              ? "border-blue-300 bg-blue-50/50 shadow-md shadow-blue-100"
                              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
                              <Icon name="book" size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900">
                                  {cours.matiere.nom}
                                </h3>

                                {cours.matiere.code && (
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
                                    {cours.matiere.code}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <Icon name="users" size={14} />
                                  {cours.classe.nom}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Icon name="clock" size={14} />
                                  {cours.heureDebut} - {cours.heureFin}
                                </span>

                                {cours.salle && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Icon name="school" size={14} />
                                    Salle {cours.salle}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 sm:shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">
                                  {presents}/{total}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  présents
                                </p>
                              </div>

                              {absents > 0 && (
                                <span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                                  {absents} absent{absents > 1 ? "s" : ""}
                                </span>
                              )}

                              <Icon
                                name="chevron"
                                size={18}
                                className={`text-slate-400 transition-transform ${
                                  selected ? "rotate-180 text-blue-600" : ""
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon name="clock" size={21} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Ma présence
                    </h2>
                    <p className="text-xs text-slate-400">
                      Aujourd’hui
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  {data.presenceProfesseur ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Statut
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                          <Icon name="checkCircle" size={14} />
                          {statutLabel(data.presenceProfesseur.statut)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          Heure d’arrivée
                        </span>
                        <span className="font-bold text-slate-800">
                          {data.presenceProfesseur.heureArrivee
                            ? new Date(
                                data.presenceProfesseur.heureArrivee
                              ).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Détection</span>
                        <span className="font-semibold text-slate-700">
                          {data.presenceProfesseur.methodeDetection ===
                          "WIFI"
                            ? "Wi-Fi"
                            : data.presenceProfesseur.methodeDetection}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <Icon
                        name="clock"
                        size={25}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Présence non enregistrée
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Votre présence sera enregistrée à votre arrivée.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div
                id="matieres"
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Mes matières
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Matières enseignées
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Icon name="book" size={19} />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {data.matieres.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">
                      Aucune matière associée.
                    </p>
                  ) : (
                    data.matieres.map((matiere) => (
                      <div
                        key={matiere.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:border-violet-100 hover:bg-violet-50/30"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                            <Icon name="book" size={15} />
                          </div>

                          <span className="truncate text-sm font-semibold text-slate-700">
                            {matiere.nom}
                          </span>
                        </div>

                        {matiere.code && (
                          <span className="ml-2 text-[10px] font-bold text-slate-400">
                            {matiere.code}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="appel" className="mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Faire l’appel
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Marquez le statut de chaque élève.
                    </p>
                  </div>

                  {coursActuel && (
                    <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                      {coursActuel.matiere.nom} — {coursActuel.classe.nom}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5">
                {!coursActuel ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                      <Icon name="users" size={27} />
                    </div>

                    <h3 className="font-bold text-slate-800">
                      Sélectionnez un cours
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                      Choisissez un cours dans la section « Mes cours
                      aujourd’hui » pour afficher les élèves et effectuer
                      l’appel.
                    </p>

                    <a
                      href="#cours"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Voir mes cours
                      <Icon name="arrow" size={16} />
                    </a>
                  </div>
                ) : (
                  <>
                    {message && (
                      <div
                        className={`mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
                          message.includes("succès")
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-red-100 bg-red-50 text-red-700"
                        }`}
                      >
                        <Icon
                          name={
                            message.includes("succès")
                              ? "checkCircle"
                              : "alert"
                          }
                          size={18}
                        />
                        {message}
                      </div>
                    )}

                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                        <span className="text-slate-400">Classe :</span>{" "}
                        {coursActuel.classe.nom}
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                        <span className="text-slate-400">Élèves :</span>{" "}
                        {coursActuel.classe.eleves.length}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="hidden grid-cols-[60px_1fr_130px_250px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid">
                        <span>#</span>
                        <span>Élève</span>
                        <span>Statut</span>
                        <span className="text-right">Action</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {coursActuel.classe.eleves.map((eleve, index) => {
                          const presence = getPresence(
                            coursActuel,
                            eleve.id
                          );

                          const statut = presence?.statut ?? null;

                          return (
                            <div
                              key={eleve.id}
                              className="grid gap-4 px-4 py-4 transition hover:bg-slate-50/70 md:grid-cols-[60px_1fr_130px_250px] md:items-center md:px-5"
                            >
                              <span className="hidden text-xs font-bold text-slate-400 md:block">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                  {eleve.prenom.charAt(0)}
                                  {eleve.nom.charAt(0)}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-slate-800">
                                    {eleve.prenom} {eleve.nom}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {eleve.matricule}
                                  </p>
                                </div>
                              </div>

                              <div>
                                {statut ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${statutClass(
                                      statut
                                    )}`}
                                  >
                                    {statut === "PRESENT" && (
                                      <Icon name="check" size={13} />
                                    )}

                                    {statut === "ABSENT" && (
                                      <Icon name="close" size={13} />
                                    )}

                                    {statut === "RETARD" && (
                                      <Icon name="clock" size={13} />
                                    )}

                                    {statutLabel(statut)}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-slate-400">
                                    Non renseigné
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 md:justify-end">
                                <button
                                  type="button"
                                  disabled={saving === eleve.id}
                                  onClick={() =>
                                    enregistrerPresence(
                                      coursActuel.id,
                                      eleve.id,
                                      "PRESENT"
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  <Icon name="check" size={14} />
                                  Présent
                                </button>

                                <button
                                  type="button"
                                  disabled={saving === eleve.id}
                                  onClick={() =>
                                    enregistrerPresence(
                                      coursActuel.id,
                                      eleve.id,
                                      "ABSENT"
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  <Icon name="close" size={14} />
                                  Absent
                                </button>

                                <button
                                  type="button"
                                  disabled={saving === eleve.id}
                                  onClick={() =>
                                    enregistrerPresence(
                                      coursActuel.id,
                                      eleve.id,
                                      "RETARD"
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                >
                                  <Icon name="clock" size={14} />
                                  Retard
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section id="reclamations" className="mt-8 mb-10">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Mes réclamations
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Suivi de vos dernières réclamations.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon name="message" size={19} />
                </div>
              </div>

              <div className="p-5">
                {data.reclamations.length === 0 ? (
                  <div className="py-8 text-center">
                    <Icon
                      name="message"
                      size={28}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Aucune réclamation
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Vous n’avez aucune réclamation enregistrée.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.reclamations.map((reclamation) => (
                      <div
                        key={reclamation.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                            <Icon name="message" size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {reclamation.motif}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(
                                reclamation.dateReclamation
                              ).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-lg px-3 py-1.5 text-xs font-bold ${
                            reclamation.statut === "ACCEPTEE"
                              ? "bg-emerald-50 text-emerald-700"
                              : reclamation.statut === "REFUSEE"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {reclamation.statut === "ACCEPTEE"
                            ? "Acceptée"
                            : reclamation.statut === "REFUSEE"
                            ? "Refusée"
                            : "En attente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-100 py-6 text-center">
            <p className="text-xs text-slate-400">
              Le Collino • Gestion de présence scolaire
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
