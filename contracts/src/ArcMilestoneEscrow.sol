// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArcMilestoneEscrow
 * @author ArcPay Team
 * @notice Global Freelance Milestone Escrow & Instant USDC Payroll platform
 *         built natively on Circle's Arc Layer-1 Testnet (Chain ID: 5042002).
 * @dev On Arc, native USDC uses 18 decimals when transferred via msg.value or read
 *      via getBalance (unlike the wrapped ERC-20 6-decimal interface).
 *      All native gas and payments in this escrow operate directly in 18-decimal native USDC.
 */
contract ArcMilestoneEscrow is ReentrancyGuard {
    // --- Enums & Structs ---

    enum Status {
        Funded,
        Submitted,
        Released,
        Disputed,
        Refunded
    }

    struct Milestone {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount; // 18-decimal native USDC
        string title;
        string deliverableIpfsOrUrl;
        uint256 deadline;
        Status status;
        uint256 createdAt;
    }

    // --- State Variables ---

    uint256 private _milestoneIdCounter;
    mapping(uint256 => Milestone) public milestones;
    mapping(address => uint256[]) private _clientMilestones;
    mapping(address => uint256[]) private _freelancerMilestones;

    // --- Custom Errors ---

    error MilestoneNotFound(uint256 id);
    error InvalidFreelancerAddress();
    error CannotBeOwnFreelancer();
    error ZeroAmount();
    error InvalidDeadline();
    error OnlyFreelancer();
    error OnlyClient();
    error InvalidMilestoneStatus(Status currentStatus);
    error UnauthorizedRefund();
    error NativeTransferFailed();
    error EmptyDeliverableUrl();

    // --- Events ---

    event MilestoneCreated(
        uint256 indexed id,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string title,
        uint256 deadline
    );

    event WorkSubmitted(
        uint256 indexed id,
        address indexed freelancer,
        string deliverableUrl
    );

    event PaymentReleased(
        uint256 indexed id,
        address indexed client,
        address indexed freelancer,
        uint256 amount
    );

    event ClientRefunded(
        uint256 indexed id,
        address indexed client,
        address indexed refundedBy,
        uint256 amount
    );

    // --- Modifiers ---

    modifier milestoneExists(uint256 _id) {
        if (_id == 0 || _id > _milestoneIdCounter) {
            revert MilestoneNotFound(_id);
        }
        _;
    }

    // --- External Functions ---

    /**
     * @notice Creates and funds a new milestone escrow using native 18-decimal USDC.
     * @param _freelancer Address of the freelance contributor receiving payment.
     * @param _title Title of the milestone work package.
     * @param _deadline Unix timestamp representing the milestone completion deadline.
     * @return id The unique identifier of the newly created milestone.
     */
    function createMilestone(
        address _freelancer,
        string calldata _title,
        uint256 _deadline
    ) external payable returns (uint256) {
        if (_freelancer == address(0)) revert InvalidFreelancerAddress();
        if (_freelancer == msg.sender) revert CannotBeOwnFreelancer();
        if (msg.value == 0) revert ZeroAmount();
        if (_deadline <= block.timestamp) revert InvalidDeadline();

        unchecked {
            ++_milestoneIdCounter;
        }
        uint256 newId = _milestoneIdCounter;

        milestones[newId] = Milestone({
            id: newId,
            client: msg.sender,
            freelancer: _freelancer,
            amount: msg.value,
            title: _title,
            deliverableIpfsOrUrl: "",
            deadline: _deadline,
            status: Status.Funded,
            createdAt: block.timestamp
        });

        _clientMilestones[msg.sender].push(newId);
        _freelancerMilestones[_freelancer].push(newId);

        emit MilestoneCreated(
            newId,
            msg.sender,
            _freelancer,
            msg.value,
            _title,
            _deadline
        );

        return newId;
    }

    /**
     * @notice Submits deliverable link or IPFS CID for a funded milestone.
     * @dev Only callable by the designated freelancer while milestone is in Funded state.
     * @param _id Milestone ID.
     * @param _deliverableUrl URL or IPFS CID pointing to submitted proof of work.
     */
    function submitWork(
        uint256 _id,
        string calldata _deliverableUrl
    ) external milestoneExists(_id) {
        Milestone storage m = milestones[_id];

        if (msg.sender != m.freelancer) revert OnlyFreelancer();
        if (m.status != Status.Funded) revert InvalidMilestoneStatus(m.status);
        if (bytes(_deliverableUrl).length == 0) revert EmptyDeliverableUrl();

        m.deliverableIpfsOrUrl = _deliverableUrl;
        m.status = Status.Submitted;

        emit WorkSubmitted(_id, msg.sender, _deliverableUrl);
    }

    /**
     * @notice Releases native USDC payment to freelancer upon client approval.
     * @dev Only callable by client when status is Funded or Submitted.
     * @param _id Milestone ID.
     */
    function releasePayment(
        uint256 _id
    ) external nonReentrant milestoneExists(_id) {
        Milestone storage m = milestones[_id];

        if (msg.sender != m.client) revert OnlyClient();
        if (m.status != Status.Funded && m.status != Status.Submitted) {
            revert InvalidMilestoneStatus(m.status);
        }

        uint256 payoutAmount = m.amount;
        address payable freelancerRecipient = payable(m.freelancer);

        m.status = Status.Released;

        (bool sent, ) = freelancerRecipient.call{value: payoutAmount}("");
        if (!sent) revert NativeTransferFailed();

        emit PaymentReleased(_id, m.client, freelancerRecipient, payoutAmount);
    }

    /**
     * @notice Refunds locked native USDC back to the client.
     * @dev Conditions:
     *      1. Freelancer can trigger voluntary refund at any time while Funded or Submitted.
     *      2. Client can trigger refund if block.timestamp > deadline and work has NOT yet been submitted (Funded).
     * @param _id Milestone ID.
     */
    function refundClient(
        uint256 _id
    ) external nonReentrant milestoneExists(_id) {
        Milestone storage m = milestones[_id];

        bool isFreelancerRefund = (msg.sender == m.freelancer &&
            (m.status == Status.Funded || m.status == Status.Submitted));

        bool isClientExpiredRefund = (msg.sender == m.client &&
            m.status == Status.Funded &&
            block.timestamp > m.deadline);

        if (!isFreelancerRefund && !isClientExpiredRefund) {
            revert UnauthorizedRefund();
        }

        uint256 refundAmount = m.amount;
        address payable clientRecipient = payable(m.client);

        m.status = Status.Refunded;

        (bool sent, ) = clientRecipient.call{value: refundAmount}("");
        if (!sent) revert NativeTransferFailed();

        emit ClientRefunded(_id, clientRecipient, msg.sender, refundAmount);
    }

    // --- View Functions ---

    /**
     * @notice Returns total number of milestones created.
     */
    function getMilestonesCount() external view returns (uint256) {
        return _milestoneIdCounter;
    }

    /**
     * @notice Fetches milestone details by ID.
     */
    function getMilestone(
        uint256 _id
    ) external view milestoneExists(_id) returns (Milestone memory) {
        return milestones[_id];
    }

    /**
     * @notice Returns all milestone IDs created by a given client.
     */
    function getClientMilestones(
        address _client
    ) external view returns (uint256[] memory) {
        return _clientMilestones[_client];
    }

    /**
     * @notice Returns all milestone IDs assigned to a given freelancer.
     */
    function getFreelancerMilestones(
        address _freelancer
    ) external view returns (uint256[] memory) {
        return _freelancerMilestones[_freelancer];
    }

    /**
     * @notice Batch pagination query for milestones.
     */
    function getMilestones(
        uint256 _offset,
        uint256 _limit
    ) external view returns (Milestone[] memory) {
        uint256 total = _milestoneIdCounter;
        if (_offset >= total) {
            return new Milestone[](0);
        }

        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }

        uint256 length = end - _offset;
        Milestone[] memory batch = new Milestone[](length);

        for (uint256 i = 0; i < length; ) {
            // Milestone IDs are 1-indexed: offset 0 => ID 1
            batch[i] = milestones[_offset + i + 1];
            unchecked {
                ++i;
            }
        }

        return batch;
    }

    /**
     * @notice Fallback to receive native funds if necessary.
     */
    receive() external payable {}
}
