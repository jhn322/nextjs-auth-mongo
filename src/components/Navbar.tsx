'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { OnlineStatusIndicator } from '@/components/ui/online-status-indicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Settings,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { AUTH_PATHS, PROTECTED_PATHS } from '@/lib/constants/routes';

interface NavItem {
  href: string;
  label: string;
}

// Basic navigation links that all visitors can see
const publicNavItems: NavItem[] = [
  { href: '/page1', label: 'Page 1' },
  { href: '/page2', label: 'Page 2' },
  { href: '/page3', label: 'Page 3' },
  { href: '/page4', label: 'Page 4' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  // Get current session from NextAuth
  const { data: session, status } = useSession();

  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated';
  // Get user's role if authenticated
  const userRole = session?.user?.role;

  // Build up nav list with only public links
  const navItems = [...publicNavItems];

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string | null | undefined): string => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Helper function to determine if a nav item is active
  const isActiveLink = (href: string): boolean => {
    return pathname === href || (href !== '/' && pathname?.startsWith(href));
  };

  return (
    <>
      <div className="h-16" />
      <div className="relative">
        <nav className="bg-background/90 fixed top-0 right-0 left-0 z-50 w-full border-b backdrop-blur-sm transition-colors duration-500">
          <div className="flex h-16 items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-foreground flex items-center text-xl font-semibold"
              >
                <Image
                  src="/logo.svg"
                  alt={`logo`}
                  width={64}
                  height={64}
                  className="mr-2 h-18 w-18"
                  priority
                  fetchPriority="high"
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-foreground hover:bg-accent rounded-lg px-2 py-1 transition-colors ${
                      isActiveLink(item.href) && 'font-medium'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Buttons & User Dropdown */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
                    >
                      <User />
                      <span>
                        {capitalizeFirstLetter(
                          session?.user?.name || session?.user?.email
                        )}
                      </span>
                      <ChevronDown
                        className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                              {session?.user?.email?.charAt(0).toUpperCase() ||
                                'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm leading-none font-medium">
                              {capitalizeFirstLetter(session?.user?.name) ||
                                'Användare'}
                            </p>
                            <p className="text-foreground/90 text-xs leading-none">
                              {session?.user?.email}
                            </p>
                          </div>
                        </div>
                        <OnlineStatusIndicator className="ml-2 h-2.5 w-2.5" />
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <Link href={PROTECTED_PATHS.SETTINGS_BASE}>
                      <DropdownMenuItem className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Mina Sidor</span>
                      </DropdownMenuItem>
                    </Link>

                    <DropdownMenuItem disabled className="cursor-not-allowed">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="cursor-not-allowed">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>FAQ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : status === 'unauthenticated' ? (
                <Link href={AUTH_PATHS.LOGIN}>
                  <Button
                    variant="default"
                    className="bg-foreground text-background hover:bg-foreground/90 w-full"
                  >
                    Log in
                  </Button>
                </Link>
              ) : null}
            </div>

            {/* User Dropdown (if authenticated) */}
            <div className="flex items-center gap-2 md:hidden">
              {/* Mobile User Dropdown */}
              {isAuthenticated && (
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-foreground hover:bg-accent hover:text-accent-foreground relative h-10 w-10 p-1"
                      aria-label="User menu"
                    >
                      <div className="flex items-center gap-1">
                        <User className="h-5 w-5" />
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                            {session?.user?.email?.charAt(0).toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm leading-none font-medium">
                            {capitalizeFirstLetter(session?.user?.name) ||
                              'Användare'}
                          </p>
                          <p className="text-foreground/90 text-xs leading-none">
                            {session?.user?.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === 'USER' && (
                      <Link
                        href={PROTECTED_PATHS.SETTINGS_BASE}
                        onClick={() => setIsOpen(false)}
                      >
                        <DropdownMenuItem className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Mina Sidor</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem disabled className="cursor-not-allowed">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="cursor-not-allowed">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>FAQ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setIsOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logga ut</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-14 w-14 p-0 hover:bg-transparent md:hidden"
                onClick={handleToggleMenu}
                aria-expanded={isOpen}
                aria-label="Toggle menu"
              >
                <div className="relative flex h-6 w-6 items-center justify-center">
                  {/* Transform transition lines */}
                  <span
                    className={`bg-foreground absolute h-[2px] rounded-full transition-all duration-300 ease-in-out ${
                      isOpen
                        ? 'w-5 translate-y-0 rotate-45'
                        : 'w-5 -translate-y-1.5'
                    }`}
                  />
                  <span
                    className={`bg-foreground absolute h-[2px] rounded-full transition-all duration-300 ease-in-out ${
                      isOpen ? 'w-0 opacity-0' : 'w-5 opacity-100'
                    }`}
                  />
                  <span
                    className={`bg-foreground absolute h-[2px] rounded-full transition-all duration-300 ease-in-out ${
                      isOpen
                        ? 'w-5 translate-y-0 -rotate-45'
                        : 'w-5 translate-y-1.5'
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <div
          className={`bg-background fixed inset-0 z-40 transition-transform duration-500 ease-in-out md:hidden ${
            isOpen ? 'translate-y-16' : 'translate-y-[-100%]'
          }`}
        >
          <div className="flex h-[calc(100vh-4rem)] flex-col px-6 py-8 md:px-8">
            <div className="-mt-20 flex h-full flex-col items-center justify-center space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-3xl transition-colors ${
                    isActiveLink(item.href)
                      ? 'text-foreground font-medium'
                      : 'hover:bg-secondary text-foreground rounded-lg px-2 py-1'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-8 w-full max-w-[200px]">
                {status === 'unauthenticated' && (
                  <Link
                    href={AUTH_PATHS.LOGIN}
                    className="block w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant="default"
                      className="bg-foreground text-background hover:bg-foreground/90 text-md w-full transition-colors"
                    >
                      Log in
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
