// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SupplyChainManagement is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        string status; // "created", "ready_for_shipment", "shipped", etc.
        address currentOwner;
    }


    uint256 private _nextProductId = 1;
    mapping(uint256 => Product) public products;

    mapping(uint256 => uint256) public productInventory;
    mapping(uint256 => uint256) public retailerInventory;
    mapping(uint256 => uint256) private orderedQuantities;


    event ProductCreated(uint256 productId, string name, uint256 price);
    event DistributionRequested(uint256 productId);
    event ProductShipped(uint256 productId);
    event ShippingStatusUpdated(uint256 productId, string newStatus);
    event ProductOrdered(uint256 productId, address orderedBy);
    event ProductReceived(uint256 productId, address receivedBy);
    event ProductListedForSale(uint256 productId, uint256 price, address listedBy);
    event ProductPurchased(uint256 productId, address purchasedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender); // Assuming the deployer is also a manufacturer for demo purposes
        _grantRole(LOGISTICS_ROLE, msg.sender); // Assuming the deployer is also a logistic provider for demo purposes
    }

    // Function to setup roles (call after deployment for setup)
    function setupRole(bytes32 role, address account) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _grantRole(role, account);
    }


    // Modifier to check if the caller has the manufacturer role
    modifier onlyManufacturer() {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "Caller is not a manufacturer");
        _;
    }

    modifier onlyLogisticsProvider() {
        require(hasRole(LOGISTICS_ROLE, msg.sender), "Caller is not a logistics provider");
        _;
    }

    modifier onlyRetailer() {
        require(hasRole(RETAILER_ROLE, msg.sender), "Caller is not a retailer");
        _;
    }

    modifier onlyConsumer() {
        require(hasRole(CONSUMER_ROLE, msg.sender), "Caller is not a consumer");
        _;
    }
    
    // Function for a manufacturer to create products and set product price
    function createProduct(uint256 productId, string memory name, uint256 price, uint256 quantity) public onlyManufacturer {
        //uint256 productId = _nextProductId++;     
        products[productId] = Product(productId, name, price, "created", msg.sender);
        if (productInventory[productId] > 0) {
            productInventory[productId] += quantity;
        }
        else {
            productInventory[productId] = quantity; // Set initial inventory            
        }       
        emit ProductCreated(productId, name, price);
    }

    // Function for a retailer to order a product from the manufacturer and pay for it
    function orderProduct(uint256 productId, uint256 quantity) public payable onlyRetailer {
        Product storage product = products[productId];
        
        require(keccak256(bytes(product.status)) == keccak256(bytes("created")), "Product is not in the 'created' state");
        require(productInventory[productId] >= quantity, "Insufficient quantity in manufacturer's inventory");
        uint256 orderCost = product.price * quantity;
        require(msg.value >= orderCost, "Insufficient payment for the order");
        
        product.status = "ordered";
        orderedQuantities[productId] = quantity; // Track the quantity ordered

        // Transfer payment to the manufacturer
        address payable manufacturer = payable(product.currentOwner);
        manufacturer.transfer(orderCost);

        // If the retailer sent more Ether than the cost, refund the excess
        uint256 excessPayment = msg.value - orderCost;
        if (excessPayment > 0) {
            payable(msg.sender).transfer(excessPayment);
        }
        
        emit ProductOrdered(productId, msg.sender);
    }

    // Function for a manufacturer to reqest distribution
    function requestDistribution(uint256 productId, uint256 quantity) public onlyManufacturer {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("ordered")), "No order for the products");
        require(productInventory[productId] >= quantity, "Insufficient quantity in manufacturer's inventory");
        products[productId].status = "ready_for_shipment";
        emit DistributionRequested(productId);
    }

    // Logistic provider functions
    function shipProduct(uint256 productId, uint256 quantity) public onlyLogisticsProvider {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("ready_for_shipment")), "Product is not ready for shipment");
        products[productId].status = "shipped";
        product.currentOwner = msg.sender; // Transfer ownership to the Logistic provider
        productInventory[productId] -= quantity;
        emit ProductShipped(productId);
    }

    function updateShippingStatus(uint256 productId, string memory newStatus) public onlyLogisticsProvider {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("shipped")) ||
                keccak256(bytes(products[productId].status)) == keccak256(bytes("in_transit")), "Product is not shipped or in transit");
        products[productId].status = newStatus;
        emit ShippingStatusUpdated(productId, newStatus);
    }


    // Function for a retailer to mark a product as received
    function receiveProduct(uint256 productId, uint256 quantity) public onlyRetailer {
        Product storage product = products[productId];
        require(keccak256(bytes(product.status)) == keccak256(bytes("shipped")), "Product has not been shipped");
        require(orderedQuantities[productId] == quantity, "Received quantity does not match the ordered quantity");        
        
        product.status = "received";
        product.currentOwner = msg.sender; // Transfer ownership to the retailer
        retailerInventory[productId] += quantity; // Update retailer inventory
        
        // Clear the ordered quantity as the order has been fulfilled
        orderedQuantities[productId] = 0;
        emit ProductReceived(productId, msg.sender);
    }

    // Function for a retailer to list a product for sale
    function listProductForSale(uint256 productId, uint256 price, uint256 quantity) public onlyRetailer {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Caller does not own the product");
        require(keccak256(bytes(product.status)) == keccak256(bytes("received")), "Product is not received");
        require(retailerInventory[productId] >= quantity, "Insufficient quantity to list for sale");
        product.price = price;
        product.status = "for_sale";
        emit ProductListedForSale(productId, price, msg.sender);
    }

    // Function for customers to verify the authenticity of a product before purchase
    function verifyProductAuthenticity(uint256 productId) public view returns (bool) {
        Product memory product = products[productId];
        // A product is considered authentic and ready for purchase if its status is "for_sale"
        // and its current owner has the retailer role. 
        if (keccak256(bytes(product.status)) == keccak256(bytes("for_sale")) &&
            hasRole(RETAILER_ROLE, product.currentOwner)) {
            return true;
        }
        return false;
    }

    // Function for a consumer to purchase a product
    function purchaseProduct(uint256 productId, uint256 quantity) public onlyConsumer payable {
        Product storage product = products[productId];
        require(keccak256(bytes(product.status)) == keccak256(bytes("for_sale")), "Product is not for sale");
        require(retailerInventory[productId] >= quantity, "Not enough product available for purchase");
        uint256 totalCost = product.price * quantity;
        require(msg.value >= totalCost, "Insufficient payment");

        // Transfer payment to the retailer and refund any excess
        address payable seller = payable(product.currentOwner);
        seller.transfer(totalCost);
        
        // Update the inventory after the purchase
        retailerInventory[productId] -= quantity;
        
        // Refund any excess payment
        uint256 purchaseExcess = msg.value - totalCost;
        if (purchaseExcess > 0) {
            payable(msg.sender).transfer(purchaseExcess);
        }

        // Update the product status if all inventory has been sold
        if (retailerInventory[productId] == 0) {
            product.status = "sold_out";
        }

        emit ProductPurchased(productId, msg.sender);
    }


}
