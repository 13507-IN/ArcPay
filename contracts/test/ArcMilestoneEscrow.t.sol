// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function warp(uint256 newTimestamp) external;
    function prank(address msgSender) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
    function expectRevert(bytes4 revertData) external;
}

import {ArcMilestoneEscrow} from "../src/ArcMilestoneEscrow.sol";

contract ArcMilestoneEscrowTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    ArcMilestoneEscrow public escrow;
    address public client = address(0x1111111111111111111111111111111111111111);
    address public freelancer = address(0x2222222222222222222222222222222222222222);

    uint256 public constant ONE_USDC = 1e18; // 18 decimals native USDC on Arc

    event MilestoneCreated(
        uint256 indexed id,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string title,
        uint256 deadline
    );

    function setUp() public {
        escrow = new ArcMilestoneEscrow();
        vm.deal(client, 1000 * ONE_USDC);
        vm.deal(freelancer, 10 * ONE_USDC);
    }

    function testCreateMilestone() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(client);
        uint256 id = escrow.createMilestone{value: 50 * ONE_USDC}(
            freelancer,
            "Build Frontend UI",
            deadline
        );

        assert(id == 1);
        ArcMilestoneEscrow.Milestone memory m = escrow.getMilestone(1);
        assert(m.client == client);
        assert(m.freelancer == freelancer);
        assert(m.amount == 50 * ONE_USDC);
        assert(m.status == ArcMilestoneEscrow.Status.Funded);
    }

    function testSubmitAndReleasePayment() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(client);
        uint256 id = escrow.createMilestone{value: 100 * ONE_USDC}(
            freelancer,
            "Design Tokenomics",
            deadline
        );

        vm.prank(freelancer);
        escrow.submitWork(id, "https://github.com/arcpay/tokenomics");

        uint256 freelancerBalBefore = freelancer.balance;
        vm.prank(client);
        escrow.releasePayment(id);

        assert(freelancer.balance == freelancerBalBefore + 100 * ONE_USDC);
        ArcMilestoneEscrow.Milestone memory m = escrow.getMilestone(id);
        assert(m.status == ArcMilestoneEscrow.Status.Released);
    }

    function testFreelancerRefund() public {
        uint256 deadline = block.timestamp + 1 days;
        vm.prank(client);
        uint256 id = escrow.createMilestone{value: 25 * ONE_USDC}(
            freelancer,
            "Quick Bug Fix",
            deadline
        );

        uint256 clientBalBefore = client.balance;
        vm.prank(freelancer);
        escrow.refundClient(id);

        assert(client.balance == clientBalBefore + 25 * ONE_USDC);
        ArcMilestoneEscrow.Milestone memory m = escrow.getMilestone(id);
        assert(m.status == ArcMilestoneEscrow.Status.Refunded);
    }
}
