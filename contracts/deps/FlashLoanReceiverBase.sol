// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.6.11;

import {SafeMath} from '../../deps/@openzeppelin/contracts/math/SafeMath.sol';
import {IERC20} from '../../deps/@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '../../deps/@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import {IFlashLoanReceiver} from '../../interfaces/aave/IFlashLoanReceiver.sol';
import {ILendingPoolAddressesProvider} from '../../interfaces/aave/ILendingPoolAddressesProvider.sol';
import {ILendingPool} from '../../interfaces/aave/ILendingPool.sol';

abstract contract FlashLoanReceiverBase is IFlashLoanReceiver {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ILendingPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
  ILendingPool public immutable override LENDING_POOL;

  constructor(ILendingPoolAddressesProvider provider) public {
    ADDRESSES_PROVIDER = provider;
    LENDING_POOL = ILendingPool(provider.getLendingPool());
  }
}