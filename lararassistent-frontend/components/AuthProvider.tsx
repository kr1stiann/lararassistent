"use client";

import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Offentliga routes (behöver ingen inloggning)
  const publicRoutes = ["/login", "/register"];

  useEffect(() => {
    async function checkSession() {
      // Om vi är på en publik sida → hoppa över auth-check
      if (publicRoutes.includes(pathname)) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    }

    checkSession();
  }, [pathname, router]);

  if (loading) return <p className="p-4">Laddar...</p>;

  return <>{children}</>;
}
