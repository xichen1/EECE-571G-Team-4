const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChainManagement", function () {
  let SupplyChainManagement;
  let supplyChainContract;
  let owner;
  let addr1;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    SupplyChainManagement = await ethers.getContractFactory("SupplyChainManagement");
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    
    // Deploy a new SupplyChainManagement contract before each test.
    supplyChainContract = await SupplyChainManagement.deploy();
    // Setup manufacturer role for addr1 before each test
    const MANUFACTURER_ROLE = await supplyChainContract.MANUFACTURER_ROLE();
    await supplyChainContract.grantRole(MANUFACTURER_ROLE, addr1.address);

    // Setup logistics role for addr2 before each test
    const LOGISTICS_ROLE = await supplyChainContract.LOGISTICS_ROLE();
    await supplyChainContract.grantRole(LOGISTICS_ROLE, addr2.address);

    // Setup retail role for addr3 before each test
    const RETAILER_ROLE = await supplyChainContract.RETAILER_ROLE();
    await supplyChainContract.grantRole(RETAILER_ROLE, addr3.address);

    // Setup logistics role for addr4 before each test
    const CONSUMER_ROLE = await supplyChainContract.CONSUMER_ROLE();
    await supplyChainContract.grantRole(CONSUMER_ROLE, addr4.address);
  });

  it("Should allow a manufacturer to create a product", async function () {

    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");

    // addr1 creates a product
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);

    // Verify the product creation
    const product = await supplyChainContract.products(1);
    expect(product.name).to.equal(productName);
    expect(product.price.toString()).to.equal(productPrice.toString());
    expect(product.status).to.equal("created");
  });

  it("Should allow a manufacturer to request distribution of a product", async function () {
    // Setup manufacturer role for addr1 before each test
    const MANUFACTURER_ROLE = await supplyChainContract.MANUFACTURER_ROLE();
    await supplyChainContract.grantRole(MANUFACTURER_ROLE, addr1.address);
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");

    // addr1 creates a product
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);

    // addr1 requests distribution
    await supplyChainContract.connect(addr1).requestDistribution(1);

    // Verify the product status is updated
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("ready_for_shipment");
  });

  it("Should not allow a manufacturer to request distribution of a un-created product", async function () {
    // Setup manufacturer role for addr1 before each test
    const MANUFACTURER_ROLE = await supplyChainContract.MANUFACTURER_ROLE();
    await supplyChainContract.grantRole(MANUFACTURER_ROLE, addr1.address);

    // addr1 requests distribution

    await expect(supplyChainContract.connect(addr1).requestDistribution(1)).to.be.revertedWith("Product is not in 'created' state");
  });

  it("Should allow a logistic provider to ship a product", async function () {
    // Setup: Create a product and request distribution as a manufacturer first
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
    await supplyChainContract.connect(addr1).requestDistribution(1);

    // Act: Ship the product as a logistic provider
    await supplyChainContract.connect(addr2).shipProduct(1);

    // Assert: Verify the product status is updated to "shipped"
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("shipped");
  });

  it("Should not allow a logistic provider to ship a product that has not been requested to be distributed", async function () {
    // Setup: Create a product and request distribution as a manufacturer first
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);

    // Act: Ship the product as a logistic provider
    expect(supplyChainContract.connect(addr2).shipProduct(1)).to.be.revertedWith("Product is not ready for shipment");
  });

  it("Should allow a logistic provider to update the shipping status of a product", async function () {
    // Setup: Create a product, request distribution, and mark as shipped
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1");
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
    await supplyChainContract.connect(addr1).requestDistribution(1);
    await supplyChainContract.connect(addr2).shipProduct(1);

    // Act: Update the shipping status as a logistic provider
    await supplyChainContract.connect(addr2).updateShippingStatus(1, "in transit");

    // Assert: Verify the shipping status is updated correctly
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("in transit");
  });

  it("Retailer can receive, and list a product for sale", async function() {
    // Retailer can receive a product
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1"); // Assuming 1 ether price
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
    await supplyChainContract.connect(addr1).requestDistribution(1);
    await supplyChainContract.connect(addr2).shipProduct(1);
    await supplyChainContract.connect(addr3).receiveProduct(1); 
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("received");
    expect(product.currentOwner).to.equal(addr3.address);
  
    // Retailer lists the product for sale
    const salePrice = ethers.parseEther("2"); 
    await supplyChainContract.connect(addr3).listProductForSale(1, salePrice);
    const product_sale = await supplyChainContract.products(1);
    expect(product_sale.status).to.equal("for_sale");
    expect(product_sale.price.toString()).to.equal(salePrice.toString());
  });  

  it("Should allow a retailer to order a product", async function() {
    // Retailer can receive a product
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1"); // Assuming 1 ether price
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
    await supplyChainContract.connect(addr1).requestDistribution(1);
    await supplyChainContract.connect(addr3).orderProduct(1); 
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("ordered");
  }); 

  it("Should allow a consumer to purchase a product", async function () {
    // Setup: List a product for sale as a retailer first
    const productName = "Test Product";
    const productPrice = ethers.parseEther("1"); // Assuming 1 ether price
    await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
    await supplyChainContract.connect(addr1).requestDistribution(1);
    await supplyChainContract.connect(addr2).shipProduct(1);
    await supplyChainContract.connect(addr3).receiveProduct(1); 
    await supplyChainContract.connect(addr3).listProductForSale(1, productPrice);

    // Act: Purchase the product as a consumer
    const transaction = await supplyChainContract.connect(addr4).purchaseProduct(1, { value: productPrice });

    // Assert: Verify the product status is updated to "sold" and the ownership is transferred
    const product = await supplyChainContract.products(1);
    expect(product.status).to.equal("sold");
    expect(product.currentOwner).to.equal(addr4.address);

    // Check if the ProductPurchased event was emitted
    await expect(transaction).to.emit(supplyChainContract, 'ProductPurchased').withArgs(1, addr4.address);
});

it("A consumer cannot purchase the product if he/she does not send enough ether", async function () {
  // Setup: List a product for sale as a retailer first
  const productName = "Test Product";
  const productPrice = ethers.parseEther("1"); // Assuming 1 ether price
  await supplyChainContract.connect(addr1).createProduct(productName, productPrice);
  await supplyChainContract.connect(addr1).requestDistribution(1);
  await supplyChainContract.connect(addr2).shipProduct(1);
  await supplyChainContract.connect(addr3).receiveProduct(1); 
  await supplyChainContract.connect(addr3).listProductForSale(1, productPrice);

  //Act & Assert: Purchase the product as a consumer but failed
  await expect(supplyChainContract.connect(addr4).purchaseProduct(1,{ value: ethers.parseEther("0.5")})).to.be.revertedWith("Insufficient payment");
});

it("A consumer cannot purchase the product if the product is not for sale", async function () {
  // Setup: Create a product first but not for sale
  const productName = "Test Product";
  const productPrice = ethers.parseEther("1"); // Assuming 1 ether price
  await supplyChainContract.connect(addr1).createProduct(productName, productPrice);

  //Act & Assert: Purchase the product as a consumer but failed
  await expect(supplyChainContract.connect(addr4).purchaseProduct(1,{ value: productPrice})).to.be.revertedWith("Product is not for sale");
});


});



