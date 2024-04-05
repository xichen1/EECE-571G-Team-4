const { expect } = require("chai");
const { ethers } = require("hardhat");

/*
Test List
A retailer cannot order products from the manufacturer if the product is not available
A retailer cannot order products from the manufacturer if order quantity is larger than manufacturer's inventory
A retailer cannot order products from the manufacturer if he/she does not send enough ether
The manufacturer should receive the money after a retailer successfully orders products
The manufacturer should have correct inventory of the product after creating the product

A manufacturer cannot make distribution request if there’s no order been made
A manufacturer cannot distribute products more than inventory

A logistic provider cannot ship products if products are not ready for shipment
The manufacturer’s inventory of the product should be correct after a logistic provider has shipped the product

A retailer cannot receive products if pruducts are not shipped
The quantity of received products at the retailer’s should match the ordered quantity
The retailer’s inventory of the product should be correct after receiving the product

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

    // Setup consumer role for addr4 before each test
    const CONSUMER_ROLE = await supplyChainContract.CONSUMER_ROLE();
    await supplyChainContract.grantRole(CONSUMER_ROLE, consumer.address);
  });

  it("Should allow a manufacturer to create a product", async function () {

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



  

});



