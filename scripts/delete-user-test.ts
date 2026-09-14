import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const userId = 2;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      professeur: true,
    },
  });

  if (!user) {
    console.log("Utilisateur introuvable.");
    return;
  }

  console.log("Utilisateur trouvé :");
  console.log({
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    professeurId: user.professeur?.id ?? null,
  });

  if (user.professeur) {
    console.log(
      "ATTENTION : cet utilisateur possède un professeur. Suppression annulée."
    );
    return;
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  console.log("");
  console.log("Utilisateur orphelin supprimé avec succès.");
}

main()
  .catch((error) => {
    console.error("ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });