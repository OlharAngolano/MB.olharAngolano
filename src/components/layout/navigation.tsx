"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  User, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavigationProps {
  user?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
    isAdmin?: boolean;
    isVerified?: boolean;
    verificationType?: string;
    badges?: any[];
  };
}

export default function Navigation({ user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navigationItems = [
    { 
      label: "Feed", 
      href: "/", 
      icon: Home,
      show: true
    },
    { 
      label: "Meu Perfil", 
      href: "/profile", 
      icon: User,
      show: !!user
    },
    { 
      label: "Chat Direto", 
      href: "/chat", 
      icon: MessageSquare,
      show: !!user
    },
    { 
      label: "Cursos", 
      href: "/courses", 
      icon: BookOpen,
      show: !!user
    },
    { 
      label: "Biblioteca de Recursos", 
      href: "/resources", 
      icon: BookOpen,
      show: !!user
    },
    { 
      label: "Calendário de Eventos", 
      href: "/calendar", 
      icon: Calendar,
      show: !!user
    },
    { 
      label: "Configurações", 
      href: "/settings", 
      icon: Settings,
      show: !!user
    },
    { 
      label: "Painel Admin", 
      href: "/admin", 
      icon: Settings,
      show: !!user && user.isAdmin
    },
  ];

  const filteredItems = navigationItems.filter(item => item.show);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center p-6 border-b border-border">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/olhar-angolano.png" 
                alt="Olhar Angolano" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            {user ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {user.isVerified && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500 text-black">
                          ✓ Verificado
                        </Badge>
                      )}
                      {user.isAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Actions */}
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Painel Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}