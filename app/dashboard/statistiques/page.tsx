"use client";

import { useEffect, useState } from "react";

type Statistiques = {
  periode: {
    dateDebut: string;
    dateFin: string;
  };

  generales: {
    professeurs: {
      total: number;
      actifs: number;
    };

    eleves: {
      total: number;
      actifs: number;
    };

    classes: {
      total: number;
      actives: number;
    };

    matieres: {
      total: number;
      actives: number;
    };
  };

  professeurs: {
    presents: number;
    absents: number;
    retards: number;
    total: number;
    tauxPresence: number;
  };

  eleves: {
    presents: number;
    absents: number;
    retards: number;
    total: number;
    tauxPresence: number;
  };

  reclamations: {
    total: number;
    attente: number;
    acceptees: number;
    refusees: number;
  };

  classes: Array<{
    id: number;
    nom: string;
    niveau: string | null;
    nombreEleves: number;
    presents: number;
    absents: number;
    retards: number;
    total: number;
    tauxPresence: number;
  }>;
};

export default function StatistiquesPage() {
  const aujourdHui =
    new Date().toISOString().split("T")[0];

  const [dateDebut, setDateDebut] =
    useState(aujourdHui);

  const [dateFin, setDateFin] =
    useState(aujourdHui);

  const [data, setData] =
    useState<Statistiques | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function chargerStatistiques() {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        dateDebut,
        dateFin,
      });

      const response = await fetch(
        `/api/statistiques?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Erreur de chargement."
        );
      }

      setData(result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    chargerStatistiques();
  }, []);

  function appliquerFiltre() {
    chargerStatistiques();
  }

  function formatPourcentage(
    valeur: number
  ) {
    return `${valeur.toFixed(2)} %`;
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            Chargement des statistiques...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        Impossible de charger les statistiques.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Statistiques et rapports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Vue générale des activités de
            l'établissement.
          </p>
        </div>

        {/* FILTRE DATE */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date début
              </label>

              <input
                type="date"
                value={dateDebut}
                onChange={(e) =>
                  setDateDebut(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date fin
              </label>

              <input
                type="date"
                value={dateFin}
                onChange={(e) =>
                  setDateFin(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={appliquerFiltre}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Chargement..."
                  : "Actualiser"}
              </button>
            </div>

          </div>
        </div>

        {/* CARTES GÉNÉRALES */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Professeurs
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.generales.professeurs.total}
            </p>

            <p className="mt-1 text-xs text-green-600">
              {data.generales.professeurs.actifs} actifs
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Élèves
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.generales.eleves.total}
            </p>

            <p className="mt-1 text-xs text-green-600">
              {data.generales.eleves.actifs} actifs
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Classes
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.generales.classes.total}
            </p>

            <p className="mt-1 text-xs text-green-600">
              {data.generales.classes.actives} actives
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">
              Matières
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {data.generales.matieres.total}
            </p>

            <p className="mt-1 text-xs text-green-600">
              {data.generales.matieres.actives} actives
            </p>
          </div>

        </div>

        {/* PRÉSENCE PROFESSEURS */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-center">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Présence des professeurs
              </h2>

              <p className="text-sm text-gray-500">
                Résultats pour la période sélectionnée.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-sm text-blue-700">
                Taux de présence :{" "}
                <strong>
                  {formatPourcentage(
                    data.professeurs
                      .tauxPresence
                  )}
                </strong>
              </span>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Présents
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {data.professeurs.presents}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-5">
              <p className="text-sm text-red-700">
                Absents
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {data.professeurs.absents}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-5">
              <p className="text-sm text-yellow-700">
                Retards
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-700">
                {data.professeurs.retards}
              </p>
            </div>

          </div>
        </div>

        {/* PRÉSENCE ÉLÈVES */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-center">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Présence des élèves
              </h2>

              <p className="text-sm text-gray-500">
                Synthèse des appels effectués.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-2">
              <span className="text-sm text-blue-700">
                Taux de présence :{" "}
                <strong>
                  {formatPourcentage(
                    data.eleves.tauxPresence
                  )}
                </strong>
              </span>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Présents
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {data.eleves.presents}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-5">
              <p className="text-sm text-red-700">
                Absents
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {data.eleves.absents}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-5">
              <p className="text-sm text-yellow-700">
                Retards
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-700">
                {data.eleves.retards}
              </p>
            </div>

          </div>
        </div>

        {/* RÉCLAMATIONS */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Réclamations
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Total
              </p>

              <p className="mt-2 text-3xl font-bold">
                {data.reclamations.total}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 p-5">
              <p className="text-sm text-yellow-700">
                En attente
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-700">
                {data.reclamations.attente}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Acceptées
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {data.reclamations.acceptees}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-5">
              <p className="text-sm text-red-700">
                Refusées
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {data.reclamations.refusees}
              </p>
            </div>

          </div>
        </div>

        {/* STATISTIQUES PAR CLASSE */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">

          <div className="border-b px-5 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Présence par classe
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Comparaison des résultats entre les classes.
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Classe
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Élèves
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Présents
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Absents
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Retards
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Taux
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">

                {data.classes.map((classe) => (
                  <tr
                    key={classe.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4">

                      <div className="font-medium text-gray-900">
                        {classe.nom}
                      </div>

                      {classe.niveau && (
                        <div className="text-xs text-gray-500">
                          {classe.niveau}
                        </div>
                      )}

                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {classe.nombreEleves}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-green-600">
                      {classe.presents}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-red-600">
                      {classe.absents}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-yellow-600">
                      {classe.retards}
                    </td>

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">

                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${Math.min(
                                classe.tauxPresence,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        <span className="text-sm font-semibold text-gray-700">
                          {formatPourcentage(
                            classe.tauxPresence
                          )}
                        </span>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {data.classes.length === 0 && (
            <div className="p-10 text-center text-sm text-gray-500">
              Aucune classe active.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}