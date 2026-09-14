"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

type Stats = {
  totalProfesseurs: number;
  totalEleves: number;
  totalClasses: number;
  totalMatieres: number;
  professeursPresents: number;
  elevesAbsents: number;
  reclamationsEnAttente: number;
};

const initialStats: Stats = {
  totalProfesseurs: 0,
  totalEleves: 0,
  totalClasses: 0,
  totalMatieres: 0,
  professeursPresents: 0,
  elevesAbsents: 0,
  reclamationsEnAttente: 0,
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meResponse, dashboardResponse] = await Promise.all([
          fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/dashboard", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const meData = await meResponse.json();
        const dashboardData = await dashboardResponse.json();

        if (meResponse.ok && meData.success && meData.user) {
          setUser(meData.user);
        }

        if (dashboardResponse.ok && dashboardData.success) {
          const data = dashboardData.data || {};

          setStats({
            totalProfesseurs:
              data.totaux?.professeurs ??
              data.totalProfesseurs ??
              0,

            totalEleves:
              data.totaux?.eleves ??
              data.totalEleves ??
              0,

            totalClasses:
              data.totaux?.classes ??
              data.totalClasses ??
              0,

            totalMatieres:
              data.totaux?.matieres ??
              data.totalMatieres ??
              0,

            professeursPresents:
              data.aujourdhui?.professeursPresents ??
              data.professeursPresents ??
              0,

            elevesAbsents:
              data.aujourdhui?.elevesAbsents ??
              data.elevesAbsents ??
              0,

            reclamationsEnAttente:
              data.aujourdhui?.reclamationsEnAttente ??
              data.reclamationsEnAttente ??
              0,
          });
        }
      } catch (error) {
        console.error("Erreur dashboard :", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Chargement du tableau de bord...
          </p>
        </div>
      </main>
    );
  }

  const firstLetter = user?.prenom?.charAt(0)?.toUpperCase() || "A";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <IconSchool />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Le Collino
              </p>

              <h1 className="text-lg font-bold text-slate-900">
                Gestion de présence
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 sm:flex">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                Système actif
              </span>
            </div>

            <div className="hidden text-right md:block">
              <p className="text-sm font-bold text-slate-900">
                {user
                  ? `${user.prenom} ${user.nom}`
                  : "Administrateur"}
              </p>

              <p className="text-xs text-slate-400">
                {user?.role || "ADMIN"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg">
              {firstLetter}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Déconnexion"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8">
        {/* HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm sm:p-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-100 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                Tableau de bord
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Bonjour{" "}
                <span className="text-blue-600">
                  {user?.prenom || "Administrateur"}
                </span>{" "}
                👋
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Gérez les professeurs, les élèves, les classes,
                les matières et le suivi quotidien des présences.
              </p>
            </div>

            <Link
              href="/dashboard/presences-eleves"
              className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl"
            >
              <IconPlus />
              Effectuer un appel
              <IconArrowRight />
            </Link>
          </div>
        </section>

        {/* STATISTIQUES */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              Vue générale
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Principaux indicateurs de l'établissement
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Professeurs"
              value={stats.totalProfesseurs}
              description="Professeurs enregistrés"
              href="/dashboard/professeurs"
              icon={<IconTeacher />}
              color="blue"
            />

            <StatCard
              title="Élèves"
              value={stats.totalEleves}
              description="Élèves enregistrés"
              href="/dashboard/eleves"
              icon={<IconStudent />}
              color="violet"
            />

            <StatCard
              title="Classes"
              value={stats.totalClasses}
              description="Classes actives"
              href="/dashboard/classes"
              icon={<IconClass />}
              color="green"
            />

            <StatCard
              title="Matières"
              value={stats.totalMatieres}
              description="Matières disponibles"
              href="/dashboard/matieres"
              icon={<IconBook />}
              color="orange"
            />
          </div>
        </section>

        {/* PRESENCE */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              Présence aujourd'hui
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Suivi rapide de la situation actuelle
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <PresenceCard
              title="Professeurs présents"
              value={stats.professeursPresents}
              description="Présences enregistrées aujourd'hui"
              href="/dashboard/presences-professeurs"
              icon={<IconCheck />}
              iconClass="bg-emerald-50 text-emerald-600"
              badge="Présents"
            />

            <PresenceCard
              title="Élèves absents"
              value={stats.elevesAbsents}
              description="Absences enregistrées aujourd'hui"
              href="/dashboard/presences-eleves"
              icon={<IconUserMinus />}
              iconClass="bg-orange-50 text-orange-600"
              badge="Absents"
            />

            <PresenceCard
              title="Réclamations"
              value={stats.reclamationsEnAttente}
              description="Réclamations à traiter"
              href="/dashboard/reclamations"
              icon={<IconAlert />}
              iconClass="bg-red-50 text-red-600"
              badge="À traiter"
            />
          </div>
        </section>

        {/* ACCES RAPIDES */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              Accès rapides
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Les modules les plus utilisés
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              href="/dashboard/professeurs"
              title="Professeurs"
              description="Gérer les enseignants"
              icon={<IconTeacher />}
            />

            <QuickLink
              href="/dashboard/eleves"
              title="Élèves"
              description="Gérer les élèves"
              icon={<IconStudent />}
            />

            <QuickLink
              href="/dashboard/classes"
              title="Classes"
              description="Gérer les classes"
              icon={<IconClass />}
            />

            <QuickLink
              href="/dashboard/presences-eleves"
              title="Présences"
              description="Faire l'appel"
              icon={<IconClipboard />}
            />
          </div>
        </section>

        {/* MODULES */}
        <section className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              Modules de gestion
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Tous les outils de l'administration
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <ModuleLink
              href="/dashboard/professeurs"
              title="Professeurs"
              icon={<IconTeacher />}
            />

            <ModuleLink
              href="/dashboard/eleves"
              title="Élèves"
              icon={<IconStudent />}
            />

            <ModuleLink
              href="/dashboard/classes"
              title="Classes"
              icon={<IconClass />}
            />

            <ModuleLink
              href="/dashboard/matieres"
              title="Matières"
              icon={<IconBook />}
            />

            <ModuleLink
              href="/dashboard/cours"
              title="Cours"
              icon={<IconCalendar />}
            />

            <ModuleLink
              href="/dashboard/presences-professeurs"
              title="Présence professeurs"
              icon={<IconTeacherPresence />}
            />

            <ModuleLink
              href="/dashboard/presences-eleves"
              title="Présence élèves"
              icon={<IconClipboard />}
            />

            <ModuleLink
              href="/dashboard/reclamations"
              title="Réclamations"
              icon={<IconAlert />}
            />

            <ModuleLink
              href="/dashboard/statistiques"
              title="Statistiques"
              icon={<IconChart />}
            />

            <ModuleLink
              href="/dashboard/rapports"
              title="Rapports"
              icon={<IconReport />}
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-100 pt-6">
          <div className="flex flex-col justify-between gap-3 text-xs text-slate-400 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Le Collino —
              Gestion de présence
            </p>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Système opérationnel
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  href,
  icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: "blue" | "violet" | "green" | "orange";
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    violet: "text-violet-600 bg-violet-50",
    green: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50",
  };

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]} transition duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        <IconArrowUpRight />
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-4xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function PresenceCard({
  title,
  value,
  description,
  href,
  icon,
  iconClass,
  badge,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass} transition duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
          {badge}
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-4xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition duration-300 group-hover:bg-blue-50 group-hover:text-blue-600">
        {icon}
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <IconArrowRight />
    </Link>
  );
}

function ModuleLink({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:text-blue-600">
        {icon}
      </div>

      <span className="flex-1 text-sm font-semibold text-slate-600 group-hover:text-blue-700">
        {title}
      </span>

      <IconArrowRight />
    </Link>
  );
}

function IconSchool() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10.5 12 5l9 5.5M5 10v8.5h14V10M8 18.5v-5h8v5"
      />
    </svg>
  );
}

