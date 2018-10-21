pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";

/* This is a *very* poorly implemented key management contract. It is for demonstration purposes only. */

contract IdentityManager is ERCXXXX_IdentityManager {
    uint256 constant EMPTY_ROLE = 0;
    uint256 constant MANAGEMENT_ROLE = 1;
    uint256 constant ACTION_ROLE = 2;
    uint256 constant ENCRYPTION_ROLE = 3;
    uint256 constant RECOVERY_ROLE = 4;

    mapping(address => uint256) private _roles;
    mapping(bytes32 => uint256) private _nonce;
    ERCXXXX_Identity private _identity;

    modifier onlyManagement() {
      require(_hasRole(msg.sender, MANAGEMENT_ROLE), "Must have manager role");
      _;
    }

    modifier onlyAction() {
      require(_hasRole(msg.sender, ACTION_ROLE), "Must have action role");
      _;
    }

    constructor (address identity, address manager) public {
        _identity = ERCXXXX_Identity(identity);
        _roles[manager] = MANAGEMENT_ROLE;
    }

    function hasRole(address actor, uint256 level) external view returns(bool) {
        return _hasRole(actor, level);
    }

    function _hasRole(address actor, uint256 level) private view returns(bool) {
        return (_roles[actor] != EMPTY_ROLE) && (_roles[actor] <= level);
    }

    function addRole(address actor, uint256 level) external onlyManagement {
        _roles[actor] = level;
        emit RoleAdded(actor, level);
    }

    function removeRole(address actor) external onlyManagement {
        _roles[actor] = EMPTY_ROLE;
        emit RoleRemoved(actor);
    }

    function execute(address to, uint256 value, bytes data) external onlyAction {
        _identity.execute(to, value, data);
    }

    function executeSigned(address to, uint256 value, bytes executionData, uint8 v, bytes32 r, bytes32 s) external {
        bytes32 callHash = keccak256(to, value, executionData);
        bytes32 signatureData = keccak256(address(this), to, value, executionData, _nonce[callHash]);
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedData = keccak256(prefix, signatureData);
        address recovered = ecrecover(prefixedData, v, r, s);
        require(_hasRole(recovered, ACTION_ROLE), "Must have action role");
        _nonce[callHash]++;
        _identity.execute(to, value, executionData);
    }

    function getNonce(address to, uint256 value, bytes executionData) external view returns (uint256) {
        bytes32 callHash = keccak256(to, value, executionData);
        return _nonce[callHash];
    }
}
