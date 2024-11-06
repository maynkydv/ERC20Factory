const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const ZERO_ADDRESS = ethers.ZeroAddress;

describe("ERC20Factory - ", function () {
  async function deployERC20FactoryFixture() {
    const [erc20FactoryOwner, user1, user2, user3] = await ethers.getSigners();

    const ERC20Implementation = await ethers.getContractFactory("ERC20Token");
    erc20Implementation = await ERC20Implementation.connect(erc20FactoryOwner).deploy();
    await erc20Implementation.waitForDeployment();

    const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    erc20FactoryContract = await ERC20Factory.connect(erc20FactoryOwner).deploy(erc20Implementation.target);
    await erc20FactoryContract.waitForDeployment();

    const DEPLOYER_ROLE = erc20FactoryContract.DEPLOYER_ROLE();
    const DEFAULT_ADMIN_ROLE = erc20FactoryContract.DEFAULT_ADMIN_ROLE();

    return { DEFAULT_ADMIN_ROLE, DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1, user2, user3 };
  }

  it("should deploy correctly with initial role definations", async function () {
    const { DEFAULT_ADMIN_ROLE, DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner } = await loadFixture(deployERC20FactoryFixture);

    expect(
      await erc20FactoryContract.connect(erc20FactoryOwner).hasRole(DEFAULT_ADMIN_ROLE, erc20FactoryOwner.address)
    ).to.equal(true);


    expect(
      await erc20FactoryContract.connect(erc20FactoryOwner).hasRole(DEPLOYER_ROLE, erc20FactoryOwner.address)
    ).to.equal(true);
  });

  it("should grand DEVELOPER_ROLE correctly to user1", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1 } = await loadFixture(deployERC20FactoryFixture);
    expect(
      await erc20FactoryContract.connect(user1).hasRole(DEPLOYER_ROLE, user1.address)
    ).to.equal(false);

    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    expect(
      await erc20FactoryContract.connect(user1).hasRole(DEPLOYER_ROLE, user1.address)
    ).to.equal(true);
  });



  it("ADMIN should able to change the Mode", async function () {
    const { erc20FactoryContract, erc20FactoryOwner } = await loadFixture(deployERC20FactoryFixture);

    await erc20FactoryContract.connect(erc20FactoryOwner).setMode(1);

    expect(
      await erc20FactoryContract.connect(erc20FactoryOwner).currentMode()
    ).to.equal(1);
  });

  it("user1 with DEVELOPER_ROLE should able to deploy MODE-FeeManager", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1 } = await loadFixture(deployERC20FactoryFixture);
    const FEE_MANAGER_PERCENTAGE = 3;
    // const REFERRAL_MANAGER_PERCENTAGE = 2; // 0.0002% * total supply
    const PERCENTAGE_DENOMINATOR = 1000000;

    // mode changed to FeeManager
    await erc20FactoryContract.connect(erc20FactoryOwner).setMode(1);

    // changed user1 Role to DEPLOYER_ROLE
    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    const totalSupply = 1000000;
    // const newDeployedERC20 = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1","ERT", 10000);
    const fee = (totalSupply * FEE_MANAGER_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
    //300000/1000000   == 0.3
    // Capture the returned address from deployERC20

    const tx = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1", "ERT", totalSupply, 2);
    const receipt = await tx.wait();
    // console.log(receipt.logs[0].address);
    const deployedTokenAddress = receipt.logs[0].address; // Get the address from logs

    // Initialize the deployed token as a contract instance
    const newDeployedERC20 = await ethers.getContractAt("ERC20Token", deployedTokenAddress);

    expect(
      await newDeployedERC20.connect(user1).balanceOf(user1)
    ).to.equal(totalSupply - Math.floor(fee));
  });

  it("user1 with REFERRAL_MANAGER_PERCENTAGE should able to deploy MODE-FeeManager", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1 } = await loadFixture(deployERC20FactoryFixture);
    const REFERRAL_MANAGER_PERCENTAGE = 2; // 0.0002% * total supply
    const PERCENTAGE_DENOMINATOR = 1000000;

    // mode changed to FeeManager
    await erc20FactoryContract.connect(erc20FactoryOwner).setMode(2);

    // changed user1 Role to DEPLOYER_ROLE
    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    const totalSupply = 1000000;
    // const newDeployedERC20 = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1","ERT", 10000);
    const fee = (totalSupply * REFERRAL_MANAGER_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
    //300000/1000000   == 0.3
    // Capture the returned address from deployERC20

    const tx = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1", "ERT", totalSupply, 2);
    const receipt = await tx.wait();
    // console.log(receipt.logs[0].address);
    const deployedTokenAddress = receipt.logs[0].address; // Get the address from logs

    // Initialize the deployed token as a contract instance
    const newDeployedERC20 = await ethers.getContractAt("ERC20Token", deployedTokenAddress);

    expect(
      await newDeployedERC20.connect(user1).balanceOf(user1)
    ).to.equal(totalSupply - Math.floor(fee));
  });

  it("user1 should safeTransfer to user2 ", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1, user2 } = await loadFixture(deployERC20FactoryFixture);
    // mode changed to FeeManager
    await erc20FactoryContract.connect(erc20FactoryOwner).setMode(0);

    // changed user1 Role to DEPLOYER_ROLE
    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    const totalSupply = 1000000;

    const tx = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1", "ERT", totalSupply, 2);
    const receipt = await tx.wait();
    // console.log(receipt.logs[0].address);
    const deployedTokenAddress = receipt.logs[0].address; // Get the address from logs

    // Initialize the deployed token as a contract instance
    const newDeployedERC20 = await ethers.getContractAt("ERC20Token", deployedTokenAddress);

    await newDeployedERC20.connect(user1).approve(newDeployedERC20, 1000);
    expect(
      await newDeployedERC20.connect(user1).balanceOf(user1)
    ).to.equal(totalSupply);

    expect(
      await newDeployedERC20.connect(user1).safeTransferFrom(user2, 1000)
    ).to.changeTokenBalances(newDeployedERC20, [user1, user2], [-1000, 1000]);
  });

  it("should revert when trying to transfer to address(0)", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1 } = await loadFixture(deployERC20FactoryFixture);

    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    const totalSupply = 1000000;
    const tx = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1", "ERT", totalSupply, 2);
    const receipt = await tx.wait();
    const deployedTokenAddress = receipt.logs[0].address;
    const newDeployedERC20 = await ethers.getContractAt("ERC20Token", deployedTokenAddress);

    await expect(newDeployedERC20.connect(user1).safeTransferFrom(ZERO_ADDRESS, 1000)).to.be.revertedWith("Invalid recipient address");
  });

  it("should revert with AccessControlUnauthorizedAccount error when non-admin tries to set mode", async function () {
    const { DEFAULT_ADMIN_ROLE, erc20FactoryContract, user1 } = await loadFixture(deployERC20FactoryFixture);

    const modeToSet = 1; // Replace with actual mode value if needed
    // Check that user1 does not have the DEFAULT_ADMIN_ROLE
    expect(await erc20FactoryContract.hasRole(DEFAULT_ADMIN_ROLE, user1.address)).to.be.false;

    // Attempt to call setMode from user1
    await expect(
      erc20FactoryContract.connect(user1).setMode(modeToSet)
    ).to.be.revertedWithCustomError(
      erc20FactoryContract,
      "AccessControlUnauthorizedAccount"
    ).withArgs(user1.address, DEFAULT_ADMIN_ROLE);
  });

  it("should revert if non-deployer tries to deploy ERC20 token", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, user1 } = await loadFixture(deployERC20FactoryFixture);

    const totalSupply = 100000;
    const salt = 1;

    await expect(
      erc20FactoryContract.connect(user1).deployERC20("TestToken1", "TTK", totalSupply, salt)
    ).to.be.revertedWithCustomError(
      erc20FactoryContract,
      "AccessControlUnauthorizedAccount"
    ).withArgs(user1.address, DEPLOYER_ROLE);
  });


  it("should withdraw the correct amount of tokens", async function () {
    const { DEPLOYER_ROLE, erc20FactoryContract, erc20FactoryOwner, user1 } = await loadFixture(deployERC20FactoryFixture);
    const REFERRAL_MANAGER_PERCENTAGE = 2; // 0.0002% * total supply
    const PERCENTAGE_DENOMINATOR = 1000000;

    await erc20FactoryContract.connect(erc20FactoryOwner).setMode(2);
    await erc20FactoryContract.connect(erc20FactoryOwner).grantRole(DEPLOYER_ROLE, user1.address);

    const totalSupply = 1000000000;
    const fee = Math.floor((totalSupply * REFERRAL_MANAGER_PERCENTAGE) / PERCENTAGE_DENOMINATOR);

    const tx = await erc20FactoryContract.connect(user1).deployERC20("ERC20Token1", "ERT", totalSupply, 2);
    const receipt = await tx.wait();
    const deployedTokenAddress = receipt.logs[0].address; // Get the address from logs

    // Initialize the deployed token as a contract instance
    const newDeployedERC20 = await ethers.getContractAt("ERC20Token", deployedTokenAddress);

    await erc20FactoryContract.connect(erc20FactoryOwner).withdraw(deployedTokenAddress)

    

    expect(
      await newDeployedERC20.balanceOf(erc20FactoryContract)
    ).to.equal(fee);

    expect(
      await erc20FactoryContract.connect(erc20FactoryOwner).withdraw(deployedTokenAddress)
    ).to.be.revertedWith("No withdrawable amount");

  });
});
