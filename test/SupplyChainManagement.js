const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
Test List
1. A retailer cannot order products from the manufacturer if the product is not available.
2. A retailer cannot order products from the manufacturer if the order quantity is larger than the manufacturer's inventory.
3. A retailer cannot order products from the manufacturer if he/she does not send enough ether.
4. The manufacturer should have the correct inventory of the product after creating the product.
5. A manufacturer cannot make a distribution request if there’s no order been made.
6. A manufacturer cannot distribute products more than inventory.
7. A logistic provider cannot ship products if products are not ready for shipment.
8. The manufacturer’s inventory of the product should be correct after a logistic provider has shipped the product.
9. A retailer cannot receive products if products are not shipped.
10. A retailer’s inventory of the product should be correct after receiving the product.
11. A retailer cannot list products for sale if the quantity of the product is 0.
12. A retailer can list products for sale and set the price if everything is correct.
13. A consumer cannot purchase a product if there's no product listed for sale.
14. A consumer cannot purchase products more than the inventory of the retailer.
15. A consumer cannot purchase products from the retailer if he/she does not send enough ether.
16. A consumer should purchase products from the retailer if everything is correct.

*TO DO 17. Multiple products test

18. Should use getAllManufacturerProducts to return all manufacturer products correctly.
19. Should correctly return all products in the retailer's inventory.

*/

