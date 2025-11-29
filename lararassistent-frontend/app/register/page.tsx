"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Konto skapat! Kolla din e-post för att bekräfta.");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Skapa konto
        </h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">E-post</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Lösenord</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={register}
            disabled={loading}
            className={`w-full py-2 rounded-lg transition text-white ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Har du redan ett konto?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
