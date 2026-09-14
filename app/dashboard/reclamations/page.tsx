"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardData = {
  success: boolean;

  statistiques: {
    totalProfesseurs: number;
    professeursActifs: number;
    totalEleves: number;
    elevesActifs: number;
    totalClasses: number;
    classesActives: number;
    totalMatieres: number;
    matieresActives: number;
  };

  presenceProfesseurs: {
    present: number;
    absent: number;
    retard: number;
    total: number;
  };

  presenceEleves: {
    present: number;
    absent: number;
    retard: number;
    total: number;
  };

  reclamations: {
    total: number;
    enAttente: number;
    acceptees: number;
    refusees: number;
  };

  dernieresPresencesProfesseurs: Array<{
    id: number;
    statut: string;
    methodeDetection: string;
    datePresence: string;
    heureArrivee: string | null;
    heureDepart: string | null;
    professeur: {
      user: {
        nom: string;
        prenom: string;
        email: string;
      };
    };
  }>;

  dernieresReclamations: Array<{
    id: number;
    motif: string;
    statut: string;
    dateReclamation: string;
    professeur: {
      user: {
        nom: string;
        prenom: string;
      };
    };
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function chargerDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Impossible de charger le tableau de bord."
        );
      }

      setData(result);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du tableau de bord."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerDashboard();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatHeure(date: string | null) {
    if (!date) return "--";

    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statutLabel(statut: string) {
    switch (statut) {
      case "PRESENT":
        return "Présent";

      case "ABSENT":
        return "Absent";

      case "RETARD":
        return "Retard";

      case "EN_ATTENTE":
        return "En attente";

      case "ACCEPTEE":
        return "Acceptée";

      case "REFUSEE":
        return "Refusée";

      default:
        return statut;
    }
  }

  function statutClass(statut: string) {
    switch (statut) {
      case "PRESENT":
        return "bg-green-100 text-green-700";

      case "ABSENT":
        return "bg-red-100 text-red-700";

      case "RETARD":
        return "bg-orange-100 text-orange-700";

      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-700";

      case "ACCEPTEE":
        return "bg-green-100 text-green-700";

      case "REFUSEE":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded bg-gray-200" />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-gray-200"
                />
              ))}
            </div>

            <div className="h-80 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            ⚠️
          </div>

          <h1 className="mb-2 text-xl font-bold text-gray-900">
            Impossible de charger le tableau de bord
          </h1>

          <p className="mb-6 text-gray-600">{error}</p>

          <button
            onClick={chargerDashboard}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Tableau de bord
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Gestion de présence — Établissement Le Collino
            </p>
          </div>

          <button
            onClick={chargerDashboard}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ↻ Actualiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* DATE */}
        <div className="flex flex-col justify-between gap-2 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-gray-500">Aujourd'hui</p>

            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="text-sm text-gray-500">
            Vue générale de l'établissement
          </div>
        </div>

        {/* STATISTIQUES GENERALES */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Vue générale
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* PROFESSEURS */}
            <Link
              href="/dashboard/professeurs"
              className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Professeurs
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {data.statistiques.totalProfesseurs}
                  </p>

                  <p className="mt-2 text-xs text-green-600">
                    {data.statistiques.professeursActifs} actifs
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  👨‍🏫
                </div>
              </div>
            </Link>

            {/* ELEVES */}
            <Link
              href="/dashboard/eleves"
              className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Élèves</p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {data.statistiques.totalEleves}
                  </p>

                  <p className="mt-2 text-xs text-green-600">
                    {data.statistiques.elevesActifs} actifs
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                  👨‍🎓
                </div>
              </div>
            </Link>

            {/* CLASSES */}
            <Link
              href="/dashboard/classes"
              className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Classes</p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {data.statistiques.totalClasses}
                  </p>

                  <p className="mt-2 text-xs text-green-600">
                    {data.statistiques.classesActives} actives
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                  🏫
                </div>
              </div>
            </Link>

            {/* MATIERES */}
            <Link
              href="/dashboard/matieres"
              className="group rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Matières
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {data.statistiques.totalMatieres}
                  </p>

                  <p className="mt-2 text-xs text-green-600">
                    {data.statistiques.matieresActives} actives
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  📚
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* PRESENCES */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Présences aujourd'hui
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* PROFESSEURS */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Présence des professeurs
                  </h3>

                  <p className="text-sm text-gray-500">
                    Suivi de l'arrivée des enseignants
                  </p>
                </div>

                <span className="text-2xl">👨‍🏫</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {data.presenceProfesseurs.present}
                  </p>

                  <p className="mt-1 text-xs text-green-700">Présents</p>
                </div>

                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {data.presenceProfesseurs.absent}
                  </p>

                  <p className="mt-1 text-xs text-red-700">Absents</p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4 text-center">
                  <p className="text-2xl font-bold text-orange-700">
                    {data.presenceProfesseurs.retard}
                  </p>

                  <p className="mt-1 text-xs text-orange-700">Retards</p>
                </div>
              </div>

              <Link
                href="/dashboard/presences-professeurs"
                className="mt-5 block rounded-xl bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Voir les présences des professeurs →
              </Link>
            </div>

            {/* ELEVES */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">
                    Présence des élèves
                  </h3>

                  <p className="text-sm text-gray-500">
                    Suivi des appels en classe
                  </p>
                </div>

                <span className="text-2xl">👨‍🎓</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {data.presenceEleves.present}
                  </p>

                  <p className="mt-1 text-xs text-green-700">Présents</p>
                </div>

                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {data.presenceEleves.absent}
                  </p>

                  <p className="mt-1 text-xs text-red-700">Absents</p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4 text-center">
                  <p className="text-2xl font-bold text-orange-700">
                    {data.presenceEleves.retard}
                  </p>

                  <p className="mt-1 text-xs text-orange-700">Retards</p>
                </div>
              </div>

              <Link
                href="/dashboard/presences-eleves"
                className="mt-5 block rounded-xl bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Voir les présences des élèves →
              </Link>
            </div>
          </div>
        </section>

        {/* RECLAMATIONS */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Réclamations
              </h2>

              <p className="text-sm text-gray-500">
                Suivi des réclamations des professeurs
              </p>
            </div>

            <Link
              href="/dashboard/reclamations"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tout →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.reclamations.total}
              </p>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-5">
              <p className="text-sm text-yellow-700">En attente</p>
              <p className="mt-2 text-3xl font-bold text-yellow-800">
                {data.reclamations.enAttente}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-sm text-green-700">Acceptées</p>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {data.reclamations.acceptees}
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-5">
              <p className="text-sm text-red-700">Refusées</p>
              <p className="mt-2 text-3xl font-bold text-red-800">
                {data.reclamations.refusees}
              </p>
            </div>
          </div>
        </section>

        {/* ACCES RAPIDES */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Accès rapides
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/professeurs"
              className="rounded-2xl bg-blue-600 p-5 text-white transition hover:bg-blue-700"
            >
              <div className="text-3xl">👨‍🏫</div>
              <h3 className="mt-3 font-bold">Professeurs</h3>
              <p className="mt-1 text-sm text-blue-100">
                Gérer les enseignants
              </p>
            </Link>

            <Link
              href="/dashboard/eleves"
              className="rounded-2xl bg-purple-600 p-5 text-white transition hover:bg-purple-700"
            >
              <div className="text-3xl">👨‍🎓</div>
              <h3 className="mt-3 font-bold">Élèves</h3>
              <p className="mt-1 text-sm text-purple-100">
                Gérer les élèves
              </p>
            </Link>

            <Link
              href="/dashboard/statistiques"
              className="rounded-2xl bg-green-600 p-5 text-white transition hover:bg-green-700"
            >
              <div className="text-3xl">📊</div>
              <h3 className="mt-3 font-bold">Statistiques</h3>
              <p className="mt-1 text-sm text-green-100">
                Consulter les statistiques
              </p>
            </Link>

            <Link
              href="/dashboard/rapports"
              className="rounded-2xl bg-orange-600 p-5 text-white transition hover:bg-orange-700"
            >
              <div className="text-3xl">📄</div>
              <h3 className="mt-3 font-bold">Rapports</h3>
              <p className="mt-1 text-sm text-orange-100">
                Générer les rapports
              </p>
            </Link>
          </div>
        </section>

        {/* DERNIERES PRESENCES */}
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-5">
            <div>
              <h2 className="font-bold text-gray-900">
                Dernières présences des professeurs
              </h2>

              <p className="text-sm text-gray-500">
                Les derniers enregistrements
              </p>
            </div>

            <Link
              href="/dashboard/presences-professeurs"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tout →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Professeur</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Arrivée</th>
                  <th className="px-5 py-4">Départ</th>
                  <th className="px-5 py-4">Méthode</th>
                  <th className="px-5 py-4">Statut</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.dernieresPresencesProfesseurs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-gray-500"
                    >
                      Aucune présence enregistrée.
                    </td>
                  </tr>
                ) : (
                  data.dernieresPresencesProfesseurs.map((presence) => (
                    <tr key={presence.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {presence.professeur.user.prenom}{" "}
                          {presence.professeur.user.nom}
                        </div>

                        <div className="text-xs text-gray-500">
                          {presence.professeur.user.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(presence.datePresence)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatHeure(presence.heureArrivee)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatHeure(presence.heureDepart)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {presence.methodeDetection}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statutClass(
                            presence.statut
                          )}`}
                        >
                          {statutLabel(presence.statut)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* DERNIERES RECLAMATIONS */}
        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-5">
            <div>
              <h2 className="font-bold text-gray-900">
                Dernières réclamations
              </h2>

              <p className="text-sm text-gray-500">
                Les dernières demandes reçues
              </p>
            </div>

            <Link
              href="/dashboard/reclamations"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Voir tout →
            </Link>
          </div>

          <div className="divide-y">
            {data.dernieresReclamations.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-500">
                Aucune réclamation.
              </div>
            ) : (
              data.dernieresReclamations.map((reclamation) => (
                <div
                  key={reclamation.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {reclamation.professeur.user.prenom}{" "}
                      {reclamation.professeur.user.nom}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {reclamation.motif}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(reclamation.dateReclamation)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statutClass(
                      reclamation.statut
                    )}`}
                  >
                    {statutLabel(reclamation.statut)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}