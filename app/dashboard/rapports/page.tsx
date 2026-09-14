"use client";

import { useEffect, useState } from "react";

type RapportType = "eleves" | "professeurs";

type Classe = {
  id: number;
  nom: string;
};

type Matiere = {
  id: number;
  nom: string;
};

type PresenceEleve = {
  id: number;
  datePresence: string;
  heureAppel: string | null;
  statut: string;
  commentaire: string | null;

  eleve: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    classe: {
      id: number;
      nom: string;
    };
  };

  cours: {
    id: number;
    heureDebut: string;
    heureFin: string;
    salle: string | null;

    matiere: {
      id: number;
      nom: string;
    };

    professeur: {
      user: {
        nom: string;
        prenom: string;
      };
    };
  };
};

type PresenceProfesseur = {
  id: number;
  datePresence: string;
  heureArrivee: string | null;
  heureDepart: string | null;
  statut: string;
  methodeDetection: string;
  commentaire: string | null;

  professeur: {
    user: {
      nom: string;
      prenom: string;
      email: string;
    };
  };
};

export default function RapportsPage() {
  const aujourdHui =
    new Date().toISOString().split("T")[0];

  const [type, setType] =
    useState<RapportType>("eleves");

  const [dateDebut, setDateDebut] =
    useState(aujourdHui);

  const [dateFin, setDateFin] =
    useState(aujourdHui);

  const [classeId, setClasseId] =
    useState("");

  const [matiereId, setMatiereId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [classes, setClasses] =
    useState<Classe[]>([]);

  const [matieres, setMatieres] =
    useState<Matiere[]>([]);

  const [eleves, setEleves] =
    useState<PresenceEleve[]>([]);

  const [professeurs, setProfesseurs] =
    useState<PresenceProfesseur[]>([]);

  const [loading, setLoading] =
    useState(false);

  // ======================================================
  // CHARGER CLASSES
  // ======================================================

  async function chargerClasses() {
    try {
      const response = await fetch(
        "/api/classes",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const result = await response.json();

      setClasses(
        result.data ||
          result.classes ||
          []
      );
    } catch (error) {
      console.error(error);
    }
  }

  // ======================================================
  // CHARGER MATIÈRES
  // ======================================================

  async function chargerMatieres() {
    try {
      const response = await fetch(
        "/api/matieres",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) return;

      const result = await response.json();

      setMatieres(
        result.data ||
          result.matieres ||
          []
      );
    } catch (error) {
      console.error(error);
    }
  }

  // ======================================================
  // CHARGER RAPPORT
  // ======================================================

  async function chargerRapport() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("type", type);
      params.set("dateDebut", dateDebut);
      params.set("dateFin", dateFin);

      if (classeId) {
        params.set("classeId", classeId);
      }

      if (matiereId) {
        params.set("matiereId", matiereId);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/rapports?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Erreur lors du chargement."
        );
      }

      if (type === "eleves") {
        setEleves(result.data || []);
        setProfesseurs([]);
      } else {
        setProfesseurs(result.data || []);
        setEleves([]);
      }
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
    chargerClasses();
    chargerMatieres();
    chargerRapport();
  }, []);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "fr-FR"
    );
  }

  function formatHeure(date: string | null) {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // ======================================================
  // STATUT
  // ======================================================

  function statutClass(statut: string) {
    if (statut === "PRESENT") {
      return "bg-green-100 text-green-700";
    }

    if (statut === "ABSENT") {
      return "bg-red-100 text-red-700";
    }

    if (statut === "RETARD") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  function statutLabel(statut: string) {
    if (statut === "PRESENT") return "Présent";
    if (statut === "ABSENT") return "Absent";
    if (statut === "RETARD") return "Retard";

    return statut;
  }

  // ======================================================
  // CHANGEMENT DE TYPE
  // ======================================================

  function changerType(
    nouveauType: RapportType
  ) {
    setType(nouveauType);

    if (nouveauType === "professeurs") {
      setClasseId("");
      setMatiereId("");
    }
  }

  // ======================================================
  // IMPRESSION
  // ======================================================

  function imprimer() {
    window.print();
  }

  // ======================================================
  // INTERFACE
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Rapports de présence
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Consultez et imprimez les historiques
              de présence.
            </p>
          </div>

          <button
            onClick={imprimer}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 print:hidden"
          >
            🖨️ Imprimer
          </button>

        </div>

        {/* TYPE */}

        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 print:hidden">

          <div className="grid grid-cols-2 gap-2">

            <button
              onClick={() =>
                changerType("eleves")
              }
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                type === "eleves"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              👨‍🎓 Présence élèves
            </button>

            <button
              onClick={() =>
                changerType("professeurs")
              }
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                type === "professeurs"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              👨‍🏫 Présence professeurs
            </button>

          </div>

        </div>

        {/* FILTRES */}

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 print:hidden">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* DATE DEBUT */}

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

            {/* DATE FIN */}

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

            {/* RECHERCHE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Recherche
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder={
                  type === "eleves"
                    ? "Nom, prénom, matricule..."
                    : "Nom, prénom, email..."
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* CLASSE */}

            {type === "eleves" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Classe
                </label>

                <select
                  value={classeId}
                  onChange={(e) =>
                    setClasseId(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Toutes les classes
                  </option>

                  {classes.map((classe) => (
                    <option
                      key={classe.id}
                      value={classe.id}
                    >
                      {classe.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* MATIÈRE */}

            {type === "eleves" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Matière
                </label>

                <select
                  value={matiereId}
                  onChange={(e) =>
                    setMatiereId(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Toutes les matières
                  </option>

                  {matieres.map((matiere) => (
                    <option
                      key={matiere.id}
                      value={matiere.id}
                    >
                      {matiere.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* BOUTON */}

            <div className="flex items-end">
              <button
                onClick={chargerRapport}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Chargement..."
                  : "🔎 Générer le rapport"}
              </button>
            </div>

          </div>
        </div>

        {/* TITRE RAPPORT */}

        <div className="mb-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">

          <h2 className="text-xl font-bold text-gray-900">
            Rapport de présence
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Du {formatDate(`${dateDebut}T00:00:00`)}
            {" "}au{" "}
            {formatDate(`${dateFin}T00:00:00`)}
          </p>

        </div>

        {/* ==================================================
            TABLE ÉLÈVES
        ================================================== */}

        {type === "eleves" && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">

            {loading ? (
              <div className="p-12 text-center">
                Chargement...
              </div>
            ) : eleves.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Aucune présence trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Élève
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Classe
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Matière
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Professeur
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Appel
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Statut
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">

                    {eleves.map((presence) => (
                      <tr
                        key={presence.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-4 py-4">

                          <div className="font-medium text-gray-900">
                            {presence.eleve.prenom}{" "}
                            {presence.eleve.nom}
                          </div>

                          <div className="text-xs text-gray-500">
                            {presence.eleve.matricule}
                          </div>

                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {presence.eleve.classe.nom}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatDate(
                            presence.datePresence
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {presence.cours.matiere.nom}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {
                            presence.cours
                              .professeur.user
                              .prenom
                          }{" "}
                          {
                            presence.cours
                              .professeur.user.nom
                          }
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {formatHeure(
                            presence.heureAppel
                          )}
                        </td>

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statutClass(
                              presence.statut
                            )}`}
                          >
                            {statutLabel(
                              presence.statut
                            )}
                          </span>

                        </td>

                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* ==================================================
            TABLE PROFESSEURS
        ================================================== */}

        {type === "professeurs" && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">

            {loading ? (
              <div className="p-12 text-center">
                Chargement...
              </div>
            ) : professeurs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Aucune présence trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Professeur
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Arrivée
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Départ
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Méthode
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                        Statut
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">

                    {professeurs.map(
                      (presence) => (
                        <tr
                          key={presence.id}
                          className="hover:bg-gray-50"
                        >

                          <td className="px-4 py-4">

                            <div className="font-medium text-gray-900">
                              {
                                presence
                                  .professeur.user
                                  .prenom
                              }{" "}
                              {
                                presence
                                  .professeur.user
                                  .nom
                              }
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                presence
                                  .professeur.user
                                  .email
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700">
                            {formatDate(
                              presence.datePresence
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700">
                            {formatHeure(
                              presence.heureArrivee
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700">
                            {formatHeure(
                              presence.heureDepart
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-700">
                            {
                              presence.methodeDetection
                            }
                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statutClass(
                                presence.statut
                              )}`}
                            >
                              {statutLabel(
                                presence.statut
                              )}
                            </span>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>

      {/* STYLE IMPRESSION */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            font-size: 11px;
          }

          th,
          td {
            padding: 6px !important;
          }
        }
      `}</style>

    </div>
  );
}