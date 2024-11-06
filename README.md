# ERC20Factory
# ERC20 Factory and Token Deployment

This project implements an ERC20 Factory that deploys custom ERC20 tokens with configurable `FeeManager` and `ReferralManager` modes. Each mode determines a deployment fee that is minted to the factory upon creation. The contract leverages OpenZeppelin libraries for security and utilizes Hardhat for testing and deployment.

## Project Structure
- **ERC20Factory**: Manages deployment of ERC20 tokens and controls modes for setting fees.
- **ERC20Token**: The ERC20 token contract with `safeTransferFrom` and withdraw functionality.

### Key Features
- **Modes**: Allows setting operational modes (`FeeManager` or `ReferralManager`) for the factory, adjusting fees based on mode.
- **Safe Transfers**: Tokens are safely transferred using OpenZeppelin’s `SafeERC20` utilities.
- **Controlled Withdrawals**: Only admins can withdraw accumulated fees from token contracts.
- **Custom Token Creation**: Deploys ERC20 tokens with a specified total supply, name, and symbol via `CREATE2` for deterministic addresses.

---

## Prerequisites

Ensure the following are installed:
- [Node.js & npm](https://nodejs.org/)
- [Hardhat](https://hardhat.org/): `npm install --save-dev hardhat`
- OpenZeppelin Contracts: `npm install @openzeppelin/contracts`

## Installation

Clone this repository and install dependencies:

```bash
git clone <repo-url>
cd <repo-folder>
npm install
```

## Contract Overview

1. **ERC20Factory**:
   - **Modes**: Uses an enum to set modes (`FeeManager` and `ReferralManager`) with different fee percentages.
   - **Role-based Access**: Uses OpenZeppelin's `AccessControl` for `DEPLOYER_ROLE` and `DEFAULT_ADMIN_ROLE`.
   - **Deploying Tokens**: Deploys tokens using `CREATE2`, with unique salts ensuring deterministic deployment addresses.
   - **Withdrawals**: Allows admins to withdraw fees from tokens.

2. **ERC20Token**:
   - **Minting**: Mints a specified total supply, minus the fee.
   - **safeTransferFrom**: Ensures safe transfer of tokens using `SafeERC20`.
   - **mintWithdrawableAmount**: Allows the factory to mint and withdraw fees after deployment.

## Usage

### Setting the Mode

Set the contract mode to either `FeeManager` or `ReferralManager` for fee calculations. Only admins can call this function.

```solidity
factory.setMode(Mode.FeeManager);
```

### Deploying a New ERC20 Token

Deploy a new ERC20 token by calling `deployERC20`. Only users with `DEPLOYER_ROLE` can perform this operation.

```solidity
factory.deployERC20("MyToken", "MTK", 1000000, _salt);
```

### Withdrawing Fees

Admins can withdraw accumulated fees from the factory.

```solidity
factory.withdraw(tokenAddress);
```

## Commands

### 1. Compile Contracts

Use Hardhat to compile the contracts.

```bash
npx hardhat compile
```

### 2. Run Tests

Run the test suite to verify the contract functionality.

```bash
npx hardhat test
```

### 3. Coverage Report

To generate a test coverage report, use the `hardhat-coverage` plugin.

1. Install `hardhat-coverage`:

   ```bash
   npm install --save-dev solidity-coverage
   ```

2. Run the coverage command:

   ```bash
   npx hardhat coverage
   ```

### 4. Debugging with Hardhat Console

Use the Hardhat console to interact with contracts directly.

```bash
npx hardhat console
```

### 5. Deployment of the Contracts


Run the script:

```bash
npx hardhat run scripts/deploy.js --network <network>
```

---

## Additional Notes

1. **Setting Up `.env` for Private Keys**: Store sensitive information, like private keys, in an `.env` file for secure deployment on public networks.
   - **INFURA_API_KEY=**
   - **EPOLIA_PRIVATE_KEY=**
   - **ETHERSCAN_API_KEY=**


2. **Improving Tests**: Extend the test suite to cover edge cases and revert conditions.
3. **Project Extensions**:
   - **Readme Improvements**: Add more detailed usage examples and contract details.
   - **Approval Workflow**: Add a workflow for approving factory operations before deployment.
