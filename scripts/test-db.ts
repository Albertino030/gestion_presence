import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany();

  console.log("=================================");
  console.log("TEST PRISMA + SQLITE");
  console.log("=================================");
  console.log("Connexion réussie !");
  console.log("Nombre d'utilisateurs :", users.length);
  console.log("Utilisateurs :", users);
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("ERREUR :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });