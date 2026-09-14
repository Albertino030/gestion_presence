"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type User = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

type MenuItemType = {
  nom: string;
  href: string;
  icon: React.ReactNode;
};

/* ======================================================
   ICÔNES
====================================================== */

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTeacher() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6" />
    </svg>
  );
}

function IconStudent() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" />
      <path d="M7 12v4c2.8 2.2 7.2 2.2 10 0v-4" />
      <path d="M21 10v5" />
    </svg>
  );
}

function IconClass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16" />
      <path d="M3 21h18" />
      <path d="M7 7h3M14 7h3M7 11h3M14 11h3M7 15h3M14 15h3" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 5.5V21" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 7 20l1.2-1.2" />
    </svg>
  );
}

function IconTeacherPresence() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.5-3.5 2.3-5.5 5.5-5.5s5 2 5.5 5.5" />
      <path d="m16 15 2 2 3.5-4" />
    </svg>
  );
}

function IconStudentPresence() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.5-3.5 2.3-5.5 5.5-5.5s5 2 5.5 5.5" />
      <path d="M16 9h5M18.5 6.5v5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
      <path d="M2 20h21" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M8 12h8M8 16h6" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconSchool() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-5h6v5" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

/* ======================================================
   MENUS
====================================================== */

const menuPrincipal: MenuItemType[] = [
  {
    nom: "Tableau de bord",
    href: "/dashboard",
    icon: <IconDashboard />,
  },
];

const menuGestion: MenuItemType[] = [
  {
    nom: "Professeurs",
    href: "/dashboard/professeurs",
    icon: <IconTeacher />,
  },
  {
    nom: "Élèves",
    href: "/dashboard/eleves",
    icon: <IconStudent />,
  },
  {
    nom: "Classes",
    href: "/dashboard/classes",
    icon: <IconClass />,
  },
  {
    nom: "Matières",
    href: "/dashboard/matieres",
    icon: <IconBook />,
  },
  {
    nom: "Professeur ↔ Matière",
    href: "/dashboard/professeurs-matieres",
    icon: <IconLink />,
  },
];

const menuPresence: MenuItemType[] = [
  {
    nom: "Présences professeurs",
    href: "/dashboard/presences-professeurs",
    icon: <IconTeacherPresence />,
  },
  {
    nom: "Présences élèves",
    href: "/dashboard/presences-eleves",
    icon: <IconStudentPresence />,
  },
];

const menuSuivi: MenuItemType[] = [
  {
    nom: "Réclamations",
    href: "/dashboard/reclamations",
    icon: <IconClipboard />,
  },
  {
    nom: "Statistiques",
    href: "/dashboard/statistiques",
    icon: <IconChart />,
  },
  {
    nom: "Rapports",
    href: "/dashboard/rapports",
    icon: <IconReport />,
  },
];

/* ======================================================
   LAYOUT
====================================================== */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ====================================================
     AUTHENTIFICATION
  ==================================================== */

  useEffect(() => {
    async function chargerUtilisateur() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Erreur utilisateur :", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    chargerUtilisateur();
  }, [router]);

  /* ====================================================
     FERMER MENU MOBILE
  ==================================================== */

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* ====================================================
     DÉCONNEXION
  ==================================================== */

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  /* ====================================================
     PAGE ACTIVE
  ==================================================== */

  function estActif(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  /* ====================================================
     MENU ITEM
  ==================================================== */

  function MenuItem({ item }: { item: MenuItemType }) {
    const actif = estActif(item.href);

    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          actif
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
            actif
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 group-hover:text-blue-600"
          }`}
        >
          {item.icon}
        </span>

        <span className="truncate">
          {item.nom}
        </span>
      </Link>
    );
  }

  /* ====================================================
     TITRE SECTION
  ==================================================== */

  function SectionTitle({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {children}
      </p>
    );
  }

  /* ====================================================
     LOADING
  ==================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <IconSchool />
          </div>

          <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  /* ====================================================
     INITIALLES
  ==================================================== */

  const initiales =
    `${user?.prenom?.charAt(0) || ""}${user?.nom?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ==================================================
          OVERLAY MOBILE
      ================================================== */}

      {sidebarOpen && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      {/* ==================================================
          SIDEBAR BLANCHE
      ================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* LOGO */}

        <div className="flex h-20 shrink-0 items-center border-b border-slate-100 px-5">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <IconSchool />
            </div>

            <div>
              <p className="text-[15px] font-bold text-slate-900">
                Le Collino
              </p>

              <p className="text-[11px] text-slate-400">
                Gestion de présence
              </p>
            </div>
          </Link>

          {/* FERMER MOBILE */}

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
            aria-label="Fermer"
          >
            <IconClose />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-3 pb-4">

          <SectionTitle>
            Principal
          </SectionTitle>

          <div>
            {menuPrincipal.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
              />
            ))}
          </div>

          <SectionTitle>
            Gestion scolaire
          </SectionTitle>

          <div>
            {menuGestion.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
              />
            ))}
          </div>

          <SectionTitle>
            Présences
          </SectionTitle>

          <div>
            {menuPresence.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
              />
            ))}
          </div>

          <SectionTitle>
            Suivi & rapports
          </SectionTitle>

          <div>
            {menuSuivi.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
              />
            ))}
          </div>
        </nav>

        {/* ==================================================
            BAS DE SIDEBAR
            PAS DE NOM UTILISATEUR
        ================================================== */}

        <div className="shrink-0 px-3 pb-4">

          {/* STATUT */}

          <div className="mb-2 flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span>
              Système actif
            </span>
          </div>

          {/* DÉCONNEXION */}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition group-hover:text-red-600">
              <IconLogout />
            </span>

            <span>
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* ==================================================
          CONTENU
      ================================================== */}

      <div className="lg:pl-72">

        {/* ==================================================
            TOPBAR
        ================================================== */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">

          {/* GAUCHE */}

          <div className="flex items-center gap-3">

            {/* MENU MOBILE */}

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <IconMenu />
            </button>

            <div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:block">
                Administration
              </p>

              <p className="text-sm font-bold text-slate-900 sm:text-base">
                Établissement Le Collino
              </p>
            </div>
          </div>

          {/* DROITE */}

          <div className="flex items-center gap-3">

            {/* SYSTÈME */}

            <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-medium text-slate-500">
                Système actif
              </span>
            </div>

            {/* AVATAR UNIQUEMENT */}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initiales || "AD"}
            </div>
          </div>
        </header>

        {/* PAGE */}

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}