const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const MANUFACTURER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const RETAILER = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

const SupplyChainManagementModule = buildModule(
  "SupplyChainManagementModule",
  (m) => {
    const manufacturer = m.getParameter("manufacturer", MANUFACTURER);
    const retailer = m.getParameter("retailer", RETAILER);
    const token = m.contract("SupplyChainManagement", [manufacturer, retailer]);

    return { token };
  }
);

module.exports = SupplyChainManagementModule;
