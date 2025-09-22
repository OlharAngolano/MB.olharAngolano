"use client";

import { useEffect, useState } from "react";
import Navigation from "./navigation";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  requireAuth?: boolean;
}

export default function MainLayout({ 
  children, 
  showNavigation = true, 
  requireAuth = false 
}: MainLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && requireAuth && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, requireAuth, router]);

  // Don't render anything while checking auth status
  if (requireAuth && loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // If auth is required and user is not logged in, don't render
  if (requireAuth && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavigation && <Navigation user={user} />}
      <main className={`transition-all duration-200 ${showNavigation ? 'md:ml-64' : ''}`}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}