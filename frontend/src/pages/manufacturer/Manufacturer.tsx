import { ListFilter, MoreHorizontal, PlusCircle, Search } from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog.tsx';
import { Label } from '@components/ui/label.tsx';
import { useReadContract, useWriteContract } from 'wagmi';
import { useState } from 'react';
import wagmiContractConfig from '@/abi.ts';

const Manufacturer = () => {
  const { writeContract } = useWriteContract();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productID, setProductID] = useState<number>();
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<number>();
  const [quantity, setQuantity] = useState<number>();

  const [distributionID, setDistributionID] = useState<number>();
  const [distributionQuantity, setDistributionQuantity] = useState<number>();
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);

  const { data: products } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllManufacturerProducts',
    args: [],
  });

  console.log(products);

  const { data: deliveries } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllDeliveries',
    args: [],
  });

  console.log(products);

  const createProduct = async (e: any) => {
    console.log('createProduct');
    e.preventDefault();
    writeContract({
      ...wagmiContractConfig,
      functionName: 'createProduct',
      args: [
        BigInt(Number(productID)),
        name,
        BigInt(Number(price)),
        BigInt(Number(quantity)),
      ],
    });
    setDialogOpen(false);
  };

  const requestDistribution = async (e: any) => {
    console.log('requestDistribution');
    e.preventDefault();
    writeContract({
      ...wagmiContractConfig,
      functionName: 'requestDistribution',
      args: [
        BigInt(Number(distributionID)),
        BigInt(Number(distributionQuantity)),
      ],
    });
    setDistributionDialogOpen(false);
  };

  const handleProductIDChange = (e: any) => {
    setProductID(e.target.value);
  };

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };

  const handlePriceChange = (e: any) => {
    setPrice(e.target.value);
  };

  const handleQuantityChange = (e: any) => {
    setQuantity(e.target.value);
  };

  const handleDistributionQuantityChange = (e: any) => {
    setDistributionQuantity(e.target.value);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Aside role="manufacturer" />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header role="manufacturer" />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ordered">Ordered</TabsTrigger>
                <TabsTrigger value="ready_for_shipment">
                  Ready For Shipment
                </TabsTrigger>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Filter
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Active
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Draft</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Archived
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 gap-1">
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Create Product
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Product</DialogTitle>
                      <DialogDescription>
                        Order products from manufacturers to sell in your store.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productId" className="text-right">
                          ProductID
                        </Label>
                        <Input
                          id="productId"
                          value={productID}
                          className="col-span-3"
                          onChange={handleProductIDChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          className="col-span-3"
                          onChange={handleNameChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                          Price
                        </Label>
                        <Input
                          id="price"
                          value={price}
                          className="col-span-3"
                          onChange={handlePriceChange}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          value={quantity}
                          className="col-span-3"
                          onChange={handleQuantityChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={createProduct}>
                        Confirm Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={distributionDialogOpen}
                  onOpenChange={setDistributionDialogOpen}
                >
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Request Distribution</DialogTitle>
                      <DialogDescription>
                        Request distribution of products from manufacturers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="productId" className="text-right">
                          ProductID
                        </Label>
                        <Input
                          id="productId"
                          value={distributionID}
                          disabled={true}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          value={distributionQuantity}
                          className="col-span-3"
                          onChange={handleDistributionQuantityChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={requestDistribution}>
                        Confirm Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Create Products</CardTitle>
                  <CardDescription>
                    Create and distribute your products here.
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
                          In Stock Quantity
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map((product: any, idx: number) => (
                        <TableRow key={product.id}>
                          <TableCell>{Number(product.id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.name}</Badge>
                          </TableCell>
                          <TableCell>{`$${Number(product.price)}`}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {Number(product.quantity)}
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
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <div className="text-xs text-muted-foreground">
                    Showing <strong>{products ? products.length : 0}</strong>{' '}
                    Products
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="ordered">
              <Card>
                <CardHeader>
                  <CardTitle>List Products</CardTitle>
                  <CardDescription>
                    Order, receive, and list your products for sale here.
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
                          Ordered Quantity
                        </TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map(
                        (product: any, idx: number) =>
                          deliveries[idx].status === 'ordered' && (
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
                                        setDistributionID(Number(product.id));
                                        setPrice(Number(product.price));
                                        setDistributionDialogOpen(true);
                                      }}
                                    >
                                      Request Distribution
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
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
            <TabsContent value="ready_for_shipment">
              <Card>
                <CardHeader>
                  <CardTitle>List Products</CardTitle>
                  <CardDescription>
                    Order, receive, and list your products for sale here.
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
                          Ordered Quantity
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
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Manufacturer;
