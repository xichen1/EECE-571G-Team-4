import { Sheet, SheetContent, SheetTrigger } from '@components/ui/sheet.tsx';
import { Button } from '@components/ui/button.tsx';
import {
  Factory,
  Home,
  Package2,
  PanelLeft,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@components/ui/breadcrumb.tsx';
import { Role } from '@lib/types/roles.ts';
import { ConnectKitButton } from 'connectkit';

interface HeaderProps {
  role: Role;
}

const Header = ({ role }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-1.5">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <Link
              to="/dashboard"
              className={
                role === 'dashboard'
                  ? 'flex items-center gap-4 px-2.5 text-foreground'
                  : 'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
              }
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/manufacturer"
              className={
                role === 'manufacturer'
                  ? 'flex items-center gap-4 px-2.5 text-foreground'
                  : 'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
              }
            >
              <Factory className="h-5 w-5" />
              Manufacturer
            </Link>
            <Link
              to="/logistic"
              className={
                role === 'logistic'
                  ? 'flex items-center gap-4 px-2.5 text-foreground'
                  : 'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
              }
            >
              <Truck className="h-5 w-5" />
              Logistic
            </Link>
            <Link
              to="/retailer"
              className={
                role === 'retailer'
                  ? 'flex items-center gap-4 px-2.5 text-foreground'
                  : 'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
              }
            >
              <Store className="h-5 w-5" />
              Retailer
            </Link>
            <Link
              to="/consumer"
              className={
                role === 'consumer'
                  ? 'flex items-center gap-4 px-2.5 text-foreground'
                  : 'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground'
              }
            >
              <ShoppingCart className="h-5 w-5" />
              Consumer
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex justify-between">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {role !== 'dashboard' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/${role}`}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <ConnectKitButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
