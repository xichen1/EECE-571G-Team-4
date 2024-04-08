import { MoreHorizontal, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Aside from '@pages/layout/Aside.tsx';
import Header from '@pages/layout/Header.tsx';
import { useReadContract, useWriteContract } from 'wagmi';
import wagmiContractConfig from '@/abi.ts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu.tsx';
import { Button } from '@components/ui/button.tsx';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog.tsx';
import { Label } from '@components/ui/label.tsx';

const Logistic = () => {
  const { writeContract } = useWriteContract();

  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipID, setShipID] = useState<number>(0);
  const [shipQuantity, setShipQuantity] = useState<number>(0);

  const { data: products } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllManufacturerProducts',
    args: [],
  });

  const { data: deliveries } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllDeliveries',
    args: [],
  });

  const { data: retailerStock } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllRetailerProducts',
    args: [],
  });

  console.log('retailerStock', retailerStock);

  const handleShipQuantityChange = (e: any) => {
    setShipQuantity(e.target.value);
  };

  const handleShip = async () => {
    writeContract({
      ...wagmiContractConfig,
      functionName: 'shipProduct',
      args: [BigInt(Number(shipID)), BigInt(Number(shipQuantity))],
    });
    setShipDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Aside role="logistic" />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header role="logistic" />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="ready_for_shipment">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="ready_for_shipment">
                  Ready For Shipment
                </TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative ml-auto flex-1 md:grow-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  />
                </div>
              </div>
              <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Order Product</DialogTitle>
                    <DialogDescription>
                      Order products from manufacturers to sell in your store.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Product ID
                      </Label>
                      <Input
                        id="product_id"
                        value={shipID}
                        className="col-span-3"
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantity" className="text-right">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        value={shipQuantity}
                        className="col-span-3"
                        onChange={handleShipQuantityChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleShip}>Confirm Ship</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <TabsContent value="ready_for_shipment">
              <Card>
                <CardHeader>
                  <CardTitle>Ship Products</CardTitle>
                  <CardDescription>
                    Ship ready products to retailers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Shipment Quantity
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map(
                        (product: any, idx: number) =>
                          deliveries[idx].status === 'ready_for_shipment' && (
                            <TableRow key={product.id}>
                              <TableCell>{Number(product.id)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.name}</Badge>
                              </TableCell>
                              <TableCell>{`$${Number(product.price)}`}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {Number(deliveries[idx].quantity)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">
                                        Toggle menu
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setShipID(Number(product.id));
                                        setShipDialogOpen(true);
                                      }}
                                    >
                                      Ship
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ),
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground"></div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="shipped">
              <Card>
                <CardHeader>
                  <CardTitle>Shipped Products</CardTitle>
                  <CardDescription>
                    Track shipped products to retailers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Shipment Quantity
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map(
                        (product: any, idx: number) =>
                          deliveries[idx].status === 'shipped' && (
                            <TableRow key={product.id}>
                              <TableCell>{Number(product.id)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.name}</Badge>
                              </TableCell>
                              <TableCell>{`$${Number(product.price)}`}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {Number(deliveries[idx].quantity)}
                              </TableCell>
                            </TableRow>
                          ),
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground"></div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="received">
              <Card>
                <CardHeader>
                  <CardTitle>Received Products</CardTitle>
                  <CardDescription>
                    Track received products by retailers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Shipment Quantity
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retailerStock?.map((product: any, idx: number) => (
                        <TableRow key={product.id}>
                          <TableCell>{Number(product.id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.name}</Badge>
                          </TableCell>
                          <TableCell>{`$${Number(product.price)}`}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {Number(retailerStock[idx].quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground"></div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Logistic;