function IconTeacher() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="12" cy="7" r="3" />
      <path
        strokeLinecap="round"
        d="M5 20c.5-3.5 2.8-5.5 7-5.5s6.5 2 7 5.5"
      />
    </svg>
  );
}

function IconStudent() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="12" cy="8" r="3" />
      <path
        strokeLinecap="round"
        d="M5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4 5 8-3 8 3-8 3-8-3Z"
      />
    </svg>
  );
}

function IconClass() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19V7l8-4 8 4v12"
      />
      <path strokeLinecap="round" d="M8 21v-6h8v6M4 21h16" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z"
      />
      <path strokeLinecap="round" d="M5 4.5v17M9 6h6M9 10h6" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path strokeLinecap="round" d="M9 4V3h6v1M8.5 9h7M8.5 13h7" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path strokeLinecap="round" d="M7 3v4M17 3v4M3.5 9h17" />
    </svg>
  );
}

function IconTeacherPresence() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="9" cy="8" r="3" />
      <path
        strokeLinecap="round"
        d="M3.5 20c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16 17 2 2 3-4"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4 4L19 6"
      />
    </svg>
  );
}

function IconUserMinus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" d="M3.5 20c.5-3.2 2.3-5 5.5-5" />
      <path strokeLinecap="round" d="M16 16h5" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.3 4.4-7 12.1A2 2 0 0 0 5 19.5h14a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z"
      />
      <path strokeLinecap="round" d="M12 9v4M12 16h.01" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        d="M4 20V10M10 20V5M16 20v-8M22 20H2"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l4 4v14H6V3Z"
      />
      <path strokeLinecap="round" d="M14 3v5h5M9 12h6M9 16h6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 text-slate-300"
    >
      <path strokeLinecap="round" d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14 8 4 4-4 4M18 12H9"
      />
    </svg>
  );
}