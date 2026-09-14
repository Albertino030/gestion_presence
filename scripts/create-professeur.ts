import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
const email = "[professeur@lecollino.local](mailto:professeur@lecollino.local)";
const password = "professeur123";

const existant = await prisma.user.findUnique({
where: {
email,
},
});

if (existant) {
console.log("");
console.log("Ce compte existe déjà.");
console.log("ID :", existant.id);
console.log("Rôle :", existant.role);

if (existant.role !== "PROFESSEUR") {
  await prisma.user.update({
    where: {
      id: existant.id,
    },
    data: {
      role: "PROFESSEUR",
    },
  });

  console.log("Le rôle a été changé en PROFESSEUR.");
}

const professeurExistant = await prisma.professeur.findUnique({
  where: {
    userId: existant.id,
  },
});

if (!professeurExistant) {
  await prisma.professeur.create({
    data: {
      userId: existant.id,
      telephone: null,
      actif: true,
    },
  });

  console.log("Profil professeur créé.");
} else {
  console.log("Le profil professeur existe déjà.");
}

return;

}

const hashedPassword = await bcrypt.hash(password, 12);

const professeur = await prisma.professeur.create({
data: {
telephone: null,
actif: true,

  user: {
    create: {
      nom: "Professeur",
      prenom: "Test",
      email,
      password: hashedPassword,
      role: "PROFESSEUR",
    },
  },
},

include: {
  user: true,
},

});

console.log("");
console.log("========================================");
console.log("       COMPTE PROFESSEUR CRÉÉ");
console.log("========================================");
console.log("ID       :", professeur.id);
console.log("Nom      :", professeur.user.nom);
console.log("Prénom   :", professeur.user.prenom);
console.log("Email    :", professeur.user.email);
console.log("Password :", password);
console.log("Rôle     :", professeur.user.role);
console.log("========================================");
console.log("");
}

main()
.catch((error) => {
console.error("");
console.error("Erreur :", error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});
