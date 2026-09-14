import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = "admin@lecolino.local";

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("Utilisateur introuvable :", email);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      role: "ADMIN",
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
    },
  });

  console.log("=================================");
  console.log("COMPTE ADMIN");
  console.log("=================================");
  console.log(updatedUser);
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