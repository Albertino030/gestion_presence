"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  Clock3,
  Bell,
  LogOut,
  Menu,
  X,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  UserCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Matiere = {
  id: number;
  nom: string;
};

type Eleve = {
  id: number;
  nom: string;
  prenom: string;
  classe?: {
    id: number;
    nom: string;
  } | null;
};

type Classe = {
  id: number;
  nom: string;
  niveau?: string | null;
  eleves?: Eleve[];
};

type Stats = {
  totalEleves?: number;
  presents?: number;
  absents?: number;
  retards?: number;
};

type Professeur = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
};

type EspaceData = {
  professeur?: Professeur;
  matieres?: Matiere[];
  classes?: Classe[];
  eleves?: Eleve[];
  stats?: Stats;
  presences?: unknown[];
  reclamations?: unknown[];
};

type User = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

export default function ProfesseurPage() {
  const router = useRouter();

  const [data, setData] = useState<EspaceData | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadEspace();
  }, []);

  async function loadEspace() {
    try {
      setLoading(true);
      setError("");

      const meResponse = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();

        if (meData.success && meData.user) {
          setUser(meData.user);

          if (meData.user.role !== "PROFESSEUR") {
            router.replace("/dashboard");
            return;
          }
        }
      }

      const response = await fetch("/api/professeur/espace", {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Impossible de charger l'espace professeur."
        );
      }

      setData(result.data || result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors du chargement."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
    }
  }

  const professeur = data?.professeur;

  const prenom =
    professeur?.prenom ||
    user?.prenom ||
    "Professeur";

  const nom =
    professeur?.nom ||
    user?.nom ||
    "";

  const email =
    professeur?.email ||
    user?.email ||
    "";

  const matieres = data?.matieres || [];
  const classes = data?.classes || [];
  const eleves = data?.eleves || [];

  const stats = data?.stats || {};

  const totalEleves =
    stats.totalEleves ??
    eleves.length ??
    classes.reduce(
      (total, classe) => total + (classe.eleves?.length || 0),
      0
    );

  const presents = stats.presents ?? 0;
  const absents = stats.absents ?? 0;
  const retards = stats.retards ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />

          <p className="mt-4 text-slate-600">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 mt-5">
            Impossible de charger votre espace
          </h1>

          <p className="text-slate-600 mt-3 text-sm">
            {error}
          </p>

          <button
            onClick={loadEspace}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
          >
            Réessayer
          </button>

          <button
            onClick={() => router.push("/login")}
            className="mt-3 w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* MOBILE HEADER */}
      <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Le Colino
              </p>
              <p className="text-xs text-slate-500">
                Espace professeur
              </p>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 space-y-2">

            <MobileMenuButton
              icon={<LayoutDashboard className="w-5 h-5" />}
              text="Tableau de bord"
              onClick={() => setMenuOpen(false)}
            />

            <MobileMenuButton
              icon={<ClipboardCheck className="w-5 h-5" />}
              text="Faire l'appel"
              onClick={() => {
                setMenuOpen(false);
                router.push("/professeur/presences");
              }}
            />

            <MobileMenuButton
              icon={<BookOpen className="w-5 h-5" />}
              text="Mes matières"
              onClick={() => {
                setMenuOpen(false);
                router.push("/professeur/matieres");
              }}
            />

            <MobileMenuButton
              icon={<Users className="w-5 h-5" />}
              text="Mes classes"
              onClick={() => {
                setMenuOpen(false);
                router.push("/professeur/classes");
              }}
            />

            <MobileMenuButton
              icon={<UserCircle className="w-5 h-5" />}
              text="Mon profil"
              onClick={() => {
                setMenuOpen(false);
                router.push("/professeur/profil");
              }}
            />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <div className="flex min-h-screen">

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col fixed left-0 top-0 bottom-0">

          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div className="ml-3">
              <p className="font-bold text-lg">
                Le Colino
              </p>
              <p className="text-xs text-slate-400">
                Espace professeur
              </p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">

            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              text="Tableau de bord"
              active
            />

            <SidebarItem
              icon={<ClipboardCheck className="w-5 h-5" />}
              text="Faire l'appel"
              onClick={() => router.push("/professeur/presences")}
            />

            <SidebarItem
              icon={<BookOpen className="w-5 h-5" />}
              text="Mes matières"
              onClick={() => router.push("/professeur/matieres")}
            />

            <SidebarItem
              icon={<Users className="w-5 h-5" />}
              text="Mes classes"
              onClick={() => router.push("/professeur/classes")}
            />

            <SidebarItem
              icon={<GraduationCap className="w-5 h-5" />}
              text="Mes élèves"
              onClick={() => router.push("/professeur/eleves")}
            />

            <SidebarItem
              icon={<BarChart3 className="w-5 h-5" />}
              text="Statistiques"
              onClick={() => router.push("/professeur/statistiques")}
            />

            <SidebarItem
              icon={<Bell className="w-5 h-5" />}
              text="Réclamations"
              onClick={() => router.push("/professeur/reclamations")}
            />

            <SidebarItem
              icon={<UserCircle className="w-5 h-5" />}
              text="Mon profil"
              onClick={() => router.push("/professeur/profil")}
            />

          </nav>

          <div className="p-4 border-t border-slate-800">

            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {prenom.charAt(0)}
                {nom.charAt(0)}
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {prenom} {nom}
                </p>

                <p className="text-xs text-slate-400 truncate">
                  {email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>

          </div>
        </aside>

        {/* CONTENU */}
        <main className="flex-1 lg:ml-64">

          {/* HEADER */}
          <div className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Tableau de bord
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Bienvenue dans votre espace professeur.
              </p>
            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={() => router.push("/professeur/reclamations")}
                className="relative p-3 rounded-xl hover:bg-slate-100"
              >
                <Bell className="w-5 h-5 text-slate-600" />
              </button>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {prenom.charAt(0)}
                  {nom.charAt(0)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {prenom} {nom}
                  </p>

                  <p className="text-xs text-slate-500">
                    Professeur
                  </p>
                </div>

              </div>

            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">

            {/* MOBILE TITLE */}
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Bonjour {prenom} 👋
              </h1>

              <p className="text-slate-500 mt-1">
                Voici votre espace professeur.
              </p>
            </div>

            {/* BOUTON APPEL */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-6 h-6" />

                    <span className="font-semibold">
                      Présence des élèves
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold">
                    Faire l'appel
                  </h2>

                  <p className="text-blue-100 mt-1 text-sm">
                    Enregistrez les absences et retards de vos élèves.
                  </p>
                </div>

                <button
                  onClick={() => router.push("/professeur/presences")}
                  className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Faire l'appel
                </button>

              </div>

            </div>

            {/* STATISTIQUES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

              <StatCard
                title="Mes matières"
                value={matieres.length}
                icon={<BookOpen className="w-6 h-6" />}
                description="Matières attribuées"
              />

              <StatCard
                title="Mes classes"
                value={classes.length}
                icon={<Users className="w-6 h-6" />}
                description="Classes attribuées"
              />

              <StatCard
                title="Mes élèves"
                value={totalEleves}
                icon={<GraduationCap className="w-6 h-6" />}
                description="Élèves concernés"
              />

              <StatCard
                title="Présents"
                value={presents}
                icon={<UserCheck className="w-6 h-6" />}
                description="Aujourd'hui"
              />

            </div>

            {/* PRESENCE DU JOUR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">

                <div className="p-5 border-b border-slate-200 flex items-center justify-between">

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Présence aujourd'hui
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Résumé des présences de vos élèves
                    </p>
                  </div>

                  <CalendarDays className="w-6 h-6 text-slate-400" />

                </div>

                <div className="p-5">

                  <div className="grid grid-cols-3 gap-3">

                    <PresenceBox
                      title="Présents"
                      value={presents}
                      icon={<CheckCircle2 className="w-5 h-5" />}
                    />

                    <PresenceBox
                      title="Absents"
                      value={absents}
                      icon={<UserX className="w-5 h-5" />}
                    />

                    <PresenceBox
                      title="Retards"
                      value={retards}
                      icon={<Clock3 className="w-5 h-5" />}
                    />

                  </div>

                  <button
                    onClick={() => router.push("/professeur/presences")}
                    className="mt-5 w-full border border-blue-200 text-blue-700 hover:bg-blue-50 py-3 rounded-xl font-medium transition"
                  >
                    Voir les présences
                  </button>

                </div>

              </div>

              {/* PROFIL */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

                <div className="p-5 border-b border-slate-200">
                  <h2 className="font-bold text-slate-900">
                    Mon profil
                  </h2>
                </div>

                <div className="p-5">

                  <div className="flex items-center gap-4">

                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                      {prenom.charAt(0)}
                      {nom.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">
                        {prenom} {nom}
                      </p>

                      <p className="text-sm text-slate-500 truncate">
                        {email}
                      </p>
                    </div>

                  </div>

                  {professeur?.telephone && (
                    <div className="mt-5 text-sm">
                      <span className="text-slate-500">
                        Téléphone
                      </span>

                      <p className="font-medium text-slate-900 mt-1">
                        {professeur.telephone}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => router.push("/professeur/profil")}
                    className="mt-5 w-full border border-slate-300 hover:bg-slate-50 py-3 rounded-xl font-medium transition"
                  >
                    Modifier mon profil
                  </button>

                </div>

              </div>

            </div>

            {/* MATIERES + CLASSES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* MATIERES */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

                <div className="p-5 border-b border-slate-200 flex items-center justify-between">

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Mes matières
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Matières qui vous sont attribuées
                    </p>
                  </div>

                  <BookOpen className="w-6 h-6 text-slate-400" />

                </div>

                <div className="p-5">

                  {matieres.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="w-6 h-6" />}
                      text="Aucune matière attribuée pour le moment."
                    />
                  ) : (
                    <div className="space-y-3">

                      {matieres.slice(0, 5).map((matiere) => (
                        <div
                          key={matiere.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {matiere.nom}
                            </p>

                            <p className="text-xs text-slate-500">
                              Matière
                            </p>
                          </div>
                        </div>
                      ))}

                      {matieres.length > 5 && (
                        <button
                          onClick={() =>
                            router.push("/professeur/matieres")
                          }
                          className="w-full text-blue-600 text-sm font-medium py-2"
                        >
                          Voir toutes les matières
                        </button>
                      )}

                    </div>
                  )}

                </div>

              </div>

              {/* CLASSES */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

                <div className="p-5 border-b border-slate-200 flex items-center justify-between">

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Mes classes
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Classes qui vous sont attribuées
                    </p>
                  </div>

                  <Users className="w-6 h-6 text-slate-400" />

                </div>

                <div className="p-5">

                  {classes.length === 0 ? (
                    <EmptyState
                      icon={<Users className="w-6 h-6" />}
                      text="Aucune classe attribuée pour le moment."
                    />
                  ) : (
                    <div className="space-y-3">

                      {classes.slice(0, 5).map((classe) => (
                        <div
                          key={classe.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {classe.nom}
                              </p>

                              {classe.niveau && (
                                <p className="text-xs text-slate-500">
                                  {classe.niveau}
                                </p>
                              )}
                            </div>

                          </div>

                          <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600">
                            {classe.eleves?.length || 0} élèves
                          </span>

                        </div>
                      ))}

                      {classes.length > 5 && (
                        <button
                          onClick={() =>
                            router.push("/professeur/classes")
                          }
                          className="w-full text-blue-600 text-sm font-medium py-2"
                        >
                          Voir toutes les classes
                        </button>
                      )}

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}

/* =========================
   COMPOSANTS
========================= */

function SidebarItem({
  icon,
  text,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">
        {text}
      </span>
    </button>
  );
}

function MobileMenuButton({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 text-left"
    >
      {icon}
      <span className="font-medium">
        {text}
      </span>
    </button>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {description}
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>

      </div>
    </div>
  );
}

function PresenceBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-sm">
          {title}
        </span>
      </div>

      <p className="text-2xl font-bold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="py-8 text-center">

      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mt-3">
        {text}
      </p>

    </div>
  );
}