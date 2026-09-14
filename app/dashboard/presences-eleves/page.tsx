"use client";

import { useEffect, useMemo, useState } from "react";

type Eleve = {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  actif: boolean;
  classe: {
    id: number;
    nom: string;
    niveau?: string | null;
  };
};

type Cours = {
  id: number;

  jour: string;
  heureDebut: string;
  heureFin: string;

  salle?: string | null;

  classe: {
    id: number;
    nom: string;
    niveau?: string | null;
  };

  matiere: {
    id: number;
    nom: string;
    code?: string | null;
  };

  professeur: {
    id: number;

    user: {
      nom: string;
      prenom: string;
    };
  };
};

type Presence = {
  id: number;
  eleveId: number;
  coursId: number;
  datePresence: string;
  heureAppel?: string | null;

  statut: "PRESENT" | "ABSENT" | "RETARD";

  commentaire?: string | null;
};

type LigneAppel = {
  eleveId: number;

  statut: "PRESENT" | "ABSENT" | "RETARD";

  commentaire: string;
};

export default function PresencesElevesPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [presences, setPresences] = useState<Presence[]>(
    []
  );

  const [classeId, setClasseId] = useState("");
  const [coursId, setCoursId] = useState("");

  const [datePresence, setDatePresence] =
    useState(
      new Date().toISOString().split("T")[0]
    );

  const [appel, setAppel] = useState<
    Record<number, LigneAppel>
  >({});

  const [recherche, setRecherche] = useState("");

  const [chargement, setChargement] =
    useState(true);

  const [enregistrement, setEnregistrement] =
    useState(false);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // ====================================================
  // CHARGEMENT INITIAL
  // ====================================================

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    try {
      setChargement(true);
      setErreur("");

      const [elevesResponse, coursResponse] =
        await Promise.all([
          fetch("/api/eleves"),
          fetch("/api/cours"),
        ]);

      const elevesData =
        await elevesResponse.json();

      const coursData =
        await coursResponse.json();

      if (elevesData.success) {
        setEleves(elevesData.eleves || []);
      }

      if (coursData.success) {
        setCours(coursData.cours || []);
      }

      if (!elevesData.success) {
        setErreur(
          elevesData.message ||
            "Impossible de charger les élèves."
        );
      }

      if (!coursData.success) {
        setErreur(
          coursData.message ||
            "Impossible de charger les cours."
        );
      }
    } catch (error) {
      console.error(error);

      setErreur(
        "Impossible de charger les données."
      );
    } finally {
      setChargement(false);
    }
  }

  // ====================================================
  // COURS FILTRÉS PAR CLASSE
  // ====================================================

  const coursFiltres = useMemo(() => {
    if (!classeId) {
      return cours;
    }

    return cours.filter(
      (item) =>
        item.classe.id === Number(classeId)
    );
  }, [cours, classeId]);

  // ====================================================
  // CLASSES UNIQUES
  // ====================================================

  const classes = useMemo(() => {
    const map = new Map();

    eleves.forEach((eleve) => {
      if (!map.has(eleve.classe.id)) {
        map.set(
          eleve.classe.id,
          eleve.classe
        );
      }
    });

    return Array.from(map.values());
  }, [eleves]);

  // ====================================================
  // COURS SÉLECTIONNÉ
  // ====================================================

  const coursSelectionne = cours.find(
    (item) =>
      item.id === Number(coursId)
  );

  // ====================================================
  // ÉLÈVES DE LA CLASSE DU COURS
  // ====================================================

  const elevesDuCours = useMemo(() => {
    if (!coursSelectionne) {
      return [];
    }

    return eleves.filter(
      (eleve) =>
        eleve.classe.id ===
        coursSelectionne.classe.id &&
        eleve.actif
    );
  }, [eleves, coursSelectionne]);

  // ====================================================
  // FILTRE RECHERCHE
  // ====================================================

  const elevesFiltres = elevesDuCours.filter(
    (eleve) => {
      const texte =
        `${eleve.nom} ${eleve.prenom} ${eleve.matricule}`
          .toLowerCase();

      return texte.includes(
        recherche.toLowerCase()
      );
    }
  );

  // ====================================================
  // CHARGER LES PRÉSENCES EXISTANTES
  // ====================================================

  useEffect(() => {
    if (!coursId || !datePresence) {
      return;
    }

    chargerPresences();
  }, [coursId, datePresence]);

  async function chargerPresences() {
    try {
      const params = new URLSearchParams();

      params.set("coursId", coursId);
      params.set("date", datePresence);

      const response = await fetch(
        `/api/presences-eleves?${params.toString()}`
      );

      const data = await response.json();

      if (!data.success) {
        return;
      }

      const nouvellesLignes: Record<
        number,
        LigneAppel
      > = {};

      (data.presences || []).forEach(
        (presence: Presence) => {
          nouvellesLignes[presence.eleveId] = {
            eleveId: presence.eleveId,

            statut: presence.statut,

            commentaire:
              presence.commentaire || "",
          };
        }
      );

      setPresences(data.presences || []);

      setAppel(nouvellesLignes);
    } catch (error) {
      console.error(error);
    }
  }

  // ====================================================
  // CHANGER LE STATUT D'UN ÉLÈVE
  // ====================================================

  function changerStatut(
    eleveId: number,
    statut:
      | "PRESENT"
      | "ABSENT"
      | "RETARD"
  ) {
    setAppel((ancien) => ({
      ...ancien,

      [eleveId]: {
        eleveId,

        statut,

        commentaire:
          ancien[eleveId]?.commentaire ||
          "",
      },
    }));
  }

  // ====================================================
  // CHANGER COMMENTAIRE
  // ====================================================

  function changerCommentaire(
    eleveId: number,
    commentaire: string
  ) {
    setAppel((ancien) => ({
      ...ancien,

      [eleveId]: {
        eleveId,

        statut:
          ancien[eleveId]?.statut ||
          "PRESENT",

        commentaire,
      },
    }));
  }

  // ====================================================
  // MARQUER TOUT LE MONDE PRÉSENT
  // ====================================================

  function toutPresent() {
    const nouveauAppel: Record<
      number,
      LigneAppel
    > = {};

    elevesDuCours.forEach((eleve) => {
      nouveauAppel[eleve.id] = {
        eleveId: eleve.id,

        statut: "PRESENT",

        commentaire: "",
      };
    });

    setAppel(nouveauAppel);
  }

  // ====================================================
  // MARQUER TOUT LE MONDE ABSENT
  // ====================================================

  function toutAbsent() {
    const nouveauAppel: Record<
      number,
      LigneAppel
    > = {};

    elevesDuCours.forEach((eleve) => {
      nouveauAppel[eleve.id] = {
        eleveId: eleve.id,

        statut: "ABSENT",

        commentaire: "",
      };
    });

    setAppel(nouveauAppel);
  }

  // ====================================================
  // ENREGISTRER L'APPEL
  // ====================================================

  async function enregistrerAppel() {
    if (!coursId) {
      setErreur(
        "Veuillez sélectionner un cours."
      );

      return;
    }

    if (elevesDuCours.length === 0) {
      setErreur(
        "Aucun élève dans cette classe."
      );

      return;
    }

    setEnregistrement(true);
    setErreur("");
    setMessage("");

    try {
      const heure = new Date()
        .toTimeString()
        .substring(0, 5);

      const liste = elevesDuCours.map(
        (eleve) => {
          const ligne = appel[eleve.id];

          return {
            eleveId: eleve.id,

            coursId: Number(coursId),

            datePresence,

            heureAppel: heure,

            statut:
              ligne?.statut ||
              "PRESENT",

            commentaire:
              ligne?.commentaire ||
              "",
          };
        }
      );

      const response = await fetch(
        "/api/presences-eleves",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            presences: liste,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErreur(
          data.message ||
            "Erreur lors de l'enregistrement."
        );

        return;
      }

      setMessage(
        `Appel enregistré avec succès : ${data.nombre} élève(s).`
      );

      await chargerPresences();
    } catch (error) {
      console.error(error);

      setErreur(
        "Erreur de connexion avec le serveur."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // ====================================================
  // STATISTIQUES
  // ====================================================

  const nombrePresent = elevesDuCours.filter(
    (eleve) =>
      (appel[eleve.id]?.statut ||
        "PRESENT") === "PRESENT"
  ).length;

  const nombreAbsent = elevesDuCours.filter(
    (eleve) =>
      appel[eleve.id]?.statut ===
      "ABSENT"
  ).length;

  const nombreRetard = elevesDuCours.filter(
    (eleve) =>
      appel[eleve.id]?.statut ===
      "RETARD"
  ).length;

  // ====================================================
  // AFFICHAGE
  // ====================================================

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-8 shadow">
          <p className="text-gray-600">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Présence des élèves
          </h1>

          <p className="mt-1 text-gray-500">
            Effectuer l'appel et enregistrer
            les absences des élèves
          </p>
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

        {/* SÉLECTION */}

        <div className="mb-6 rounded-xl bg-white p-6 shadow">

          <h2 className="mb-5 text-xl font-bold text-gray-800">
            Sélection du cours
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            {/* CLASSE */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Classe
              </label>

              <select
                value={classeId}
                onChange={(e) => {
                  setClasseId(
                    e.target.value
                  );

                  setCoursId("");

                  setAppel({});
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
                    {classe.niveau
                      ? ` - ${classe.niveau}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* COURS */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Cours
              </label>

              <select
                value={coursId}
                onChange={(e) => {
                  setCoursId(
                    e.target.value
                  );

                  setAppel({});
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Sélectionner un cours
                </option>

                {coursFiltres.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.matiere.nom} —{" "}
                    {item.classe.nom} —{" "}
                    {item.heureDebut}
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
                value={datePresence}
                onChange={(e) =>
                  setDatePresence(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* INFORMATIONS COURS */}

          {coursSelectionne && (
            <div className="mt-5 rounded-lg bg-blue-50 p-5">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                <div>
                  <p className="text-sm text-gray-500">
                    Matière
                  </p>

                  <p className="font-bold text-blue-700">
                    {coursSelectionne.matiere.nom}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Classe
                  </p>

                  <p className="font-bold text-gray-800">
                    {coursSelectionne.classe.nom}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Professeur
                  </p>

                  <p className="font-bold text-gray-800">
                    {
                      coursSelectionne
                        .professeur.user
                        .prenom
                    }{" "}
                    {
                      coursSelectionne
                        .professeur.user
                        .nom
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Horaire
                  </p>

                  <p className="font-bold text-gray-800">
                    {coursSelectionne.heureDebut}
                    {" - "}
                    {coursSelectionne.heureFin}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* APPEL */}

        {coursSelectionne && (
          <>
            {/* STATISTIQUES */}

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

              <div className="rounded-xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">
                  Élèves
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {elevesDuCours.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">
                  Présents
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {nombrePresent}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">
                  Retards
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-500">
                  {nombreRetard}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">
                  Absents
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {nombreAbsent}
                </p>
              </div>
            </div>

            {/* BARRE ACTION */}

            <div className="mb-5 rounded-xl bg-white p-5 shadow">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <input
                  type="text"
                  value={recherche}
                  onChange={(e) =>
                    setRecherche(
                      e.target.value
                    )
                  }
                  placeholder="Rechercher un élève..."
                  className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 md:w-80"
                />

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={toutPresent}
                    className="rounded-lg bg-green-100 px-4 py-2 font-medium text-green-700 hover:bg-green-200"
                  >
                    Tous présents
                  </button>

                  <button
                    onClick={toutAbsent}
                    className="rounded-lg bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200"
                  >
                    Tous absents
                  </button>

                  <button
                    onClick={enregistrerAppel}
                    disabled={enregistrement}
                    className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enregistrement
                      ? "Enregistrement..."
                      : "Enregistrer l'appel"}
                  </button>
                </div>
              </div>
            </div>

            {/* TABLEAU ÉLÈVES */}

            <div className="overflow-hidden rounded-xl bg-white shadow">

              <div className="border-b p-5">
                <h2 className="text-xl font-bold text-gray-800">
                  Liste des élèves
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez le statut de
                  chaque élève.
                </p>
              </div>

              {elevesFiltres.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  Aucun élève trouvé.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-gray-50">

                      <tr>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                          #
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                          Matricule
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                          Élève
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-semibold text-gray-600">
                          Présent
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-semibold text-gray-600">
                          Retard
                        </th>

                        <th className="px-5 py-4 text-center text-sm font-semibold text-gray-600">
                          Absent
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                          Commentaire
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {elevesFiltres.map(
                        (eleve, index) => {

                          const statut =
                            appel[eleve.id]
                              ?.statut ||
                            "PRESENT";

                          return (
                            <tr
                              key={eleve.id}
                              className="hover:bg-gray-50"
                            >

                              <td className="px-5 py-4 text-gray-500">
                                {index + 1}
                              </td>

                              <td className="px-5 py-4 font-medium text-gray-700">
                                {eleve.matricule}
                              </td>

                              <td className="px-5 py-4">

                                <div className="font-semibold text-gray-800">
                                  {eleve.prenom}{" "}
                                  {eleve.nom}
                                </div>

                              </td>

                              {/* PRÉSENT */}

                              <td className="px-5 py-4 text-center">

                                <button
                                  onClick={() =>
                                    changerStatut(
                                      eleve.id,
                                      "PRESENT"
                                    )
                                  }
                                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    statut ===
                                    "PRESENT"
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 text-gray-500 hover:bg-green-100"
                                  }`}
                                >
                                  Présent
                                </button>

                              </td>

                              {/* RETARD */}

                              <td className="px-5 py-4 text-center">

                                <button
                                  onClick={() =>
                                    changerStatut(
                                      eleve.id,
                                      "RETARD"
                                    )
                                  }
                                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    statut ===
                                    "RETARD"
                                      ? "bg-orange-500 text-white"
                                      : "bg-gray-100 text-gray-500 hover:bg-orange-100"
                                  }`}
                                >
                                  Retard
                                </button>

                              </td>

                              {/* ABSENT */}

                              <td className="px-5 py-4 text-center">

                                <button
                                  onClick={() =>
                                    changerStatut(
                                      eleve.id,
                                      "ABSENT"
                                    )
                                  }
                                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    statut ===
                                    "ABSENT"
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-100 text-gray-500 hover:bg-red-100"
                                  }`}
                                >
                                  Absent
                                </button>

                              </td>

                              {/* COMMENTAIRE */}

                              <td className="px-5 py-4">

                                <input
                                  type="text"
                                  value={
                                    appel[
                                      eleve.id
                                    ]
                                      ?.commentaire ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    changerCommentaire(
                                      eleve.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Optionnel..."
                                  className="w-full min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>
                  </table>

                </div>
              )}
            </div>
          </>
        )}

        {/* AUCUN COURS */}

        {!coursSelectionne && (
          <div className="rounded-xl bg-white p-12 text-center shadow">

            <div className="mb-4 text-5xl">
              📋
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Aucun cours sélectionné
            </h2>

            <p className="mt-2 text-gray-500">
              Sélectionnez une classe, un cours
              et une date pour commencer
              l'appel.
            </p>

          </div>
        )}

      </div>
    </div>
  );
}