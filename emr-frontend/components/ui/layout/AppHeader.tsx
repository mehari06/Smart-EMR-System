'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu, UserCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, getInitials, getDisplayName } from '@/store/useAuthStore';

interface AppHeaderProps {
  breadcrumbs: { label: string; href?: string }[];
  onMenuClick?: () => void;
}

export function AppHeader({ breadcrumbs, onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Hamburger — visible only on mobile/tablet */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-accent hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumb — flex-1 + min-w-0 so it never overflows */}
      <div className="flex-1 min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={crumb.label} className="flex items-center gap-2">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href} className="text-slate-500 hover:text-primary truncate">
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: user name + avatar */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
            {getDisplayName(user)}
          </p>
          <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
            {user?.role?.replace('_', ' ') ?? ''}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Open account menu"
            >
              <Avatar className="size-9 sm:size-10 cursor-pointer border border-primary/20 transition-opacity hover:opacity-90">
                <AvatarFallback className="bg-primary text-sm font-semibold text-white">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <UserCircle className="mr-2 size-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-danger focus:bg-danger/10 focus:text-danger"
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}