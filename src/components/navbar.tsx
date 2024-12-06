import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export function Navbar() {
  const { login, authenticated, logout, user } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayEmail = () => {
    if (user?.google?.email) return user.google.email;
    if (typeof user?.email === "string") return user.email;
    return "User";
  };

  const NavLinks = () => (
    <>
      <Link href="/">
        <Button variant="ghost">Schedule</Button>
      </Link>
      <Link href="/games">
        <Button variant="ghost">Games</Button>
      </Link>
    </>
  );

  const AuthButton = () => (
    <>
      {authenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              😊
              <span className="hidden sm:inline">{getDisplayEmail()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={login} size="sm">
          Login
        </Button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logos/logo.png"
              alt="Jelloverse Logo"
              width={32}
              height={32}
              className="mr-2"
            />
            {/* <span className="font-semibold text-lg">Jelloverse</span> */}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <NavLinks />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <NavLinks />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auth Button (shown on both mobile and desktop) */}
        <div>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
