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
    function removeRole(address actor) external;
    function execute(address to, uint256 value, bytes data) external;
    function executeSigned(address to, uint256 value, bytes executionData, bytes signatures) external;
    function getNonce(address to, uint256 value, bytes executionData) external view returns (uint256);
    function requiredSignatures(uint256 level) external view returns (uint);
}
