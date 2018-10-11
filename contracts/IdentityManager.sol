pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERCXXXX_KeyManager.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/* This is a *very* poorly implemented key management contract. It is for demonstration purposes only. */

contract IdentityManager is ERCXXXX_KeyManager, Ownable {
    ERC725 identity;

    constructor (address _identity) public {
        identity = ERC725(_identity);
    }

    function getKey(bytes32 _key) public view returns(uint256[] purposes, uint256 keyType, bytes32 key) {}
    function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool exists) {}
    function getKeysByPurpose(uint256 _purpose) public view returns(bytes32[] keys) {}
    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) public returns (bool success) {}
    function removeKey(bytes32 _key, uint256 _purpose) public returns (bool success) {}

    function execute(address _to, uint256 _value, bytes _data) public onlyOwner returns (uint256 executionId) {
        identity.execute(_to, _value, _data);
        return 0;
    }

    function approve(uint256 _id, bool _approve) public returns (bool success) {}
}