describe("SupplyChainManagement", function () {
  let SupplyChainManagement, supplyChainManagement, admin, manufacturer, logistics, retailer, consumer;


  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    SupplyChainManagement = await ethers.getContractFactory("SupplyChainManagement");
    [admin, manufacturer, logistics, retailer, consumer] = await ethers.getSigners();
    
    // Deploy a new SupplyChainManagement contract before each test.
    supplyChainContract = await SupplyChainManagement.deploy(manufacturer.address, retailer.address);
    // Setup manufacturer role
    const MANUFACTURER_ROLE = await supplyChainContract.MANUFACTURER_ROLE();
    await supplyChainContract.grantRole(MANUFACTURER_ROLE, manufacturer.address);

    // Setup logistics role 
    const LOGISTICS_ROLE = await supplyChainContract.LOGISTICS_ROLE();
    await supplyChainContract.grantRole(LOGISTICS_ROLE, logistics.address);

    // Setup retail role 
    const RETAILER_ROLE = await supplyChainContract.RETAILER_ROLE();
    await supplyChainContract.grantRole(RETAILER_ROLE, retailer.address);

    // Setup consumer role
    const CONSUMER_ROLE = await supplyChainContract.CONSUMER_ROLE();
    await supplyChainContract.grantRole(CONSUMER_ROLE, consumer.address);
  });

  it("Should allow a manufacturer to create a product and have correct inventory of the product", async function () {

    const productId = 1;
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;

    // manufacturer creates a product
    const createProductTx = await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
    await createProductTx.wait();

    // Verify the product creation
    const product = await supplyChainContract.manufacturerInventory(productId);
        expect(product.name).to.equal(productName);
        expect(product.price).to.equal(productPrice);
        expect(product.quantity).to.equal(productQty);
        expect(product.buyable).to.equal(false); 
  });


  it("A retailer cannot order products from the manufacturer if the product is not available", async function () {

    // Retailer tries to order a product
    await expect(supplyChainContract.connect(retailer).orderProduct(1, 10))
    .to.be.revertedWith("Product is out of stock");
  });

  it("A retailer cannot order products from the manufacturer if order quantity is larger than manufacturer's inventory", async function () {

    // manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(1, "Test Product", ethers.parseEther("1"), 100);

    // Retailer tries to order 150 products, which is more than available
    await expect(supplyChainContract.connect(retailer).orderProduct(1, 150))
    .to.be.revertedWith("Insufficient quantity in manufacturer's inventory");
  });

  it("A retailer cannot order products from the manufacturer if he/she does not send enough ether", async function () {

    // manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(1, "Test Product", ethers.parseEther("1"), 100);

    // Retailer tries to order 150 products, which is more than available
    await expect(supplyChainContract.connect(retailer).orderProduct(1, 10,{ value: ethers.parseEther("0.5") }))
    .to.be.revertedWith("Insufficient payment for the order");
  });


  it("A retailer can order products from the manufacturer if everything is correct", async function () {
    // Manufacturer creates a product
    const productId = 1;
    const productName = "Coke";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
  
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    const orderQty = 50n; // Quantity the retailer is ordering
    const orderValue = productPrice * orderQty; // Total order cost
  
    // Retailer places an order, sending enough Ether to cover the product cost
    await expect(supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue }))
      .to.emit(supplyChainContract, 'ProductOrdered') // Check if the 'ProductOrdered' event was emitted
      .withArgs(productId, retailer.address); // Optionally, check the event args if relevant
  
    // Verify the order details in the delivery list
    const delivery = await supplyChainContract.deliveryList(productId);
    expect(delivery.status).to.equal("ordered");
    expect(delivery.quantity).to.equal(orderQty);
  
    // Verify the updated manufacturer inventory
    //const updatedProduct = await supplyChainContract.manufacturerInventory(productId);
    //expect(updatedProduct.quantity).to.equal(productQty - orderQty); // Quantity should be reduced by the ordered amount
  });

  it("A manufacturer cannot make a distribution request if there’s no order been made", async function () {
    const productId = 1;
    const productName = "Product for Retail";
    const productPrice = ethers.parseEther("1"); // Price per unit in Wei
    const productQty = 100; // Available quantity
    
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
    
    // Manufacturer tries to request distribution for the product with no order
    await expect(supplyChainContract.connect(manufacturer).requestDistribution(productId, productQty))
      .to.be.revertedWith('No order for the products'); // We expect this transaction to be reverted due to no orders
    
  });

  it("A manufacturer cannot distribute products when the distribution quantity is more than the inventory", async function () {
    const productId = 1;
    const productName = "Product for Retail";
    const productPrice = ethers.parseEther("1"); // Price per unit in Wei
    const productQty = 100; // Available quantity
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer places an order
    const orderQty = 10n; // Quantity the retailer is ordering
    const orderValue = productPrice * orderQty;
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer tries to request distribution with a quantity greater than available inventory
    const distributionQty = productQty + 1; // More than available in inventory
    await expect(supplyChainContract.connect(manufacturer).requestDistribution(productId, distributionQty))
      .to.be.revertedWith("Insufficient quantity in manufacturer's inventory"); // Assuming your contract reverts with this message
  });


  it("A logistic provider cannot ship products if products are not ready for shipment", async function () {
    const productId = 1;
    const productName = "Product for Shipping";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    const orderQty = 10n; // Quantity the retailer is ordering
    const orderValue = productPrice * orderQty;
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // The logistics provider tries to ship the product before it's marked as ready for shipment
    await expect(supplyChainContract.connect(logistics).shipProduct(productId, orderQty))
      .to.be.revertedWith("Product is not ready for shipment"); // Assuming your contract reverts with this message
  
    // Optionally, you can verify the state of the product to ensure it has not been mistakenly marked as shipped
    const deliveryStatus = await supplyChainContract.deliveryList(productId);
    expect(deliveryStatus.status).to.not.equal("shipped");
  });


  it("A manufacturer's inventory should be correct after a logistic provider has shipped the product", async function () {
    const productId = 1;
    const productName = "Product to Ship";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    const orderQty = 10n; // Quantity the retailer is ordering
    const orderValue = productPrice * orderQty;
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Check the manufacturer's inventory for the correct quantity after shipping
    const productAfterShipping = await supplyChainContract.manufacturerInventory(productId);
    const expectedQtyAfterShipping = productQty - Number(orderQty); // Update this line to match the logic of quantity reduction after shipping in your smart contract
    expect(productAfterShipping.quantity).to.equal(expectedQtyAfterShipping);
  });


  it("A retailer cannot receive products if products are not shipped", async function () {
    const productId = 1;
    const productName = "Product for Receipt";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer attempts to receive the product before it has been shipped
    await expect(supplyChainContract.connect(retailer).receiveProduct(productId))
      .to.be.revertedWith("Product has not been shipped"); // Assuming the contract reverts with this message

    // Retailer orders a quantity of the product
    const orderQty = 10n;
    const orderValue = productPrice * orderQty;
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
    // Retailer attempts to receive the product before it has been shipped
    await expect(supplyChainContract.connect(retailer).receiveProduct(productId))
      .to.be.revertedWith("Product has not been shipped"); // Assuming the contract reverts with this message
  
    const delivery = await supplyChainContract.deliveryList(productId);
    expect(delivery.status).to.not.equal("received");    
  });

  it("A retailer’s inventory of the product should be correct after receiving the product", async function () {
    const productId = 1;
    const productName = "Product to be Received";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
    const orderQty = 10n;
    const orderValue = productPrice * orderQty;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer places an order
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Verify retailer's inventory is updated correctly
    const retailerProduct = await supplyChainContract.retailerInventory(productId);
    expect(retailerProduct.quantity).to.equal(Number(orderQty));
  });


  it("A retailer cannot list products for sale if the quantity of the product is 0", async function () {
    const productId = 1;
    const productName = "Product Not For Sale";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
  
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer tries to list the product for sale with a quantity of 0
    await expect(supplyChainContract.connect(retailer).listProductForSale(productId, productPrice))
      .to.be.revertedWith("No item to list for sale"); // Assuming the contract reverts with this message
  
    // Verify the product's buyable state remains false
    const product = await supplyChainContract.retailerInventory(productId);
    expect(product.buyable).to.equal(false);
  });


  it("A retailer can list products for sale and set the price if everything is correct", async function () {
    const productId = 1;
    const productName = "Product Available for Sale";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
    const orderQty = 10n;
    const orderValue = productPrice * orderQty;
    const salePrice = ethers.parseEther("2");
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Retailer lists the product for sale with the new price
    await supplyChainContract.connect(retailer).listProductForSale(productId, salePrice);
  
    // Verify the product is now listed for sale at the correct price
    const listedProduct = await supplyChainContract.retailerInventory(productId);
    expect(listedProduct.price.toString()).to.equal(salePrice.toString());
    expect(listedProduct.buyable).to.equal(true);
  });

  it("A consumer cannot purchase a product if there's no product listed for sale", async function () {
    const productId = 1;
    const productName = "Unlisted Product";
    const productPrice = ethers.parseEther("1");
    const productQty = 100;
    const orderQty = 10n;
    const purchaseQty = 5n;
    const orderValue = productPrice * orderQty;
    const purchaseValue = productPrice * purchaseQty; // Assuming consumer is attempting to buy at manufacturer's price
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product but does not list it for sale
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Consumer attempts to purchase the product that has not been listed for sale
    await expect(supplyChainContract.connect(consumer).purchaseProduct(productId, purchaseQty, { value: purchaseValue }))
      .to.be.revertedWith("Product is not for sale"); // This message should match the revert message in your smart contract
  
    const consumerPurchase = await supplyChainContract.consumerPurchases(consumer.address, productId);
    expect(consumerPurchase.quantity).to.equal(0);
  });


  it("A consumer cannot purchase products more than the inventory of the retailer", async function () {
    const productId = 1;
    const productName = "Limited Stock Product";
    const productPrice = ethers.parseEther("1");
    const initialProductQty = 100;
    const orderQty = 20n;
    const purchaseQty = 25n; // Quantity the consumer attempts to purchase, intentionally more than available
    const orderValue = productPrice * orderQty; // Total value for the retailer's order
    const salePrice = ethers.parseEther("2");
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, initialProductQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: orderValue });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Retailer lists the product for sale
    await supplyChainContract.connect(retailer).listProductForSale(productId, salePrice);
  
    // Consumer attempts to purchase the product with quantity more than the retailer's inventory
    await expect(supplyChainContract.connect(consumer).purchaseProduct(productId, purchaseQty, { value: salePrice * purchaseQty }))
      .to.be.revertedWith("Not enough product available for purchase"); // This message should match the revert message in your smart contract
  
    const retailerProduct = await supplyChainContract.retailerInventory(productId);
    expect(retailerProduct.quantity).to.equal(Number(orderQty));
  });


  it("A consumer cannot purchase products from the retailer if he/she does not send enough ether", async function () {
    const productId = 1;
    const productName = "Exclusive Product";
    const productPrice = ethers.parseEther("1");
    const salePrice = ethers.parseEther("2");
    const productQty = 100;
    const orderQty = 20n;
    const purchaseQty = 5n;
    const insufficientValue = ethers.parseEther("1"); // Insufficient Ether for the purchase
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, productPrice, productQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: productPrice * orderQty });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Retailer lists the product for sale at a higher price
    await supplyChainContract.connect(retailer).listProductForSale(productId, salePrice);
  
    // Consumer attempts to purchase the product with insufficient Ether
    await expect(supplyChainContract.connect(consumer).purchaseProduct(productId, purchaseQty, { value: insufficientValue * purchaseQty}))
      .to.be.revertedWith("Insufficient payment"); // This message should match the revert message in your smart contract
  
    const consumerPurchase = await supplyChainContract.consumerPurchases(consumer.address, productId);
    expect(consumerPurchase.quantity).to.equal(0);
  });


  it("A consumer should purchase products from the retailer if everything is correct", async function () {
    const productId = 1;
    const productName = "Sought After Product";
    const manufacturerPrice = ethers.parseEther("1");
    const salePrice = ethers.parseEther("2");
    const initialProductQty = 100n;
    const orderQty = 20n;
    const purchaseQty = 5n;
    const purchaseValue = salePrice * purchaseQty;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, manufacturerPrice, initialProductQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: manufacturerPrice * orderQty });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  
    // Retailer lists the product for sale at a higher price
    await supplyChainContract.connect(retailer).listProductForSale(productId, salePrice);
  
    // Consumer purchases the product, sending enough Ether
    await expect(supplyChainContract.connect(consumer).purchaseProduct(productId, purchaseQty, { value: purchaseValue }))
      .to.emit(supplyChainContract, 'ProductPurchased') // Check if the 'ProductPurchased' event is emitted
      .withArgs(productId, purchaseQty, consumer.address);
  
    // Verify the consumer's purchase is recorded correctly
    const consumerPurchase = await supplyChainContract.consumerPurchases(consumer.address, productId);
    expect(consumerPurchase.quantity).to.equal(purchaseQty);
  
    // Verify the retailer's inventory is updated correctly
    const retailerProduct = await supplyChainContract.retailerInventory(productId);
    expect(retailerProduct.quantity).to.equal(orderQty - purchaseQty);
 
    // Verify the Manufacturer's inventory is correct
    const manufacturerProduct = await supplyChainContract.manufacturerInventory(productId);
    expect(manufacturerProduct.quantity).to.equal(initialProductQty - orderQty);    
  });

  it("A consumer can verify the product authenticity and availability", async function () {
    const productId = 1;
    const productName = "Coke";
    const manufacturerPrice = ethers.parseEther("1");
    const salePrice = ethers.parseEther("2");
    const initialProductQty = 100n;
    const orderQty = 20n;
    const purchaseQty = 5n;
    const purchaseValue = salePrice * purchaseQty;
  
    // Manufacturer creates a product
    await supplyChainContract.connect(manufacturer).createProduct(productId, productName, manufacturerPrice, initialProductQty);
  
    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(productId, orderQty, { value: manufacturerPrice * orderQty });
  
    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(productId, orderQty);
  
    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(productId, orderQty);
  
    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(productId);
  

    // Verify product authenticity and availability before list for sale
    let [isAuthentic, isAvailableForPurchase, price] = await supplyChainContract.verifyProductAuthenticity(productId);
    expect(isAuthentic).to.be.true;
    expect(isAvailableForPurchase).to.be.false;
    expect(price).to.equal(manufacturerPrice);

    // Retailer lists the product for sale
    await supplyChainContract.connect(retailer).listProductForSale(productId, salePrice);
 

    // Verify product authenticity and availability before purchase
    [isAuthentic, isAvailableForPurchase, price] = await supplyChainContract.verifyProductAuthenticity(productId);
    expect(isAuthentic).to.be.true;
    expect(isAvailableForPurchase).to.be.true;
    expect(price).to.equal(salePrice);

    // Consumer purchases the product
    await supplyChainContract.connect(consumer).purchaseProduct(productId, purchaseQty, { value: purchaseValue });

    // Verify the authenticity of a non-existent (fake) product
    const fakeProductId = 999;
    [isAuthentic, isAvailableForPurchase] = await supplyChainContract.verifyProductAuthenticity(fakeProductId);
    expect(isAuthentic).to.be.false;
    expect(isAvailableForPurchase).to.be.false;

  });  


  //-------------------------Return functions tests---------------------------------------------

  it("Should use getAllManufacturerProducts to return all manufacturer products correctly", async function () {
    // Assuming the createProduct function requires these parameters
    let tx = await supplyChainContract.connect(manufacturer).createProduct(1, "Product 1", ethers.parseEther("0.01"), 100);
    await tx.wait(); // Wait for the transaction to be mined

    tx = await supplyChainContract.connect(manufacturer).createProduct(2, "Product 2", ethers.parseEther("0.02"), 200);
    await tx.wait(); // Wait for the transaction to be mined

    // Call the getAllManufacturerProducts function
    const products = await supplyChainContract.getAllManufacturerProducts();

    // Validate the length of the products array
    expect(products.length).to.equal(2);

    // Validate the details of each product
    // Note: Adjust the validation based on your Products struct
    expect(products[0].id).to.equal(1);
    expect(products[0].name).to.equal("Product 1");
    expect(products[0].price).to.equal(ethers.parseEther("0.01"));
    expect(products[0].quantity).to.equal(100);

    expect(products[1].id).to.equal(2);
    expect(products[1].name).to.equal("Product 2");
    expect(products[1].price).to.equal(ethers.parseEther("0.02"));
    expect(products[1].quantity).to.equal(200);
  });

  it("Should correctly return all products in the retailer's inventory", async function () {
    // Assuming setup is done for product creation, ordering by retailer, shipping, and receiving

    // Retailer lists multiple products for sale
    const product1Name = "Coke";
    const product2Name = "Water";
    const product1Id = 1;
    const product2Id = 2;
    const manufacturerPrice1 = ethers.parseEther("1");
    const manufacturerPrice2 = ethers.parseEther("1");
    const initialProductQty = 100n;
    const salePrice1 = ethers.parseEther("2"); // Retail price for product 1
    const salePrice2 = ethers.parseEther("3"); // Retail price for product 2
    const quantity1 = 20n; // Quantity of product 1 ordered and received by retailer
    const quantity2 = 15n; // Quantity of product 2 ordered and received by retailer

    await supplyChainContract.connect(manufacturer).createProduct(product1Id, product1Name, manufacturerPrice1, initialProductQty);
    await supplyChainContract.connect(manufacturer).createProduct(product2Id, product2Name, manufacturerPrice2, initialProductQty);

    // Retailer orders a quantity of the product
    await supplyChainContract.connect(retailer).orderProduct(product1Id, quantity1, { value: manufacturerPrice1 * quantity1 });
    await supplyChainContract.connect(retailer).orderProduct(product2Id, quantity2, { value: manufacturerPrice2 * quantity2 });

    // Manufacturer marks the product as ready for shipment
    await supplyChainContract.connect(manufacturer).requestDistribution(product1Id, quantity1);
    await supplyChainContract.connect(manufacturer).requestDistribution(product2Id, quantity2);

    // Logistic provider ships the product
    await supplyChainContract.connect(logistics).shipProduct(product1Id, quantity1);
    await supplyChainContract.connect(logistics).shipProduct(product2Id, quantity2);

    // Retailer receives the product
    await supplyChainContract.connect(retailer).receiveProduct(product1Id);
    await supplyChainContract.connect(retailer).receiveProduct(product2Id);

    await supplyChainContract.connect(retailer).listProductForSale(product1Id, salePrice1);
    await supplyChainContract.connect(retailer).listProductForSale(product2Id, salePrice2);

    // Retrieve all products from the retailer's inventory
    const allProducts = await supplyChainContract.getAllRetailerProducts();

    // Check if the returned array length matches the number of listed products
    expect(allProducts.length).to.equal(2);

    // Verify details of the first product
    expect(allProducts[0].id).to.equal(product1Id);
    expect(allProducts[0].price.toString()).to.equal(salePrice1.toString());
    expect(allProducts[0].quantity).to.equal(quantity1);
    expect(allProducts[0].buyable).to.be.true; // Assuming products are marked as buyable when listed

    // Verify details of the second product
    expect(allProducts[1].id).to.equal(product2Id);
    expect(allProducts[1].price.toString()).to.equal(salePrice2.toString());
    expect(allProducts[1].quantity).to.equal(quantity2);
    expect(allProducts[1].buyable).to.be.true;
  });

  

});
