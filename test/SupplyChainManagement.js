const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
Test List
*A retailer cannot order products from the manufacturer if the product is not available
*A retailer cannot order products from the manufacturer if order quantity is larger than manufacturer's inventory
*A retailer cannot order products from the manufacturer if he/she does not send enough ether
The manufacturer should receive the money after a retailer successfully orders products
*The manufacturer should have correct inventory of the product after creating the product

*A manufacturer cannot make distribution request if there’s no order been made
*A manufacturer cannot distribute products more than inventory

*A logistic provider cannot ship products if products are not ready for shipment
*The manufacturer’s inventory of the product should be correct after a logistic provider has shipped the product

*A retailer cannot receive products if products are not shipped
A retailer’s inventory of the product should be correct after receiving the product
A retailer cannot list products for sale if the quantity of product is 0
A retailer can list products for sale and set the price if everything is correct

A consumer cannot purchase a product if there's no product listed for sale
A consumer cannot purchase products more than inventory of the retailer
A consumer cannot purchase products from the retailer if he/she does not send enough ether
A consumer should purchase products from the retailer if everything is correct

And more....
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
    const productQty = 100; // initial quantity
  
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
  
    // Optionally, verify the status in the delivery list remains unchanged
    const delivery = await supplyChainContract.deliveryList(productId);
    expect(delivery.status).to.not.equal("received");
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



  

});


