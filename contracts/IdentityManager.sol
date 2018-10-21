pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";

/* This is a *very* poorly implemented key management contract. It is for demonstration purposes only. */

contract IdentityManager is ERCXXXX_IdentityManager {
    uint256 constant EMPTY_ROLE = 0;
    uint256 constant MANAGEMENT_ROLE = 1;
    uint256 constant ACTION_ROLE = 2;
    uint256 constant ENCRYPTION_ROLE = 3;
    uint256 constant RECOVERY_ROLE = 4;

    uint256 constant MANAGEMENT_SIGS = 1;
    uint256 constant ACTION_SIGS = 1;

    bytes constant PREFIX = "\x19Ethereum Signed Message:\n32";

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

    function _requiredSignatures(uint256 level) internal view returns (uint) {
        if (level == 1) {
            return MANAGEMENT_SIGS;
        } else if (level == 2) {
            return ACTION_SIGS;
        }
    }

    function _checkSignature(uint256 level, bytes signature, bytes32 signatureData) internal view returns (bool) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
          r := mload(add(signature, 32))
          s := mload(add(signature, 64))
          v := and(mload(add(signature, 65)), 255)
        }
        if (v < 27) v += 27;
        address recovered = ecrecover(keccak256(PREFIX, signatureData), v, r, s);
        require(_hasRole(recovered, level), "Must have appropriate role");
        return true;
    }

    function _checkExpiry(uint256 expiry) internal view returns (bool) {
        if (expiry > 0) {
            require(now < expiry, "Transaction must be executed before expiry");
        }
        return true;
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

    function addRoleSigned(address actor, uint256 level, bytes signatures) external {
        bytes32 nonceKey = keccak256("addRoleSigned", actor, level);
        bytes32 signatureData = keccak256(address(this), "addRoleSigned", actor, level, _nonce[nonceKey]);
        _checkSignature(MANAGEMENT_ROLE, signatures, signatureData);
        _nonce[nonceKey]++;
        _roles[actor] = level;
        emit RoleAdded(actor, level);
    }

    function removeRole(address actor) external onlyManagement {
        _roles[actor] = EMPTY_ROLE;
        emit RoleRemoved(actor);
    }

    function removeRoleSigned(address actor, bytes signatures) external {
        bytes32 nonceKey = keccak256("removeRoleSigned", actor);
        bytes32 signatureData = keccak256(address(this), "removeRoleSigned", actor, _nonce[nonceKey]);
        _checkSignature(MANAGEMENT_ROLE, signatures, signatureData);
        _nonce[nonceKey]++;
        _roles[actor] = EMPTY_ROLE;
        emit RoleRemoved(actor);
    }

    function execute(address to, uint256 value, bytes data) external onlyAction {
        _identity.execute(to, value, data);
    }

    function executeSigned(address to, uint256 value, bytes data, uint256 expiry, bytes signatures) external {
        bytes32 nonceKey = keccak256("executeSigned", to, value, data);
        bytes32 signatureData = keccak256(address(this), "executeSigned", to, value, data, _nonce[nonceKey], expiry);
        _checkExpiry(expiry);
        _checkSignature(ACTION_ROLE, signatures, signatureData);
        _nonce[nonceKey]++;
        _identity.execute(to, value, data);
    }

    function getNonce(bytes32 nonceKey) external view returns (uint256) {
        return _nonce[nonceKey];
    }

    function getRequiredSignatures(uint256 level) external view returns (uint) {
        return _requiredSignatures(level);
    }
}
