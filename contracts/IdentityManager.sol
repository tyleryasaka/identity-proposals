pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "./ERCXXXX_KeyManager.sol";

/* This is a *very* poorly implemented key management contract. It is for demonstration purposes only. */

contract IdentityManager is ERCXXXX_KeyManager {
    uint256 constant EMPTY_ROLE = 0;
    uint256 constant MANAGEMENT_ROLE = 1;
    uint256 constant ACTION_ROLE = 2;
    uint256 constant ENCRYPTION_ROLE = 3;

    mapping(address => uint256) private _roles;
    uint256 public nonce;
    ERCXXXX_Identity private _identity;

    modifier onlyManagement() {
      require(_hasRole(msg.sender, MANAGEMENT_ROLE));
      _;
    }

    modifier onlyAction() {
      require(_hasRole(msg.sender, ACTION_ROLE));
      _;
    }

    constructor (address identity) public {
        _identity = ERCXXXX_Identity(identity);
        _roles[msg.sender] = MANAGEMENT_ROLE;
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
        emit Executed(to, value, data);
    }

    function executeSigned(address to, uint256 value, bytes executionData, uint8 v, bytes32 r, bytes32 s) external {
        bytes32 signatureData = keccak256(abi.encodePacked(address(this), to, value, executionData, nonce));
        address signer = ecrecover(signatureData, v, r, s);
        require(_hasRole(signer, ACTION_ROLE));
        nonce++;
        _identity.execute(to, value, executionData);
        emit Executed(to, value, executionData);
    }
}
