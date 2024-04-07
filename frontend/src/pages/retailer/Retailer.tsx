import { MoreHorizontal, Search } from 'lucide-react';

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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
} from '@/components/ui/dialog';
import { Label } from '@components/ui/label.tsx';
import { useReadContract, useWriteContract } from 'wagmi';
import wagmiContractConfig from '@/abi.ts';
import { useState } from 'react';
import { parseEther } from 'viem';

const Retailer = () => {
  const { writeContract } = useWriteContract();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productID, setProductID] = useState<number>();
  const [quantity, setQuantity] = useState<number>();
  const [price, setPrice] = useState<number>();

  const [receiveProductID, setReceiveProductID] = useState<number>();
  const [receiveProductDialogOpen, setReceiveProductDialogOpen] =
    useState(false);

  const [listProductID, setListProductID] = useState<number>();
  const [listProductDialogOpen, setListProductDialogOpen] = useState(false);
  const [listProductPrice, setListProductPrice] = useState<number>();

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

  const { data: retailerStock } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'getAllRetailerProducts',
    args: [],
  });

  console.log(retailerStock);

  const receiveProduct = async (e: any) => {
    e.preventDefault();
    writeContract({
      ...wagmiContractConfig,
      functionName: 'receiveProduct',
      args: [BigInt(Number(receiveProductID))],
    });
    setReceiveProductDialogOpen(false);
  };

  const orderProduct = async (e: any) => {
    console.log('order');
    e.preventDefault();
    if (!price || !quantity) return;
    const total = price * quantity;
    writeContract({
      ...wagmiContractConfig,
      functionName: 'orderProduct',
      args: [BigInt(Number(productID)), BigInt(Number(quantity))],
      value: parseEther(`${total}`),
    });
    setDialogOpen(false);
  };

  const listProduct = async (e: any) => {
    console.log('list');
    e.preventDefault();
    if (!listProductPrice) return;
    writeContract({
      ...wagmiContractConfig,
      functionName: 'listProductForSale',
      args: [BigInt(Number(listProductID)), BigInt(Number(listProductPrice))],
    });
    setListProductDialogOpen(false);
  };

  const handleQuantityChange = (e: any) => {
    setQuantity(e.target.value);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Aside role="retailer" />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header role="retailer" />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="all">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ordered">Ordered</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>
              <div className="ml-auto mr-4 flex items-center gap-2">
                <div className="relative ml-auto flex-1 md:grow-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  />
                </div>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                        value={productID}
                        className="col-span-3"
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Quantity
                      </Label>
                      <Input
                        id="username"
                        value={quantity}
                        className="col-span-3"
                        onChange={handleQuantityChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={orderProduct}>Confirm Order</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={receiveProductDialogOpen}
                onOpenChange={setReceiveProductDialogOpen}
              >
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
                        value={receiveProductID}
                        className="col-span-3"
                        disabled={true}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={receiveProduct}>Confirm Receive</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={listProductDialogOpen}
                onOpenChange={setListProductDialogOpen}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>List Product for Sale</DialogTitle>
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
                        value={listProductID}
                        className="col-span-3"
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price
                      </Label>
                      <Input
                        id="price"
                        value={listProductPrice}
                        className="col-span-3"
                        onChange={(e) =>
                          setListProductPrice(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={listProduct}>Confirm List</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <TabsContent value="all">
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setProductID(Number(product.id));
                                    setPrice(Number(product.price));
                                    setDialogOpen(true);
                                  }}
                                >
                                  Order
                                </DropdownMenuItem>
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
                                        setProductID(Number(product.id));
                                        setPrice(Number(product.price));
                                        setDialogOpen(true);
                                      }}
                                    >
                                      Order
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
                <CardFooter></CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="shipped">
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
                                        setReceiveProductID(Number(product.id));
                                        setReceiveProductDialogOpen(true);
                                      }}
                                    >
                                      Receive
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
                <CardFooter></CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="received">
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
                        <TableHead className="hidden md:table-cell">
                          Buyable
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
                          <TableCell className="hidden md:table-cell">
                            {product.buyable.toString()}
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setListProductID(Number(product.id));
                                    setListProductDialogOpen(true);
                                  }}
                                >
                                  List For Sale
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter></CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Retailer;
