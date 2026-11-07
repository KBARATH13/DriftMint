import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("AsusArmory Protocol Test Suite (/test/asusArmoryTest.js)", function () {
  let asusToken;
  let techGear;
  let armory;
  let owner;
  let user;

  const INITIAL_SUPPLY = hre.ethers.parseEther("1000000"); // 1,000,000 ASUS
  const FAUCET_RESERVE = hre.ethers.parseEther("100000");  // 100,000 ASUS
  const FIFTY_ASUS = hre.ethers.parseEther("50");
  const ONE_HUNDRED_ASUS = hre.ethers.parseEther("100");

  let laptopItemId;

  beforeEach(async function () {
    [owner, user] = await hre.ethers.getSigners();

    // 1. Deploy AsusToken
    const AsusTokenFactory = await hre.ethers.getContractFactory("AsusToken");
    asusToken = await AsusTokenFactory.deploy(owner.address, INITIAL_SUPPLY);
    await asusToken.waitForDeployment();

    // 2. Deploy AsusTechGear (ERC-721)
    const AsusTechGearFactory = await hre.ethers.getContractFactory("AsusTechGear");
    techGear = await AsusTechGearFactory.deploy(owner.address);
    await techGear.waitForDeployment();

    // 3. Deploy AsusArmory
    const AsusArmoryFactory = await hre.ethers.getContractFactory("AsusArmory");
    armory = await AsusArmoryFactory.deploy(
      owner.address,
      await asusToken.getAddress(),
      await techGear.getAddress()
    );
    await armory.waitForDeployment();

    // Grant AsusArmory contract minter role on AsusTechGear
    await techGear.setMinter(await armory.getAddress(), true);

    // Pre-fund AsusArmory with tokens for faucet claims
    await asusToken.transfer(await armory.getAddress(), FAUCET_RESERVE);

    // Add ROG Zephyrus G16 (Tier 3: Laptop, Cost: 100 ASUS, 0 = unlimited)
    const tx = await armory.addGearItem(
      "ROG Zephyrus G16",
      2, // HardwareTier.Laptop
      ONE_HUNDRED_ASUS,
      "data:application/json;base64,eyJuYW1lIjoiUk9HIFplcGh5cnVzIEcxNiJ9",
      0
    );
    const receipt = await tx.wait();
    laptopItemId = 0; // First item added in this test environment
  });

  // ----------------------------------------------------
  // a) User claims 50 ASUS tokens from faucet
  // ----------------------------------------------------
  it("a) User claims 50 ASUS tokens from faucet", async function () {
    const userBalanceBefore = await asusToken.balanceOf(user.address);
    expect(userBalanceBefore).to.equal(0n);

    // Check canClaim view helper
    const [canClaimBefore] = await armory.canClaimFaucet(user.address);
    expect(canClaimBefore).to.be.true;

    // User executes faucet claim
    const tx = await armory.connect(user).claimFaucet();
    await expect(tx)
      .to.emit(armory, "FaucetClaimed")
      .withArgs(user.address, FIFTY_ASUS, (t) => t > 0, (t) => t > 0);

    // Verify user balance incremented by exactly 50 ASUS
    const userBalanceAfter = await asusToken.balanceOf(user.address);
    expect(userBalanceAfter).to.equal(FIFTY_ASUS);
  });

  // ----------------------------------------------------
  // b) User cannot claim twice within 24 hours
  // ----------------------------------------------------
  it("b) User cannot claim twice within 24 hours (reverts with custom reason)", async function () {
    // First claim succeeds
    await armory.connect(user).claimFaucet();
    expect(await asusToken.balanceOf(user.address)).to.equal(FIFTY_ASUS);

    // Immediate second claim attempt MUST revert with 24-hour cooldown message
    await expect(armory.connect(user).claimFaucet()).to.be.revertedWith(
      "Faucet cooldown active. Please wait 24 hours between claims."
    );

    // Advance block timestamp by 23 hours (cooldown still active)
    await time.increase(23 * 3600);
    await expect(armory.connect(user).claimFaucet()).to.be.revertedWith(
      "Faucet cooldown active. Please wait 24 hours between claims."
    );

    // Advance time past 24 hours (+1 hour and 1 second) -> claim now succeeds
    await time.increase(1 * 3600 + 1);
    await expect(armory.connect(user).claimFaucet()).to.not.be.reverted;
    expect(await asusToken.balanceOf(user.address)).to.equal(hre.ethers.parseEther("100"));
  });

  // ----------------------------------------------------
  // c) User approves AsusArmory to spend their ASUS tokens and mints a Laptop NFT (Zephyrus G16)
  // ----------------------------------------------------
  it("c) User approves AsusArmory to spend their ASUS tokens and mints a Laptop NFT (Zephyrus G16)", async function () {
    // Fund user with 100 ASUS
    await asusToken.transfer(user.address, ONE_HUNDRED_ASUS);
    expect(await asusToken.balanceOf(user.address)).to.equal(ONE_HUNDRED_ASUS);

    const armoryAddress = await armory.getAddress();

    // 1. User approves AsusArmory for 100 ASUS
    await asusToken.connect(user).approve(armoryAddress, ONE_HUNDRED_ASUS);
    const allowance = await asusToken.allowance(user.address, armoryAddress);
    expect(allowance).to.equal(ONE_HUNDRED_ASUS);

    // 2. User mints the Zephyrus G16 Laptop NFT
    await expect(armory.connect(user).mintGear(laptopItemId))
      .to.emit(armory, "GearMinted")
      .withArgs(
        user.address,
        1, // First NFT tokenId
        laptopItemId,
        "ROG Zephyrus G16",
        2, // HardwareTier.Laptop
        ONE_HUNDRED_ASUS
      );

    // Verify token was minted with correct metadata URI
    expect(await techGear.ownerOf(1)).to.equal(user.address);
    expect(await techGear.tokenURI(1)).to.equal(
      "data:application/json;base64,eyJuYW1lIjoiUk9HIFplcGh5cnVzIEcxNiJ9"
    );
  });

  // ----------------------------------------------------
  // d) User ERC-20 balance decreases by 100 ASUS, and their ERC-721 NFT balance increases by 1
  // ----------------------------------------------------
  it("d) User ERC-20 balance decreases by 100 ASUS, and their ERC-721 NFT balance increases by 1", async function () {
    // Give user 150 ASUS total
    const initialUserAsus = hre.ethers.parseEther("150");
    await asusToken.transfer(user.address, initialUserAsus);

    const armoryAddress = await armory.getAddress();

    // Balances before mint
    const erc20Before = await asusToken.balanceOf(user.address);
    const erc721Before = await techGear.balanceOf(user.address);
    const totalSupplyBefore = await asusToken.totalSupply();

    expect(erc20Before).to.equal(initialUserAsus);
    expect(erc721Before).to.equal(0n);

    // Approve and mint
    await asusToken.connect(user).approve(armoryAddress, ONE_HUNDRED_ASUS);
    await armory.connect(user).mintGear(laptopItemId);

    // Balances after mint
    const erc20After = await asusToken.balanceOf(user.address);
    const erc721After = await techGear.balanceOf(user.address);
    const totalSupplyAfter = await asusToken.totalSupply();

    // 1. ERC-20 balance decreased by exactly 100 ASUS
    expect(erc20Before - erc20After).to.equal(ONE_HUNDRED_ASUS);
    expect(erc20After).to.equal(hre.ethers.parseEther("50"));

    // 2. Deflationary verification: 100 ASUS was burned from total supply
    expect(totalSupplyBefore - totalSupplyAfter).to.equal(ONE_HUNDRED_ASUS);

    // 3. ERC-721 NFT balance increased by exactly 1
    expect(erc721After - erc721Before).to.equal(1n);
    expect(erc721After).to.equal(1n);

    // User is the recorded owner of tokenId #1
    expect(await techGear.ownerOf(1)).to.equal(user.address);
  });
});

