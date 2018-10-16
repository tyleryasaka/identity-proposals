pragma solidity ^0.4.24;

interface ERCXXXX_KeyManager {
    event RoleAdded(address indexed actor, uint256 indexed level);
    event RoleRemoved(address indexed actor);
    event Executed(address indexed to, uint256 indexed value, bytes data);

    function hasRole(address actor, uint256 level) external view returns(bool);
    function addRole(address actor, uint256 level) external;
    function removeRole(address actor) external;
    function execute(address to, uint256 value, bytes data) external;
    function executeSigned(address to, uint256 value, bytes executionData, uint8 v, bytes32 r, bytes32 s) external;
}
