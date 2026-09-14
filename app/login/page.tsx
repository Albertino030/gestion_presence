"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "E-mail ou mot de passe incorrect."
        );
      }

      /*
       * Le rôle vient directement de la base de données.
       * L'utilisateur ne choisit jamais son rôle.
       */
      const role = data.utilisateur?.role;

      if (role === "ADMIN") {
        router.push("/dashboard");
      } else if (role === "PROFESSEUR") {
        router.push("/professeur");
      } else {
        throw new Error("Rôle utilisateur non reconnu.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la connexion."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
            LC
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Le Colino
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gestion de présence scolaire
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Connexion
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connectez-vous à votre espace.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Adresse e-mail
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Votre adresse e-mail"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Mot de passe
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Pied de page */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Le Colino — Gestion des présences
        </p>
      </div>
    </main>
  );
}
