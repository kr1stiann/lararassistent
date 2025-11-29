"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Logga in
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
            onClick={login}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
          >
            Logga in
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Har du inget konto?{" "}
            <Link href="/register" className="text-indigo-600 hover:underline">
              Registrera dig
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
