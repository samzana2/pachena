"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
const supabase = createBrowserSupabaseClient();

const Header = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isEnabled } = useFeatureFlags();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand">
            <span className="font-logo text-xl font-bold text-brand-foreground">P</span>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/companies"
              className="text-sm font-medium text-black transition-colors hover:text-black/70"
            >
              Find Companies
            </Link>
            {isEnabled("employer_nav_links") && (
              <Link
                href="/employers"
                className="text-sm font-medium text-black transition-colors hover:text-black/70"
              >
                For Employers
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/claims"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            <Button asChild className="bg-brand text-brand-foreground hover:bg-transparent hover:text-brand border border-brand">
              <Link href="/review">Leave a Review</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
