import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Aside from '@pages/layout/Aside.tsx';
import Header from '@pages/layout/Header.tsx';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Aside role="dashboard" />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header role="dashboard" />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Manufacturer</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  Create and Manage Manufacturer Products and Inventory.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/manufacturer')}>
                  Create New Products
                </Button>
              </CardFooter>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Logistic</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  Manage and Track Logistic Orders and Shipments.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/logistic')}>
                  Manage Shipment
                </Button>
              </CardFooter>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Retailer</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  Order Products from Manufacturer and Manage Retailer Products.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/retailer')}>
                  Manage Products
                </Button>
              </CardFooter>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Consumer</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  Purchase Products from Retailer and Track Ownership.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate('/consumer')}>Purchase</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
