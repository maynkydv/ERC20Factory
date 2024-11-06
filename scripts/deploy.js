const { ethers } = require("hardhat");

async function main() {
    // Get the signer (deployer) address
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the ERC20Factory contract
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const erc20Token_implementation = await ERC20Token.deploy();
    await erc20Token_implementation.waitForDeployment();
    console.log("Deployed ERC20Token implementation contract:", erc20Token_implementation.target);


    const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    const erc20Factory = await ERC20Factory.deploy(erc20Token_implementation.target);
    await erc20Factory.waitForDeployment();
    console.log("ERC20Factory deployed to:", await erc20Factory.getAddress());

    // Specify token parameters for a test ERC20 token deployment
    const tokenName = "MyToken";
    const tokenSymbol = "MTK";
    const tokenTotalSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens with 18 decimals
    const salt = 12345; // Example salt for create2 deployment

    // Grant DEPLOYER_ROLE to the deployer if required (optional)
    const DEPLOYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPLOYER_ROLE"));
    // console.log(DEPLOYER_ROLE);
    // console.log(ethers.keccak256("DEPLOYER_ROLE"));

    await erc20Factory.grantRole(DEPLOYER_ROLE, deployer.address);
    console.log("DEPLOYER_ROLE granted to:", deployer.address);

    // Deploy the ERC20 token using the factory's `deployERC20` function
    const tx = await erc20Factory.deployERC20(tokenName, tokenSymbol, tokenTotalSupply, salt);
    const receipt = await tx.wait();
    
    // Retrieve the deployed token address from emitted events
    const erc20Address = receipt.logs[0].address;
    console.log(`ERC20 token deployed to: ${erc20Address}`);

    // Optional: check the initial balances of deployer and contract
    const deployedToken = await ethers.getContractAt("ERC20Token", erc20Address);
    const deployerBalance = await deployedToken.balanceOf(deployer.address);
    console.log("Deployer's token balance:", deployerBalance.toString());

    // await erc20Factory.withdraw(erc20Address);
    
    // const deployerBalanceAfterWithdrawal = await deployedToken.balanceOf(deployer.address);
    // console.log("Deployer's token balance:", deployerBalanceAfterWithdrawal.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
