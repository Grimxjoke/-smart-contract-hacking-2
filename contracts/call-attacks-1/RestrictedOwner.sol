// SCH Course Copyright Policy (C): DO-NOT-SHARE-WITH-ANYONE
// https://smartcontractshacking.com/#copyright-policy
pragma solidity ^0.8.13;

import "hardhat/console.sol";

/**
 * @title RestrictedOwner
 * @author JohnnyTime (https://smartcontractshacking.com)
 *
 */
contract RestrictedOwner {
    address public owner;
    address public manager;
    address public unrestrictedOwnerAddress;

    constructor(address _unrestrictedOwnerAddress) {
        unrestrictedOwnerAddress = _unrestrictedOwnerAddress;
        owner = msg.sender;
        manager = msg.sender;
    }

    function updateSettings(address _newOwner, address _newManager) public {
        require(msg.sender == owner, "Not owner!");
        owner = _newOwner;
        manager = _newManager;
    }

    fallback() external {
        console.log("fallback is being call");
        (bool result, bytes memory data) = unrestrictedOwnerAddress
            .delegatecall(msg.data);

        console.log("data return is ", string(data));
        if (!result) {
            revert("failed");
        }

        console.log("Owner is ", owner);
    }
}
