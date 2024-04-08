This is a [Vite](https://vitejs.dev) project bootstrapped
with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).

## EECE 571G Project Frontend

### Stack

- Language: TypeScript
- Build tool: Vite
- Framework: React
- Web3: wagmi
- Smart Contract: Hardhat
- UI Library: shadcn/ui
- Styling: Tailwind CSS

### Setup

1. Install dependencies

```bash
pnpm install
```

2. Start the development server

```bash
pnpm dev
```

3. Run local Hardhat node

```bash
cd ..
npx hardhat node
```

4. Deploy contracts

```bash
npx hardhat ignition deploy ./ignition/modules/SupplyChainManagement.js --network localhost
```

### Accounts

We used the following hardhat accounts for testing:

```
Admin Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Manufacturer Account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Logistic Account: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Retailer Account: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Consumer Account: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```
