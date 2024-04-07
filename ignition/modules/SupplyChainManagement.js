const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const MANUFACTURER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const LOGISTIC = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const RETAILER = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const CONSUMER = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";

const SupplyChainManagementModule = buildModule(
  "SupplyChainManagementModule",
  (m) => {
    const manufacturer = m.getParameter("manufacturer", MANUFACTURER);
    const retailer = m.getParameter("retailer", RETAILER);
    const logistic = m.getParameter("logistic", LOGISTIC);
    const consumer = m.getParameter("consumer", CONSUMER);
    const token = m.contract("SupplyChainManagement", [
      manufacturer,
      logistic,
      retailer,
      consumer,
    ]);

    return { token };
  }
);

module.exports = SupplyChainManagementModule;
