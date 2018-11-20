pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERC734.sol";

/* This is a *very* poorly implemented key management contract. It is for demonstration purposes only. */

contract IdentityManager is ERC734 {
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
    ERC725 private _identity;

    modifier onlyManagement() {
      require(_keyHasPurpose(msg.sender, MANAGEMENT_ROLE), "Must have manager role");
      _;
    }

    modifier onlyAction() {
      require(_keyHasPurpose(msg.sender, ACTION_ROLE), "Must have action role");
      _;
    }

    constructor (address identity, address manager) public {
        _identity = ERC725(identity);
        _roles[manager] = MANAGEMENT_ROLE;
    }

    function _requiredSignatures(uint256 key) internal view returns (uint) {
        if (key == 1) {
            return MANAGEMENT_SIGS;
        } else if (key == 2) {
            return ACTION_SIGS;
        }
    }

    function _validateSignatures(uint256 key, bytes signature, bytes32 signatureData) internal view returns (bool) {
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
        return _keyHasPurpose(recovered, key);
    }

    function _checkExpiry(uint256 expiry) internal view returns (bool) {
        if (expiry > 0) {
            require(now < expiry, "Transaction must be executed before expiry");
        }
        return true;
    }

    function _keyHasPurpose(address key, uint256 role) private view returns(bool) {
        return (_roles[key] != EMPTY_ROLE) && (_roles[key] <= role);
    }

    function keyHasPurpose(bytes32 key, uint256 role) external view returns(bool) {
        return _keyHasPurpose(address(key), role);
    }

    function getKey(bytes32 key) external view returns(uint256) {
        return _roles[address(key)];
    }

    function addKey(bytes32 key, uint256 role) external onlyManagement {
        _roles[address(key)] = role;
        emit KeyAdded(key, role);
    }

    function addKeySigned(address key, uint256 role, uint256 expiry, bytes signatures) external {
        bytes32 nonceKey = keccak256("addKeySigned", key, role);
        bytes32 signatureData = keccak256(address(this), "addKeySigned", key, role, _nonce[nonceKey], expiry);
        _checkExpiry(expiry);
        require(_validateSignatures(MANAGEMENT_ROLE, signatures, signatureData), "Must have valid management signatures");
        _nonce[nonceKey]++;
        _roles[key] = role;
        emit KeyAdded(bytes32(key), role);
    }

    function removeKey(bytes32 key) external onlyManagement {
        _roles[address(key)] = EMPTY_ROLE;
        emit KeyRemoved(key);
    }

    function removeKeySigned(address key, uint256 expiry, bytes signatures) external {
        bytes32 nonceKey = keccak256("removeKeySigned", key);
        bytes32 signatureData = keccak256(address(this), "removeKeySigned", key, _nonce[nonceKey], expiry);
        _checkExpiry(expiry);
        require(_validateSignatures(MANAGEMENT_ROLE, signatures, signatureData), "Must have valid management signatures");
        _nonce[nonceKey]++;
        _roles[key] = EMPTY_ROLE;
        emit KeyRemoved(bytes32(key));
    }

    function execute(uint256 operationType, address to, uint256 value, bytes data) external onlyAction returns (uint256) {
        _identity.execute(operationType, to, value, data);
        return 0;
    }

    function executeSigned(uint256 operationType, address to, uint256 value, bytes data, uint256 expiry, bytes signatures) external {
        bytes32 nonceKey = keccak256("executeSigned", operationType, to, value, data);
        bytes32 signatureData = keccak256(address(this), "executeSigned", operationType, to, value, data, _nonce[nonceKey], expiry);
        _checkExpiry(expiry);
        require(_validateSignatures(ACTION_ROLE, signatures, signatureData), "Must have valid action signatures");
        _nonce[nonceKey]++;
        _identity.execute(operationType, to, value, data);
    }

    function approve(uint256 id, bool approve) external {
        emit Approved(id, approve);
    }

    function getNonce(bytes32 nonceKey) external view returns (uint256) {
        return _nonce[nonceKey];
    }

    function getRequiredSignatures(uint256 key) external view returns (uint) {
        return _requiredSignatures(key);
    }
}
