// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgePool is Ownable {
    // address token
    IERC20 public token;

    constructor(address _tokenAddress, address _owner) Ownable(_owner) {
        token = IERC20(_tokenAddress);
    }

    /**
     *  Authorize allow MemBridge withdraw Token From BridgePool
     **/
    function authorizeBridge(address _memBridgeContract) external onlyOwner {
        token.approve(_memBridgeContract, type(uint256).max);
    }

    /**
     *      Allow owner set new token
     */
    function setToken(address _tokenAddress) external onlyOwner {
        token = IERC20(_tokenAddress);
    }

    /**
     *      Get balance token in contract
     */
    function balance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
