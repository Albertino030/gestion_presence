"use client";

import { useEffect, useState } from "react";

type Professeur = {
  id: number;
  telephone?: string | null;
  matieres?: string | null;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
};

type Presence = {
  id: number;
  professeurId: number;
  datePresence: string;
  heureArrivee?: string | null;
  heureDepart?: string | null;
  statut: "PRESENT" | "ABSENT" | "RETARD";
  methodeDetection: string;
  commentaire?: string | null;
  professeur: Professeur;
};

type Formulaire = {
  id?: number;
  professeurId: string;
  datePresence: string;
  heureArrivee: string;
  heureDepart: string;
  statut: "PRESENT" | "ABSENT" | "RETARD";
  methodeDetection: string;
  commentaire: string;
};

const formulaireInitial: Formulaire = {
  professeurId: "",
  datePresence: new Date().toISOString().split("T")[0],
  heureArrivee: "",
  heureDepart: "",
  statut: "PRESENT",
  methodeDetection: "MANUELLE",
  commentaire: "",
};

export default function PresencesProfesseursPage() {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);

  const [formulaire, setFormulaire] =
    useState<Formulaire>(formulaireInitial);

  const [recherche, setRecherche] = useState("");
  const [filtreDate, setFiltreDate] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const [modeEdition, setModeEdition] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerProfesseurs();
    chargerPresences();
  }, []);

  useEffect(() => {
    chargerPresences();
  }, [filtreDate, filtreStatut]);

  async function chargerProfesseurs() {
    try {
      const response = await fetch("/api/professeurs");

      const data = await response.json();

      if (data.success) {
        setProfesseurs(data.professeurs || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function chargerPresences() {
    try {
      setChargement(true);

      const params = new URLSearchParams();

      if (filtreDate) {
        params.set("date", filtreDate);
      }

      if (filtreStatut) {
        params.set("statut", filtreStatut);
      }

      const response = await fetch(
        `/api/presences-professeurs?${params.toString()}`
      );

      const data = await response.json();

      if (data.success) {
        setPresences(data.presences || []);
      } else {
        setErreur(data.message || "Erreur.");
      }
    } catch (error) {
      console.error(error);
      setErreur("Impossible de charger les présences.");
    } finally {
      setChargement(false);
    }
  }

  function modifierChamp(
    champ: keyof Formulaire,
    valeur: string
  ) {
    setFormulaire((ancien) => ({
      ...ancien,
      [champ]: valeur,
    }));
  }

  function nouvellePresence() {
    setModeEdition(false);
    setErreur("");
    setMessage("");

    setFormulaire({
      ...formulaireInitial,
      datePresence: new Date().toISOString().split("T")[0],
    });
  }

  function modifierPresence(presence: Presence) {
    setModeEdition(true);

    setMessage("");
    setErreur("");

    setFormulaire({
      id: presence.id,
      professeurId: String(presence.professeurId),
      datePresence: presence.datePresence.substring(0, 10),
      heureArrivee: presence.heureArrivee
        ? new Date(presence.heureArrivee)
            .toISOString()
            .substring(11, 16)
        : "",
      heureDepart: presence.heureDepart
        ? new Date(presence.heureDepart)
            .toISOString()
            .substring(11, 16)
        : "",
      statut: presence.statut,
      methodeDetection: presence.methodeDetection,
      commentaire: presence.commentaire || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function enregistrerPresence(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setEnregistrement(true);
    setErreur("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/presences-professeurs",
        {
          method: modeEdition ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulaire),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErreur(data.message || "Une erreur est survenue.");
        return;
      }

      setMessage(
        modeEdition
          ? "Présence modifiée avec succès."
          : "Présence enregistrée avec succès."
      );

      setFormulaire(formulaireInitial);
      setModeEdition(false);

      await chargerPresences();
    } catch (error) {
      console.error(error);
      setErreur("Erreur de connexion avec le serveur.");
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimerPresence(id: number) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette présence ?"
    );

    if (!confirmation) {
      return;
    }

    try {
      const response = await fetch(
        `/api/presences-professeurs?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErreur(data.message || "Erreur de suppression.");
        return;
      }

      setMessage("Présence supprimée avec succès.");

      await chargerPresences();
    } catch (error) {
      console.error(error);
      setErreur("Erreur lors de la suppression.");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  function formatHeure(date?: string | null) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const presencesFiltrees = presences.filter((presence) => {
    const nomComplet =
      `${presence.professeur.user.prenom} ${presence.professeur.user.nom}`.toLowerCase();

    const email =
      presence.professeur.user.email.toLowerCase();

    const texte = recherche.toLowerCase();

    return (
      nomComplet.includes(texte) ||
      email.includes(texte)
    );
  });

  const total = presencesFiltrees.length;

  const presents = presencesFiltrees.filter(
    (p) => p.statut === "PRESENT"
  ).length;

  const retards = presencesFiltrees.filter(
    (p) => p.statut === "RETARD"
  ).length;

  const absents = presencesFiltrees.filter(
    (p) => p.statut === "ABSENT"
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Présence des professeurs
            </h1>

            <p className="mt-1 text-gray-500">
              Gestion quotidienne des présences et horaires des professeurs
            </p>
          </div>

          <button
            onClick={nouvellePresence}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Nouvelle présence
          </button>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {erreur && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {erreur}
          </div>
        )}

        {/* FORMULAIRE */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              {modeEdition
                ? "Modifier une présence"
                : "Enregistrer une présence"}
            </h2>
          </div>

          <form
            onSubmit={enregistrerPresence}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* PROFESSEUR */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Professeur
              </label>

              <select
                value={formulaire.professeurId}
                onChange={(e) =>
                  modifierChamp(
                    "professeurId",
                    e.target.value
                  )
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Sélectionner un professeur
                </option>

                {professeurs.map((professeur) => (
                  <option
                    key={professeur.id}
                    value={professeur.id}
                  >
                    {professeur.user.prenom}{" "}
                    {professeur.user.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* DATE */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Date
              </label>

              <input
                type="date"
                value={formulaire.datePresence}
                onChange={(e) =>
                  modifierChamp(
                    "datePresence",
                    e.target.value
                  )
                }
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* STATUT */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Statut
              </label>

              <select
                value={formulaire.statut}
                onChange={(e) =>
                  modifierChamp(
                    "statut",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="PRESENT">
                  Présent
                </option>

                <option value="RETARD">
                  Retard
                </option>

                <option value="ABSENT">
                  Absent
                </option>
              </select>
            </div>

            {/* HEURE ARRIVEE */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Heure d'arrivée
              </label>

              <input
                type="time"
                value={formulaire.heureArrivee}
                onChange={(e) =>
                  modifierChamp(
                    "heureArrivee",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* HEURE DEPART */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Heure de départ
              </label>

              <input
                type="time"
                value={formulaire.heureDepart}
                onChange={(e) =>
                  modifierChamp(
                    "heureDepart",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* METHODE */}
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Méthode de détection
              </label>

              <select
                value={formulaire.methodeDetection}
                onChange={(e) =>
                  modifierChamp(
                    "methodeDetection",
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="MANUELLE">
                  Manuelle
                </option>

                <option value="WIFI">
                  Wi-Fi
                </option>

                <option value="AUTOMATIQUE">
                  Automatique
                </option>
              </select>
            </div>

            {/* COMMENTAIRE */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block font-medium text-gray-700">
                Commentaire
              </label>

              <textarea
                value={formulaire.commentaire}
                onChange={(e) =>
                  modifierChamp(
                    "commentaire",
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Commentaire éventuel..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* BOUTONS */}
            <div className="flex gap-3 md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={enregistrement}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {enregistrement
                  ? "Enregistrement..."
                  : modeEdition
                  ? "Modifier"
                  : "Enregistrer"}
              </button>

              {modeEdition && (
                <button
                  type="button"
                  onClick={nouvellePresence}
                  className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* STATISTIQUES */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-800">
              {total}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Présents
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {presents}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Retards
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-500">
              {retards}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Absents
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {absents}
            </p>
          </div>
        </div>

        {/* FILTRES */}
        <div className="mb-5 rounded-xl bg-white p-5 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rechercher
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(e) =>
                  setRecherche(e.target.value)
                }
                placeholder="Nom, prénom ou email..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filtrer par date
              </label>

              <input
                type="date"
                value={filtreDate}
                onChange={(e) =>
                  setFiltreDate(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filtrer par statut
              </label>

              <select
                value={filtreStatut}
                onChange={(e) =>
                  setFiltreStatut(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Tous les statuts
                </option>

                <option value="PRESENT">
                  Présent
                </option>

                <option value="RETARD">
                  Retard
                </option>

                <option value="ABSENT">
                  Absent
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLEAU */}
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="border-b p-5">
            <h2 className="text-xl font-bold text-gray-800">
              Liste des présences
            </h2>
          </div>

          {chargement ? (
            <div className="p-10 text-center text-gray-500">
              Chargement des présences...
            </div>
          ) : presencesFiltrees.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Aucune présence trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Professeur
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Arrivée
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Départ
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Statut
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                      Méthode
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {presencesFiltrees.map((presence) => (
                    <tr
                      key={presence.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">
                          {presence.professeur.user.prenom}{" "}
                          {presence.professeur.user.nom}
                        </div>

                        <div className="text-sm text-gray-500">
                          {presence.professeur.user.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatDate(
                          presence.datePresence
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatHeure(
                          presence.heureArrivee
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {formatHeure(
                          presence.heureDepart
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {presence.statut === "PRESENT" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                            Présent
                          </span>
                        )}

                        {presence.statut === "RETARD" && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                            Retard
                          </span>
                        )}

                        {presence.statut === "ABSENT" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                            Absent
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {presence.methodeDetection}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              modifierPresence(
                                presence
                              )
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Modifier
                          </button>

                          <button
                            onClick={() =>
                              supprimerPresence(
                                presence.id
                              )
                            }
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}