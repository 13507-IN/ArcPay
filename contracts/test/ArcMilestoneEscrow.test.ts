import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ArcMilestoneEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ArcMilestoneEscrow — Circle Arc Native Escrow", function () {
  let escrow: ArcMilestoneEscrow;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  // On Arc, native USDC uses 18 decimals for msg.value transfers
  const ONE_USDC = ethers.parseUnits("1.0", 18);
  const HUNDRED_USDC = ethers.parseUnits("100.0", 18);

  beforeEach(async function () {
    [client, freelancer, stranger] = await ethers.getSigners();

    const EscrowFactory = await ethers.getContractFactory("ArcMilestoneEscrow");
    escrow = await EscrowFactory.deploy();
    await escrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should initialize with 0 milestones", async function () {
      expect(await escrow.getMilestonesCount()).to.equal(0n);
    });
  });

  describe("createMilestone", function () {
    it("should create and fund a milestone using native USDC (18 decimals)", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + 86400; // 1 day in future
      const title = "Design Web3 Landing Page";

      const tx = await escrow
        .connect(client)
        .createMilestone(freelancer.address, title, deadline, {
          value: HUNDRED_USDC,
        });

      await expect(tx)
        .to.emit(escrow, "MilestoneCreated")
        .withArgs(1n, client.address, freelancer.address, HUNDRED_USDC, title, deadline);

      expect(await escrow.getMilestonesCount()).to.equal(1n);

      const m = await escrow.getMilestone(1n);
      expect(m.id).to.equal(1n);
      expect(m.client).to.equal(client.address);
      expect(m.freelancer).to.equal(freelancer.address);
      expect(m.amount).to.equal(HUNDRED_USDC);
      expect(m.title).to.equal(title);
      expect(m.deliverableIpfsOrUrl).to.equal("");
      expect(m.deadline).to.equal(BigInt(deadline));
      expect(m.status).to.equal(0n); // Status.Funded

      // Verify contract holds exact locked native USDC
      const contractBalance = await ethers.provider.getBalance(await escrow.getAddress());
      expect(contractBalance).to.equal(HUNDRED_USDC);

      // Verify index mappings
      const clientMilestones = await escrow.getClientMilestones(client.address);
      expect(clientMilestones).to.deep.equal([1n]);

      const freelancerMilestones = await escrow.getFreelancerMilestones(freelancer.address);
      expect(freelancerMilestones).to.deep.equal([1n]);
    });

    it("should revert if freelancer is address(0)", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createMilestone(ethers.ZeroAddress, "Test", deadline, {
          value: HUNDRED_USDC,
        })
      ).to.be.revertedWithCustomError(escrow, "InvalidFreelancerAddress");
    });

    it("should revert if client is own freelancer", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createMilestone(client.address, "Test", deadline, {
          value: HUNDRED_USDC,
        })
      ).to.be.revertedWithCustomError(escrow, "CannotBeOwnFreelancer");
    });

    it("should revert if msg.value is 0", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createMilestone(freelancer.address, "Test", deadline, {
          value: 0n,
        })
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
    });

    it("should revert if deadline is in the past", async function () {
      const pastDeadline = (await time.latest()) - 100;
      await expect(
        escrow.connect(client).createMilestone(freelancer.address, "Test", pastDeadline, {
          value: HUNDRED_USDC,
        })
      ).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
    });
  });

  describe("submitWork", function () {
    let deadline: number;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await escrow
        .connect(client)
        .createMilestone(freelancer.address, "Full Stack dApp", deadline, {
          value: HUNDRED_USDC,
        });
    });

    it("should allow freelancer to submit deliverable URL", async function () {
      const deliverable = "https://github.com/arcpay/deliverables/pr/42";

      const tx = await escrow
        .connect(freelancer)
        .submitWork(1n, deliverable);

      await expect(tx)
        .to.emit(escrow, "WorkSubmitted")
        .withArgs(1n, freelancer.address, deliverable);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(1n); // Status.Submitted
      expect(m.deliverableIpfsOrUrl).to.equal(deliverable);
    });

    it("should revert if caller is not the freelancer", async function () {
      await expect(
        escrow.connect(client).submitWork(1n, "https://github.com/arcpay")
      ).to.be.revertedWithCustomError(escrow, "OnlyFreelancer");

      await expect(
        escrow.connect(stranger).submitWork(1n, "https://github.com/arcpay")
      ).to.be.revertedWithCustomError(escrow, "OnlyFreelancer");
    });

    it("should revert if deliverable URL is empty", async function () {
      await expect(
        escrow.connect(freelancer).submitWork(1n, "")
      ).to.be.revertedWithCustomError(escrow, "EmptyDeliverableUrl");
    });

    it("should revert if status is not Funded (e.g. already submitted)", async function () {
      await escrow.connect(freelancer).submitWork(1n, "https://first-submit.com");
      await expect(
        escrow.connect(freelancer).submitWork(1n, "https://second-submit.com")
      ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneStatus");
    });
  });

  describe("releasePayment", function () {
    let deadline: number;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;
      await escrow
        .connect(client)
        .createMilestone(freelancer.address, "Smart Contract Audit", deadline, {
          value: HUNDRED_USDC,
        });
    });

    it("should allow client to release payment when status is Submitted", async function () {
      await escrow.connect(freelancer).submitWork(1n, "ipfs://QmAuditReport");

      const freelancerBalBefore = await ethers.provider.getBalance(freelancer.address);

      const tx = await escrow.connect(client).releasePayment(1n);

      await expect(tx)
        .to.emit(escrow, "PaymentReleased")
        .withArgs(1n, client.address, freelancer.address, HUNDRED_USDC);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(2n); // Status.Released

      const freelancerBalAfter = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerBalAfter - freelancerBalBefore).to.equal(HUNDRED_USDC);
    });

    it("should allow client to release payment early even before work is submitted (Funded)", async function () {
      const freelancerBalBefore = await ethers.provider.getBalance(freelancer.address);

      await escrow.connect(client).releasePayment(1n);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(2n); // Status.Released

      const freelancerBalAfter = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerBalAfter - freelancerBalBefore).to.equal(HUNDRED_USDC);
    });

    it("should revert if caller is not the client", async function () {
      await expect(
        escrow.connect(freelancer).releasePayment(1n)
      ).to.be.revertedWithCustomError(escrow, "OnlyClient");

      await expect(
        escrow.connect(stranger).releasePayment(1n)
      ).to.be.revertedWithCustomError(escrow, "OnlyClient");
    });

    it("should revert if milestone is already Released", async function () {
      await escrow.connect(client).releasePayment(1n);
      await expect(
        escrow.connect(client).releasePayment(1n)
      ).to.be.revertedWithCustomError(escrow, "InvalidMilestoneStatus");
    });
  });

  describe("refundClient", function () {
    let deadline: number;

    beforeEach(async function () {
      deadline = (await time.latest()) + 3600; // 1 hour deadline
      await escrow
        .connect(client)
        .createMilestone(freelancer.address, "Fast Prototype", deadline, {
          value: HUNDRED_USDC,
        });
    });

    it("should allow freelancer to voluntarily refund client at any time (Funded)", async function () {
      const clientBalBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrow.connect(freelancer).refundClient(1n);

      await expect(tx)
        .to.emit(escrow, "ClientRefunded")
        .withArgs(1n, client.address, freelancer.address, HUNDRED_USDC);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(4n); // Status.Refunded

      const clientBalAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalAfter - clientBalBefore).to.equal(HUNDRED_USDC);
    });

    it("should allow freelancer to voluntarily refund client even after work is Submitted", async function () {
      await escrow.connect(freelancer).submitWork(1n, "https://partial-work.com");

      const clientBalBefore = await ethers.provider.getBalance(client.address);
      await escrow.connect(freelancer).refundClient(1n);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(4n); // Status.Refunded

      const clientBalAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalAfter - clientBalBefore).to.equal(HUNDRED_USDC);
    });

    it("should allow client to refund if deadline has passed and work is still Funded (not submitted)", async function () {
      // Advance time past deadline
      await time.increaseTo(deadline + 10);

      const clientBalBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrow.connect(client).refundClient(1n);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx)
        .to.emit(escrow, "ClientRefunded")
        .withArgs(1n, client.address, client.address, HUNDRED_USDC);

      const m = await escrow.getMilestone(1n);
      expect(m.status).to.equal(4n); // Status.Refunded

      const clientBalAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalAfter + gasUsed - clientBalBefore).to.equal(HUNDRED_USDC);
    });

    it("should revert if client tries to refund before deadline has passed", async function () {
      await expect(
        escrow.connect(client).refundClient(1n)
      ).to.be.revertedWithCustomError(escrow, "UnauthorizedRefund");
    });

    it("should revert if client tries to refund after work has already been Submitted, even if past deadline", async function () {
      await escrow.connect(freelancer).submitWork(1n, "https://completed.com");
      await time.increaseTo(deadline + 100);

      // Client cannot unilaterally claw back after freelancer has submitted deliverables
      await expect(
        escrow.connect(client).refundClient(1n)
      ).to.be.revertedWithCustomError(escrow, "UnauthorizedRefund");
    });

    it("should revert if unauthorized stranger tries to refund", async function () {
      await time.increaseTo(deadline + 100);
      await expect(
        escrow.connect(stranger).refundClient(1n)
      ).to.be.revertedWithCustomError(escrow, "UnauthorizedRefund");
    });
  });

  describe("Pagination and Queries", function () {
    it("should support batch pagination", async function () {
      const now = await time.latest();
      for (let i = 1; i <= 3; i++) {
        await escrow
          .connect(client)
          .createMilestone(freelancer.address, `Milestone #${i}`, now + 1000 * i, {
            value: ONE_USDC * BigInt(i),
          });
      }

      expect(await escrow.getMilestonesCount()).to.equal(3n);

      const batch = await escrow.getMilestones(0n, 2n);
      expect(batch.length).to.equal(2);
      expect(batch[0].title).to.equal("Milestone #1");
      expect(batch[1].title).to.equal("Milestone #2");

      const remainingBatch = await escrow.getMilestones(2n, 5n);
      expect(remainingBatch.length).to.equal(1);
      expect(remainingBatch[0].title).to.equal("Milestone #3");
    });
  });
});
