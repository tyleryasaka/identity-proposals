pragma solidity ^0.4.24;

interface ERCXXXX_Identity {
    event Executed(address to, uint256 value, bytes data);

    function owner() external view returns(address);
    function transferOwnership(address newOwner) external;
    function execute(address to, uint256 value, bytes data) external;
}

interface ERCXXXX_IdentityManager {
    event RoleAdded(address actor, uint256 level);
    event RoleRemoved(address actor);

    function hasRole(address actor, uint256 level) external view returns(bool);
    function addRole(address actor, uint256 level) external;
    function addRoleSigned(address actor, uint256 level, uint256 expiry, bytes signatures) external;
    function removeRole(address actor) external;
    function removeRoleSigned(address actor, uint256 expiry, bytes signatures) external;
    function execute(address to, uint256 value, bytes data) external;
    function executeSigned(address to, uint256 value, bytes data, uint256 expiry, bytes signatures) external;
    function getNonce(bytes32 nonceKey) external view returns (uint256);
    function getRequiredSignatures(uint256 level) external view returns (uint);
}

interface ERCXXXX_MetaWallet {
    event Deposited(address by, address token, address to, uint256 value);
    event Withdrew(address by, address token, address to, uint256 value);
    event Executed(address by, address to, uint256 value, bytes data, uint256 expiry, address gasToken, uint256 gasPrice, uint256 gasLimit);

    function balanceOf(address token, address tokenOwner) external view returns(uint256);
    function deposit(address token, address to, uint256 value) external;
    function withdraw(address token, address to, uint256 value) external;
    function execute(address to, uint256 value, bytes data, uint256 expiry, address gasToken, uint256 gasPrice, uint256 gasLimit) external;
}
