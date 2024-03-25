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
    /**
     * @dev Create a new product.
     * @param name Name of the product.
     * @param price Price of the product.
     */
    function createProduct(string memory name, uint256 price) public onlyManufacturer {
        uint256 productId = _nextProductId++;
        products[productId] = Product(productId, name, price, "created", msg.sender);
        emit ProductCreated(productId, name, price);
    }

    /**
     * @dev Request distribution for a product.
     * @param productId ID of the product.
     */
    function requestDistribution(uint256 productId) public onlyManufacturer {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("created")), "Product is not in 'created' state");
        products[productId].status = "ready_for_shipment";
        emit DistributionRequested(productId);
    }

    // Logistic provider functions
    function shipProduct(uint256 productId) public onlyLogisticsProvider {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("ready_for_shipment")), "Product is not ready for shipment");
        products[productId].status = "shipped";
        emit ProductShipped(productId);
    }

    function updateShippingStatus(uint256 productId, string memory newStatus) public onlyLogisticsProvider {
        require(keccak256(bytes(products[productId].status)) == keccak256(bytes("shipped")) ||
                keccak256(bytes(products[productId].status)) == keccak256(bytes("in_transit")), "Product is not shipped or in transit");
        products[productId].status = newStatus;
        emit ShippingStatusUpdated(productId, newStatus);
    }

    // Function for a retailer to order a product from the manufacturer
    // Assuming an order process where the retailer confirms the intention to receive the product
    function orderProduct(uint256 productId) public onlyRetailer {
        Product storage product = products[productId];
        require(keccak256(bytes(product.status)) == keccak256(bytes("ready_for_shipment")), "Product is not ready for shipment");
        product.status = "ordered";
        emit ProductOrdered(productId, msg.sender);
    }

    // Function for a retailer to mark a product as received
    function receiveProduct(uint256 productId) public onlyRetailer {
        Product storage product = products[productId];
        require(keccak256(bytes(product.status)) == keccak256(bytes("shipped")), "Product has not been shipped");
        product.status = "received";
        product.currentOwner = msg.sender; // Transfer ownership to the retailer
        emit ProductReceived(productId, msg.sender);
    }

    // Function for a retailer to list a product for sale
    function listProductForSale(uint256 productId, uint256 price) public onlyRetailer {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Caller does not own the product");
        require(keccak256(bytes(product.status)) == keccak256(bytes("received")), "Product is not received");
        product.price = price;
        product.status = "for_sale";
        emit ProductListedForSale(productId, price, msg.sender);
    }

    // Function for a consumer to purchase a product
    function purchaseProduct(uint256 productId) public onlyConsumer payable {
    Product storage product = products[productId];
    require(keccak256(bytes(product.status)) == keccak256(bytes("for_sale")), "Product is not for sale");
    require(msg.value >= product.price, "Insufficient payment");
    require(product.currentOwner != address(0), "Owner invalid");
    address seller = product.currentOwner;
    payable(seller).transfer(product.price);
    product.currentOwner = msg.sender;
    product.status = "sold";
    emit ProductPurchased(productId, msg.sender);
    }

}
