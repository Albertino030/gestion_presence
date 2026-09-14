-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROFESSEUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Professeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Professeur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "niveau" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Eleve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" DATETIME,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "classeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Eleve_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Matiere" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfesseurMatiere" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professeurId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfesseurMatiere_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfesseurMatiere_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cours" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professeurId" INTEGER NOT NULL,
    "classeId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cours_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cours_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cours_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PresenceProfesseur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professeurId" INTEGER NOT NULL,
    "datePresence" DATETIME NOT NULL,
    "heureArrivee" DATETIME,
    "heureDepart" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PRESENT',
    "methodeDetection" TEXT NOT NULL DEFAULT 'MANUEL',
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PresenceProfesseur_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PresenceEleve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eleveId" INTEGER NOT NULL,
    "coursId" INTEGER NOT NULL,
    "datePresence" DATETIME NOT NULL,
    "heureAppel" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PRESENT',
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PresenceEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PresenceEleve_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reclamation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "professeurId" INTEGER NOT NULL,
    "presenceProfesseurId" INTEGER NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "dateReclamation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateTraitement" DATETIME,
    "commentaireAdmin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reclamation_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "Professeur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reclamation_presenceProfesseurId_fkey" FOREIGN KEY ("presenceProfesseurId") REFERENCES "PresenceProfesseur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_nom_idx" ON "User"("nom");

-- CreateIndex
CREATE INDEX "User_prenom_idx" ON "User"("prenom");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Professeur_userId_key" ON "Professeur"("userId");

-- CreateIndex
CREATE INDEX "Professeur_actif_idx" ON "Professeur"("actif");

-- CreateIndex
CREATE INDEX "Classe_nom_idx" ON "Classe"("nom");

-- CreateIndex
CREATE INDEX "Classe_niveau_idx" ON "Classe"("niveau");

-- CreateIndex
CREATE INDEX "Classe_actif_idx" ON "Classe"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_matricule_key" ON "Eleve"("matricule");

-- CreateIndex
CREATE INDEX "Eleve_nom_idx" ON "Eleve"("nom");

-- CreateIndex
CREATE INDEX "Eleve_prenom_idx" ON "Eleve"("prenom");

-- CreateIndex
CREATE INDEX "Eleve_classeId_idx" ON "Eleve"("classeId");

-- CreateIndex
CREATE INDEX "Eleve_actif_idx" ON "Eleve"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "Matiere_code_key" ON "Matiere"("code");

-- CreateIndex
CREATE INDEX "Matiere_nom_idx" ON "Matiere"("nom");

-- CreateIndex
CREATE INDEX "Matiere_actif_idx" ON "Matiere"("actif");

-- CreateIndex
CREATE INDEX "ProfesseurMatiere_professeurId_idx" ON "ProfesseurMatiere"("professeurId");

-- CreateIndex
CREATE INDEX "ProfesseurMatiere_matiereId_idx" ON "ProfesseurMatiere"("matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfesseurMatiere_professeurId_matiereId_key" ON "ProfesseurMatiere"("professeurId", "matiereId");

-- CreateIndex
CREATE INDEX "Cours_professeurId_idx" ON "Cours"("professeurId");

-- CreateIndex
CREATE INDEX "Cours_classeId_idx" ON "Cours"("classeId");

-- CreateIndex
CREATE INDEX "Cours_matiereId_idx" ON "Cours"("matiereId");

-- CreateIndex
CREATE INDEX "Cours_jour_idx" ON "Cours"("jour");

-- CreateIndex
CREATE INDEX "Cours_actif_idx" ON "Cours"("actif");

-- CreateIndex
CREATE INDEX "PresenceProfesseur_datePresence_idx" ON "PresenceProfesseur"("datePresence");

-- CreateIndex
CREATE INDEX "PresenceProfesseur_statut_idx" ON "PresenceProfesseur"("statut");

-- CreateIndex
CREATE INDEX "PresenceProfesseur_methodeDetection_idx" ON "PresenceProfesseur"("methodeDetection");

-- CreateIndex
CREATE INDEX "PresenceProfesseur_professeurId_idx" ON "PresenceProfesseur"("professeurId");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceProfesseur_professeurId_datePresence_key" ON "PresenceProfesseur"("professeurId", "datePresence");

-- CreateIndex
CREATE INDEX "PresenceEleve_eleveId_idx" ON "PresenceEleve"("eleveId");

-- CreateIndex
CREATE INDEX "PresenceEleve_coursId_idx" ON "PresenceEleve"("coursId");

-- CreateIndex
CREATE INDEX "PresenceEleve_datePresence_idx" ON "PresenceEleve"("datePresence");

-- CreateIndex
CREATE INDEX "PresenceEleve_statut_idx" ON "PresenceEleve"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceEleve_eleveId_coursId_datePresence_key" ON "PresenceEleve"("eleveId", "coursId", "datePresence");

-- CreateIndex
CREATE INDEX "Reclamation_professeurId_idx" ON "Reclamation"("professeurId");

-- CreateIndex
CREATE INDEX "Reclamation_presenceProfesseurId_idx" ON "Reclamation"("presenceProfesseurId");

-- CreateIndex
CREATE INDEX "Reclamation_statut_idx" ON "Reclamation"("statut");

-- CreateIndex
CREATE INDEX "Reclamation_dateReclamation_idx" ON "Reclamation"("dateReclamation");
