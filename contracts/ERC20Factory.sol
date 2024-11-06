// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ERC20Factory is AccessControl {
    using SafeERC20 for IERC20;

    // Role for deployer permission
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    /// @notice Enum representing different operational modes.
    enum Mode { None, FeeManager, ReferralManager }
    Mode public currentMode;
    address public immutable tokenImplementation;

    uint256 public constant FEE_MANAGER_PERCENTAGE = 3; // 0.0003% * total supply
    uint256 public constant REFERRAL_MANAGER_PERCENTAGE = 2; // 0.0002% * total supply
    uint256 public constant PERCENTAGE_DENOMINATOR = 1000000;

    // Mapping to keep track of withdrawable amounts for each token address
    mapping(address => uint256) public withdrawableAmounts;

    // Event for withdrawals
    event Withdraw(address indexed token, address indexed to, uint256 amount);

    // Event to log mode changes
    event ModeChanged(Mode newMode);

    // Event to log new ERC20 deployments
    event ERC20Deployed(address indexed tokenAddress, string name, string symbol, uint256 totalSupply, uint256 fee);

    /// @notice Initializes the contract, granting `msg.sender` admin and deployer roles.
    constructor(address _tokenImplementation) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);

        currentMode = Mode.None;
        tokenImplementation = _tokenImplementation;
    }

    /**
     * @notice Sets the mode of the contract to either `FeeManager` or `ReferralManager`.
     * @param mode The mode to set.
     * Requirements:
     * - Caller must have `DEFAULT_ADMIN_ROLE`.
     */
    function setMode(Mode mode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        currentMode = mode;
        emit ModeChanged(mode); // Emitting the mode change event
    }

    /**
     * @notice Deploys a new ERC20 token with the specified name, symbol, and total supply.
     * @param name The name of the new ERC20 token.
     * @param symbol The symbol of the new ERC20 token.
     * @param totalSupply The total supply of the new ERC20 token.
     * Requirements:
     * - Caller must have `DEPLOYER_ROLE`.
     */
    function deployERC20(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint _salt
    ) external onlyRole(DEPLOYER_ROLE) returns (address) {
        uint256 fee = 0;

        if (currentMode == Mode.FeeManager) {
            fee = (totalSupply * FEE_MANAGER_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        } else if (currentMode == Mode.ReferralManager) {
            fee = (totalSupply * REFERRAL_MANAGER_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        }

        bytes32 salt32 = bytes32(_salt);
        address newToken = Clones.cloneDeterministic(tokenImplementation, salt32);

        // Initialize the proxy (minimal proxy pattern typically requires initializer )
        ERC20Token(newToken).initialize(name, symbol, totalSupply, msg.sender, fee);

        emit ERC20Deployed(address(newToken), name, symbol, totalSupply,fee); // Emitting the ERC20 deployment event
        
        withdrawableAmounts[address(newToken)] = fee;
        return address(newToken);
    }


    /**
     * @notice Withdraws the specified amount of tokens from a given ERC20 contract address.
     * @param token The address of the ERC20 token contract.
     * Requirements:
     * - Caller must have `DEFAULT_ADMIN_ROLE`.
     */
    function withdraw(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = withdrawableAmounts[token];
        // require(amount > 0, "No withdrawable amount");

        // Cast the address to the IERC20Token interface
        ERC20Token(token).mintWithdrawableAmount(address(this), amount);
        withdrawableAmounts[token] = 0; // Reset withdrawable amount after withdrawal
        emit Withdraw(token, msg.sender, amount);
    }
}

contract ERC20Token is Initializable, ERC20Upgradeable{
    using SafeERC20 for IERC20;

    address public deployer_ ;
    // Event for safe token transfers
    event SafeTransfer(address indexed from, address indexed to, uint256 amount);

    /**
     * @notice Deploys a new ERC20 token with the specified name, symbol, and total supply, and mints a fee if specified.
     * @param name The name of the new ERC20 token.
     * @param symbol The symbol of the new ERC20 token.
     * @param totalSupply The total supply of the new ERC20 token.
     * @param deployer The address of the deployer who will initially own the total supply minus any fee.
     * @param fee amount depends upon the mode.
     */

    function initialize(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address deployer,
        uint256 fee
    ) external initializer {
        __ERC20_init(name, symbol);
        deployer_ = deployer;
        _mint(deployer, totalSupply - fee);
    }

    function mintWithdrawableAmount(address to, uint256 amount) external {
        require(to != address(0), "Invalid recipient address");
        _mint(to, amount);
    }


    /**
     * @notice Safely transfers `amount` tokens from the caller to `to`.
     * @param to The recipient of the transfer.
     * @param amount The amount of tokens to transfer.
     * Requirements:
     * - `to` cannot be the zero address.
     * - Caller must have a balance of at least `amount`.
     */
    function safeTransferFrom(address to, uint256 amount) external {
        require(to != address(0), "Invalid recipient address");

        IERC20(address(this)).safeTransferFrom(msg.sender, to, amount);
        emit SafeTransfer(msg.sender, to, amount); // Emitting the safe transfer event
    }
}

