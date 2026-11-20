// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface Vm {
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
    function envUint(string calldata name) external view returns (uint256);
}

import {ArcMilestoneEscrow} from "../contracts/ArcMilestoneEscrow.sol";

contract DeployArcMilestoneEscrow {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (ArcMilestoneEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        escrow = new ArcMilestoneEscrow();

        vm.stopBroadcast();
    }
}
