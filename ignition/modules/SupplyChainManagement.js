const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const SupplyChainManagementModule = buildModule(
  "SupplyChainManagementModule",
  (m) => {
    const token = m.contract("SupplyChainManagement");

    return { token };
  }
);

module.exports = SupplyChainManagementModule;
