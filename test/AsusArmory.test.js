import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DripMint: ASUS ROG Hardware Armory Test Suite", function () {
  let asusToken;
  let techGear;
  let armory;
  let owner;
  let user1;
  let user2;

  const INITIAL_SUPPLY = hre.ethers.parseEther("1000000"); // 1,000,000 ASUS
  const FAUCET_FUNDING = hre.ethers.parseEther("50000");   // 50,000 ASUS

  // Sample items
  const SAMPLE_ITEMS = [
    {
      name: "ROG Phone 8 Pro",
      tier: 0, // MobileHandheld
      price: hre.ethers.parseEther("30"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIFBob25lIDggUHJvIn0="
    },
    {
      name: "ROG Ally X",
      tier: 0, // MobileHandheld
      price: hre.ethers.parseEther("30"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIEFsbHkgWCJ9"
    },
    {
      name: "ROG Swift OLED XG32",
      tier: 1, // Monitor
      price: hre.ethers.parseEther("50"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIFN3aWZ0IE9MRUQgWEczMiJ9"
    },
    {
      name: "ROG Strix 5K",
      tier: 1, // Monitor
      price: hre.ethers.parseEther("50"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIFN0cml4IDVLIn0="
    },
    {
      name: "ROG Zephyrus G16",
      tier: 2, // Laptop
      price: hre.ethers.parseEther("100"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIFplcGh5cnVzIEcxNiJ9"
    },
    {
      name: "ROG Strix SCAR 18",
      tier: 2, // Laptop
      price: hre.ethers.parseEther("100"),
      tokenURI: "data:application/json;base64,eyJuYW1lIjoiUk9HIFN0cml4IFNDQVIgMTgifQ=="
    }
  ];

  beforeEach(async function () {
    [owner, user1, user2] = await hre.ethers.getSigners();

    // 1. Deploy AsusToken
    const AsusTokenFactory = await hre.ethers.getContractFactory("AsusToken");
    asusToken = await AsusTokenFactory.deploy(owner.address, INITIAL_SUPPLY);
    await asusToken.waitForDeployment();

    // 2. Deploy AsusTechGear
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

    // 4. Authorize Armory contract as minter in TechGear NFT
    await techGear.setMinter(await armory.getAddress(), true);

    // 5. Fund Armory Faucet pool
    await asusToken.transfer(await armory.getAddress(), FAUCET_FUNDING);

    // 6. Populate 6 ROG Hardware Items (maxSupply = 0 for unlimited)
    for (const item of SAMPLE_ITEMS) {
      await armory.addGearItem(item.name, item.tier, item.price, item.tokenURI, 0);
    }
  });

  describe("Deployment & Configuration", function () {
    it("should deploy with correct initial token supply to deployer", async function () {
      const balance = await asusToken.balanceOf(owner.address);
      expect(balance).to.equal(INITIAL_SUPPLY - FAUCET_FUNDING);
      expect(await asusToken.name()).to.equal("ASUS Token");
      expect(await asusToken.symbol()).to.equal("ASUS");
    });

    it("should configure TechGear NFT with Armory as authorized minter", async function () {
      expect(await techGear.isMinter(await armory.getAddress())).to.be.true;
      expect(await techGear.name()).to.equal("ASUS ROG Gear");
      expect(await techGear.symbol()).to.equal("ROGGear");
    });

    it("should correctly populate all 6 gear items in Armory catalog", async function () {
      const catalog = await armory.getAllGearItems();
      expect(catalog.length).to.equal(6);
      expect(catalog[0].name).to.equal("ROG Phone 8 Pro");
      expect(catalog[0].price).to.equal(hre.ethers.parseEther("30"));
      expect(catalog[2].name).to.equal("ROG Swift OLED XG32");
      expect(catalog[2].price).to.equal(hre.ethers.parseEther("50"));
      expect(catalog[4].name).to.equal("ROG Zephyrus G16");
      expect(catalog[4].price).to.equal(hre.ethers.parseEther("100"));
    });
  });

  describe("ASUS Token Faucet (50 ASUS Claim & 24h Cooldown)", function () {
    it("should allow a new user to claim 50 ASUS tokens", async function () {
      const claimAmount = hre.ethers.parseEther("50");
      const [canClaimBefore] = await armory.canClaimFaucet(user1.address);
      expect(canClaimBefore).to.be.true;

      await expect(armory.connect(user1).claimFaucet())
        .to.emit(armory, "FaucetClaimed")
        .withArgs(user1.address, claimAmount, (val) => val > 0, (val) => val > 0);

      const balance = await asusToken.balanceOf(user1.address);
      expect(balance).to.equal(claimAmount);
    });

    it("should reject claim attempts while cooldown is active", async function () {
      await armory.connect(user1).claimFaucet();

      const [canClaim, remaining] = await armory.canClaimFaucet(user1.address);
      expect(canClaim).to.be.false;
      expect(remaining).to.be.greaterThan(0);

      await expect(armory.connect(user1).claimFaucet()).to.be.revertedWith(
        "Faucet cooldown active. Please wait 24 hours between claims."
      );
    });

    it("should allow user to claim again after 24 hours have elapsed", async function () {
      await armory.connect(user1).claimFaucet();
      expect(await asusToken.balanceOf(user1.address)).to.equal(hre.ethers.parseEther("50"));

      // Advance time by 24 hours + 1 second
      await time.increase(24 * 3600 + 1);

      const [canClaim] = await armory.canClaimFaucet(user1.address);
      expect(canClaim).to.be.true;

      await armory.connect(user1).claimFaucet();
      expect(await asusToken.balanceOf(user1.address)).to.equal(hre.ethers.parseEther("100"));
    });

    it("should prevent claims if faucet pool is empty", async function () {
      // Empty faucet pool
      const poolBalance = await asusToken.balanceOf(await armory.getAddress());
      await armory.emergencyWithdrawTokens(await asusToken.getAddress(), poolBalance);

      await expect(armory.connect(user1).claimFaucet()).to.be.revertedWith(
        "Faucet pool is empty. Please contact the Armory master."
      );
    });
  });

  describe("Spend-to-Mint (Hardware Armory Forge)", function () {
    beforeEach(async function () {
      // Give user1 200 ASUS for testing mints
      await asusToken.transfer(user1.address, hre.ethers.parseEther("200"));
    });

    it("should revert if user has not approved the Armory contract", async function () {
      await expect(armory.connect(user1).mintGear(0)).to.be.reverted;
    });

    it("should spend and burn 30 ASUS to mint Tier 1 (ROG Phone 8 Pro)", async function () {
      const price = hre.ethers.parseEther("30");
      await asusToken.connect(user1).approve(await armory.getAddress(), price);

      const userBalanceBefore = await asusToken.balanceOf(user1.address);
      const totalSupplyBefore = await asusToken.totalSupply();

      await expect(armory.connect(user1).mintGear(0))
        .to.emit(armory, "GearMinted")
        .withArgs(user1.address, 1, 0, "ROG Phone 8 Pro", 0, price);

      // Verify tokens were burned (deflationary)
      expect(await asusToken.balanceOf(user1.address)).to.equal(userBalanceBefore - price);
      expect(await asusToken.totalSupply()).to.equal(totalSupplyBefore - price);

      // Verify NFT ownership and metadata URI
      expect(await techGear.ownerOf(1)).to.equal(user1.address);
      expect(await techGear.tokenURI(1)).to.equal(SAMPLE_ITEMS[0].tokenURI);
    });

    it("should spend and burn 50 ASUS to mint Tier 2 (ROG Swift OLED XG32)", async function () {
      const price = hre.ethers.parseEther("50");
      await asusToken.connect(user1).approve(await armory.getAddress(), price);

      const userBalanceBefore = await asusToken.balanceOf(user1.address);

      await armory.connect(user1).mintGear(2);

      expect(await asusToken.balanceOf(user1.address)).to.equal(userBalanceBefore - price);
      expect(await techGear.ownerOf(1)).to.equal(user1.address);
      expect(await techGear.tokenURI(1)).to.equal(SAMPLE_ITEMS[2].tokenURI);
    });

    it("should spend and burn 100 ASUS to mint Tier 3 (ROG Zephyrus G16)", async function () {
      const price = hre.ethers.parseEther("100");
      await asusToken.connect(user1).approve(await armory.getAddress(), price);

      const userBalanceBefore = await asusToken.balanceOf(user1.address);

      await armory.connect(user1).mintGear(4);

      expect(await asusToken.balanceOf(user1.address)).to.equal(userBalanceBefore - price);
      expect(await techGear.ownerOf(1)).to.equal(user1.address);
      expect(await techGear.tokenURI(1)).to.equal(SAMPLE_ITEMS[4].tokenURI);
    });

    it("should fail if user has insufficient token balance", async function () {
      // user2 has 0 ASUS
      await asusToken.connect(user2).approve(await armory.getAddress(), hre.ethers.parseEther("30"));
      await expect(armory.connect(user2).mintGear(0)).to.be.reverted;
    });

    it("should revert if attempting to mint an out-of-stock / disabled item", async function () {
      await armory.setGearItemActive(0, false);
      await asusToken.connect(user1).approve(await armory.getAddress(), hre.ethers.parseEther("30"));

      await expect(armory.connect(user1).mintGear(0)).to.be.revertedWith(
        "Gear item is currently out of stock or disabled"
      );
    });

    it("should enforce max supply for 1-of-1 exclusive NFTs", async function () {
      // Add a 1-of-1 item
      const exclusiveItemId = await armory.getGearCatalogCount();
      await armory.addGearItem(
        "ROG 1-of-1 Founder Edition",
        0,
        hre.ethers.parseEther("30"),
        "data:application/json;base64,eyJuYW1lIjoiUk9HIEZvdW5kZXIifQ==",
        1 // maxSupply = 1 (1-of-1 exclusive)
      );

      const armoryAddr = await armory.getAddress();
      await asusToken.transfer(user2.address, hre.ethers.parseEther("100"));
      await asusToken.connect(user1).approve(armoryAddr, hre.ethers.parseEther("30"));
      await asusToken.connect(user2).approve(armoryAddr, hre.ethers.parseEther("30"));

      // User 1 mints the 1-of-1
      await armory.connect(user1).mintGear(exclusiveItemId);
      expect(await techGear.balanceOf(user1.address)).to.equal(1n);

      // User 2 attempts to mint the same 1-of-1 -> Reverts with sold out
      await expect(armory.connect(user2).mintGear(exclusiveItemId)).to.be.revertedWith(
        "Item sold out! Max supply reached."
      );
    });

    it("should revert for invalid gear item ID", async function () {
      await expect(armory.connect(user1).mintGear(999)).to.be.revertedWith(
        "Invalid gear item ID"
      );
    });
  });

  describe("Access Control & Security", function () {
    it("should prevent unauthorized accounts from minting NFTs directly", async function () {
      await expect(
        techGear.connect(user1).mintToUser(user1.address, "test-uri")
      ).to.be.revertedWith("Caller is not an authorized minter");
    });

    it("should prevent non-owners from updating faucet parameters", async function () {
      await expect(
        armory.connect(user1).configureFaucet(10, 100)
      ).to.be.reverted;
    });
  });
});

