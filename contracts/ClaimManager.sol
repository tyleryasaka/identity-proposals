pragma solidity ^0.4.24;

import "./ERCXXXX_ClaimManager.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimManager is ERCXXXX_ClaimManager, Ownable {
    mapping(address => mapping(bytes32 => bytes32)) public claims;

    event ClaimSet(
        address indexed subject,
        bytes32 indexed key,
        bytes32 value,
        uint updatedAt
    );

    event ClaimRemoved(
        address indexed subject,
        bytes32 indexed key,
        uint removedAt
    );

    // create or update clams
    function setClaim(address subject, bytes32 key, bytes32 value) public onlyOwner {
        claims[subject][key] = value;
        emit ClaimSet(subject, key, value, now);
    }

    function setSelfClaim(bytes32 key, bytes32 value) public onlyOwner {
        setClaim(address(this), key, value);
    }

    function getClaim(address subject, bytes32 key) public view returns(bytes32) {
        return claims[subject][key];
    }

    function removeClaim(address subject, bytes32 key) public onlyOwner {
        delete claims[subject][key];
        emit ClaimRemoved(subject, key, now);
    }
}
