// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SupplyChainManagement is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    

    // Assume only one manufacture and one retailer
    address public manufacturerAddress;
    address public retailerAddress;

    constructor(address _manufacturer, address _retailer) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        manufacturerAddress = _manufacturer;
        retailerAddress = _retailer;
        _grantRole(MANUFACTURER_ROLE, manufacturerAddress);
        _grantRole(RETAILER_ROLE, retailerAddress);
    }

    struct Products {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
        bool buyable; // true only when retailer lists the product for sale
    }

    // products shipped by logistics company
    struct Delivery {
        uint256 id;
        string status; // "ordered", "ready_for_shipment", "shipped", "received"
        uint256 quantity;
    }


    uint256[] private ProductIds;

    mapping(address => mapping(uint256 => Products)) public consumerPurchases;
    mapping(uint256 => Products) public manufacturerInventory;
    mapping(uint256 => Products) public retailerInventory;
    mapping (uint256 => Delivery) public deliveryList;


    event ProductCreated(uint256 productId, string name, uint256 price, uint quantity);
    event DistributionRequested(uint256 productId);
    event ProductShipped(uint256 productId);
    event ShippingStatusUpdated(uint256 productId, string newStatus);
    event ProductOrdered(uint256 productId, address orderedBy);
    event ProductReceived(uint256 productId, address receivedBy);
    event ProductListedForSale(uint256 productId, uint256 price, address listedBy);
    event ProductPurchased(uint256 productId, uint quantity, address purchasedBy);


    
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
        bool isNewProduct = manufacturerInventory[productId].quantity == 0;
        
        // Update the product information
        if (isNewProduct) {
            manufacturerInventory[productId] = Products(productId, name, price, quantity, false);
            // Add the new product ID to the tracking array
            ProductIds.push(productId);
        } else {
            manufacturerInventory[productId].quantity += quantity;
        }
        
        emit ProductCreated(productId, name, price, quantity);
    }


    // Function for a retailer to order a product from the manufacturer and pay for it
    function orderProduct(uint256 productId, uint256 quantity) public payable onlyRetailer {
        Products storage product = manufacturerInventory[productId];
        require(deliveryList[productId].quantity == 0, "You already have a shipment");
        require(product.quantity > 0, "Product is out of stock");
        require(product.quantity >= quantity, "Insufficient quantity in manufacturer's inventory");
        uint256 orderCost = product.price * quantity;
        require(msg.value >= orderCost, "Insufficient payment for the order");

        // Track the quantity ordered
        deliveryList[productId] = Delivery(productId, "ordered", quantity); 

        // Transfer payment to the manufacturer
        address payable manufacturer = payable(manufacturerAddress);
        manufacturer.transfer(orderCost);

        // Update the stock
        //product.quantity -= quantity;

        // If the retailer sent more Ether than the cost, refund the excess
        uint256 excessPayment = msg.value - orderCost;
        if (excessPayment > 0) {
            payable(msg.sender).transfer(excessPayment);
        }
        
        emit ProductOrdered(productId, msg.sender);
    }

    // Function for a manufacturer to reqest distribution
    function requestDistribution(uint256 productId, uint256 quantity) public onlyManufacturer {
        require(manufacturerInventory[productId].quantity >= quantity, "Insufficient quantity in manufacturer's inventory");
        require(keccak256(bytes(deliveryList[productId].status)) == keccak256(bytes("ordered")), "No order for the products");
        deliveryList[productId].status = "ready_for_shipment";
        emit DistributionRequested(productId);
    }

    // Logistic provider functions
    function shipProduct(uint256 productId, uint256 quantity) public onlyLogisticsProvider {
        Products storage product = manufacturerInventory[productId];
        require(keccak256(bytes(deliveryList[productId].status)) == keccak256(bytes("ready_for_shipment")), "Product is not ready for shipment");
        deliveryList[productId].status = "shipped";
        // Update the manufacturer's stock
        product.quantity -= quantity;        
        emit ProductShipped(productId);
    }

    // Function for a retailer to mark a product as received
    function receiveProduct(uint256 productId) public onlyRetailer {
        require(keccak256(bytes(deliveryList[productId].status)) == keccak256(bytes("shipped")), "Product has not been shipped");   
        deliveryList[productId].status = "received";

        // Update retailer inventory
        if (retailerInventory[productId].quantity > 0) {
            retailerInventory[productId].quantity += deliveryList[productId].quantity;
        } else{
            retailerInventory[productId] = Products(productId, manufacturerInventory[productId].name, manufacturerInventory[productId].price, deliveryList[productId].quantity, false);
        }
        
        // Clear the ordered quantity as the order has been fulfilled
        deliveryList[productId].quantity = 0;
        emit ProductReceived(productId, msg.sender);
    }

    // Function for a retailer to list a product for sale
    function listProductForSale(uint256 productId, uint256 price) public onlyRetailer {
        require(retailerInventory[productId].quantity > 0, "No item to list for sale");
        retailerInventory[productId].price = price;
        retailerInventory[productId].buyable = true;
        emit ProductListedForSale(productId, price, msg.sender);
    }

    // Function to verify the authenticity of a product before purchase
    function verifyProductAuthenticity(uint256 productId) public view returns (bool isAuthentic, bool isAvailableForPurchase, uint256 price) {
        Products memory product = retailerInventory[productId];
        // A product is considered authentic if it exists in the retailer's inventory
        isAuthentic = product.id != 0;
        // And it's available for purchase if 'buyable' is true
        isAvailableForPurchase = product.buyable;
        // Return the price as well for consumer's information
        price = product.price;
        return (isAuthentic, isAvailableForPurchase, price);
    }

    // Function for a consumer to purchase a product
    function purchaseProduct(uint256 productId, uint256 quantity) public onlyConsumer payable {
        Products storage product = retailerInventory[productId];
        require(product.buyable == true, "Product is not for sale");
        require(product.quantity >= quantity, "Not enough product available for purchase");
        uint256 totalCost = product.price * quantity;
        require(msg.value >= totalCost, "Insufficient payment");

        // Transfer payment to the retailer and refund any excess
        address payable seller = payable(retailerAddress);
        seller.transfer(totalCost);
        
        // Update the inventory after the purchase
        retailerInventory[productId].quantity -= quantity;

        // Update consumer purchase list
        if (consumerPurchases[msg.sender][productId].quantity > 0) {
            consumerPurchases[msg.sender][productId].quantity += quantity;
        } else{
            consumerPurchases[msg.sender][productId] = Products(productId, retailerInventory[productId].name, retailerInventory[productId].price, quantity, false);
        }
        
        // Refund any excess payment
        uint256 purchaseExcess = msg.value - totalCost;
        if (purchaseExcess > 0) {
            payable(msg.sender).transfer(purchaseExcess);
        }

        emit ProductPurchased(productId, quantity, msg.sender);
    }

    // Function to return all products in the manufacturer's inventory
    function getAllManufacturerProducts() public view returns (Products[] memory) {
        Products[] memory products = new Products[](ProductIds.length);
        for (uint i = 0; i < ProductIds.length; i++) {
            products[i] = manufacturerInventory[ProductIds[i]];
        }
        return products;
    }

    // Function to return all products in the retailer's inventory
    function getAllRetailerProducts() public view returns (Products[] memory) {
        Products[] memory products = new Products[](ProductIds.length);
        for (uint i = 0; i < ProductIds.length; i++) {
            products[i] = retailerInventory[ProductIds[i]];
        }
        return products;
    }

    // Function to return all deliveries corresponding to the manufacturer's product IDs
    function getAllDeliveries() public view returns (Delivery[] memory) {
        Delivery[] memory deliveries = new Delivery[](ProductIds.length);
        for (uint i = 0; i < ProductIds.length; i++) {
            deliveries[i] = deliveryList[ProductIds[i]];
        }
        return deliveries;
    }

    // Function to return all purchases made by a specific consumer
    function getAllConsumerPurchases(address consumer) public view returns (Products[] memory) {
        Products[] memory purchases = new Products[](ProductIds.length);
        
        for (uint i = 0; i < ProductIds.length; i++) {
            uint256 productId = ProductIds[i];
            // Attempt to fetch the purchase, if any
            Products storage product = consumerPurchases[consumer][productId];
            // If the product has not been purchased, quantity will be zero
            purchases[i] = product;
        }
        
        return purchases;
    }

}
