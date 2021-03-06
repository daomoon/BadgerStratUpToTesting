// SPDX-License-Identifier: MIT

pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "../deps/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../deps/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "../deps/@openzeppelin/contracts-upgradeable/math/MathUpgradeable.sol";
import "../deps/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../deps/@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";

import "../interfaces/badger/IController.sol";

import "../interfaces/aave/ILendingPool.sol";
import "../interfaces/aave/IAaveIncentivesController.sol";
import "../interfaces/aave/IPriceOracleGetter.sol";

import "../interfaces/uniswap/ISwapRouter.sol";


import {
    BaseStrategy
} from "../deps/BaseStrategy.sol";

contract MyStrategy is BaseStrategy {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using SafeMathUpgradeable for uint256;

    // address public want // Inherited from BaseStrategy, the token the strategy wants, swaps into and tries to grow
    address public aToken; // Token we provide liquidity with
    address public reward; // Token we farm and swap to want / lpComponent

    address public constant PRICE_ORACLE = 0xA50ba011c48153De246E5192C8f9258A2ba79Ca9;
    address public constant LENDING_POOL = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    address public constant INCENTIVES_CONTROLLER = 0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5;
    address public constant ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant AAVE_TOKEN = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
    address public constant WETH_TOKEN = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    function initialize(
        address _governance,
        address _strategist,
        address _controller,
        address _keeper,
        address _guardian,
        address[3] memory _wantConfig,
        uint256[3] memory _feeConfig
    ) public initializer {
        __BaseStrategy_init(_governance, _strategist, _controller, _keeper, _guardian);

        /// @dev Add config here for GUSD
        want = _wantConfig[0];
        aToken = _wantConfig[1];
        reward = _wantConfig[2];

        performanceFeeGovernance = _feeConfig[0];
        performanceFeeStrategist = _feeConfig[1];
        withdrawalFee = _feeConfig[2];

        /// @dev do one off approvals here
        IERC20Upgradeable(want).safeApprove(LENDING_POOL, type(uint256).max);

        IERC20Upgradeable(reward).safeApprove(ROUTER, type(uint256).max);
        IERC20Upgradeable(AAVE_TOKEN).safeApprove(ROUTER, type(uint256).max);
        IERC20Upgradeable(USDC).safeApprove(ROUTER, type(uint256).max);

    }

    /// ===== View Functions =====

    // @dev Specify the name of the strategy
    function getName() external override pure returns (string memory) {
        return "wBTC-AAVE-Rewards";
    }

    // @dev Specify the version of the Strategy, for upgrades
    function version() external pure returns (string memory) {
        return "1.0";
    }

    /// @dev Balance of want currently held in strategy positions
    function balanceOfPool() public override view returns (uint256) {
        // aTokens
        return IERC20Upgradeable(aToken).balanceOf(address(this));
    }

    function balanceOfBorrow() public view returns (uint256) {
        //borrowed tokens
        return IERC20Upgradeable(USDC).balanceOf(address(this));
    }

    function getAccountData() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        (uint totalCollateralETH,
        uint totalDebtETH,
        uint availableBorrowsETH,
        uint currentLiquidationThreshold,
        uint ltv,
        uint healthFactor) = ILendingPool(LENDING_POOL).getUserAccountData(address(this));
        return (totalCollateralETH, totalDebtETH, availableBorrowsETH, currentLiquidationThreshold, ltv, healthFactor);

    }

    function getAvailableBorrows() public view returns (uint256) {
    ( , , uint256 available , , ,) = getAccountData();
        return available;
    }

    function getLtv() public view returns (uint256) {
    ( , , , , uint256 ltv , ) = getAccountData();
        return ltv;
    }

    function getPrice(address token) public view returns (uint256) {
        return IPriceOracleGetter(PRICE_ORACLE).getAssetPrice(token);

    }
    
    /// @dev Returns true if this strategy requires tending
    function isTendable() public override view returns (bool) {
        if (balanceOfWant() > 1000) {
            return true;
        } else {
            return false;
        }
    }

    // @dev These are the tokens that cannot be moved except by the vault
    function getProtectedTokens() public override view returns (address[] memory) {
        address[] memory protectedTokens = new address[](3);
        protectedTokens[0] = want;
        protectedTokens[1] = aToken;
        protectedTokens[2] = reward;
        return protectedTokens;
    }

    /// ===== Permissioned Actions: Governance =====
    /// @notice Delete if you don't need!
    function setKeepReward(uint256 _setKeepReward) external {
        _onlyGovernance();
    }

    /// ===== Internal Core Implementations =====

    /// @dev security check to avoid moving tokens that would cause a rugpull, edit based on strat
    function _onlyNotProtectedTokens(address _asset) internal override {
        address[] memory protectedTokens = getProtectedTokens();

        for(uint256 x = 0; x < protectedTokens.length; x++){
            require(address(protectedTokens[x]) != _asset, "Asset is protected");
        }
    }

    /// @dev invest the amount of want
    /// @notice When this function is called, the controller has already sent want to this
    /// @notice Just get the current balance and then invest accordingly
    function _deposit(uint256 _amount) internal override {
        ILendingPool(LENDING_POOL).deposit(want, _amount, address(this), 0);
    }

    /// @dev utility function to withdraw everything for migration
    function _withdrawAll() internal override {
        ILendingPool(LENDING_POOL).withdraw(want, balanceOfPool(), address(this));
    }
    /// @dev withdraw the specified amount of want, liquidate from lpComponent to want, paying off any necessary debt for the conversion
    function _withdrawSome(uint256 _amount) internal override returns (uint256) {

        if(_amount > balanceOfPool()) {
            _amount = balanceOfPool();
        }

        ILendingPool(LENDING_POOL).withdraw(want, _amount, address(this));

        return _amount;
    }

    // @dev Returns the maximum amount of _token that should be borrowed
    function getMaxBorrow(address _token) public view returns (uint256) {
        uint256 borrowLimit = getAvailableBorrows().mul(4).div(getPrice(_token).mul(5)).mul(10 ** 6);
        return borrowLimit;
    }

    // @dev Borrows the amount returned by getMaxBorrow
    function maxBorrow(address _token) external whenNotPaused {
        _onlyAuthorizedActors();
        ILendingPool(LENDING_POOL).borrow(_token, getMaxBorrow(_token), 2, 0, address(this));
    }

    // @dev Swaps from borrowed token to want, deposits and repeats until borrowed amount is too small
    // @dev This function is still missing getConfiguration() call from LendingPool to enable other non-GUSD tokens
    function leverage() external whenNotPaused {
        _onlyAuthorizedActors();
        if (getMaxBorrow(USDC) >= 2000) {

            uint256 _borrowedAmount = balanceOfBorrow();

            ISwapRouter.ExactInputSingleParams memory fromBorrowedToWantParams = ISwapRouter.ExactInputSingleParams(
                USDC,
                want,
                10000,
                address(this),
                now,
                _borrowedAmount,
                0,
                0
            );

            ISwapRouter(ROUTER).exactInputSingle(fromBorrowedToWantParams);

        } else {
            revert('Borrow limit reached!!!');
        }
    }

    function getBorrowedAmount() public view returns (uint256) {
        uint256 _borrowedAmount = IERC20Upgradeable(USDC).balanceOf(address(this));
        return _borrowedAmount;
    }

    /// @dev Harvest from strategy mechanics, realizing increase in underlying position
    function harvest() external whenNotPaused returns (uint256 harvested) {
        _onlyAuthorizedActors();


        uint256 _before = IERC20Upgradeable(want).balanceOf(address(this));

        // Figure out and claim our rewards
        address[] memory assets = new address[](1);
        assets[0] = aToken;

        IAaveIncentivesController(INCENTIVES_CONTROLLER).claimRewards(assets, type(uint256).max, address(this));

        uint256 rewardsAmount = IERC20Upgradeable(reward).balanceOf(address(this));

        if (rewardsAmount == 0) {
            return 0;
        }

        // Swap from stkAAVE to AAVE
        ISwapRouter.ExactInputSingleParams memory fromRewardToAAVEParams = ISwapRouter.ExactInputSingleParams(
            reward,
            AAVE_TOKEN,
            10000,
            address(this),
            now,
            rewardsAmount,
            0,
            0
        );

        ISwapRouter(ROUTER).exactInputSingle(fromRewardToAAVEParams);

        bytes memory path = abi.encodePacked(AAVE_TOKEN, uint24(10000), WETH_TOKEN, uint24(10000), want);
        ISwapRouter.ExactInputParams memory fromAAVETowBTCParams = ISwapRouter.ExactInputParams(
            path,
            address(this),
            now,
            IERC20Upgradeable(AAVE_TOKEN).balanceOf(address(this)),
            0
        );
        ISwapRouter(ROUTER).exactInput(fromAAVETowBTCParams);

        uint256 earned = IERC20Upgradeable(want).balanceOf(address(this)).sub(_before);

        /// @notice Keep this in so you get paid!
        (uint256 governancePerformanceFee, uint256 strategistPerformanceFee) = _processPerformanceFees(earned);

        /// @dev Harvest event that every strategy MUST have, see BaseStrategy
        emit Harvest(earned, block.number);

        return earned;
    }

    // Alternative Harvest with Price received from harvester, used to avoid exessive front-running
    // function harvest(uint256 price) external whenNotPaused returns (uint256 harvested) {
    //
    //   }

    /// @dev Rebalance, Compound or Pay off debt here
    function tend() external whenNotPaused {
        _onlyAuthorizedActors();

        if (balanceOfWant() > 0) {
            ILendingPool(LENDING_POOL).deposit(want, balanceOfWant(), address(this), 0);
        }
    }


    /// ===== Internal Helper Functions =====
    
    /// @dev used to manage the governance and strategist fee, make sure to use it to get paid!
    function _processPerformanceFees(uint256 _amount) internal returns (uint256 governancePerformanceFee, uint256 strategistPerformanceFee) {
        governancePerformanceFee = _processFee(want, _amount, performanceFeeGovernance, IController(controller).rewards());

        strategistPerformanceFee = _processFee(want, _amount, performanceFeeStrategist, strategist);
    }
}
