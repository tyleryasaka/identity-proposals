pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

contract ERCXXXX_Identity {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
    }

    function owner() external view returns(address);
    function transferOwnership(address newOwner) external;
    function execute(Transaction memory tx) public;
}

contract ERCXXXX_IdentityManager {
    event RoleAdded(address actor, uint256 level);
    event RoleRemoved(address actor);

    function hasRole(address actor, uint256 level) external view returns(bool);
    function addRole(address actor, uint256 level) external;
    function addRoleSigned(address actor, uint256 level, uint256 expiry, bytes signatures) external;
    function removeRole(address actor) external;
    function removeRoleSigned(address actor, uint256 expiry, bytes signatures) external;
    function execute(ERCXXXX_Identity.Transaction memory tx) public;
    function executeSigned(ERCXXXX_Identity.Transaction memory tx, uint256 expiry, bytes signatures) public;
    function getNonce(bytes32 nonceKey) external view returns (uint256);
    function getRequiredSignatures(uint256 level) external view returns (uint);
}
