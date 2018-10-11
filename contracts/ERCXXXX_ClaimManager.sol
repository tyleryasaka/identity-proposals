pragma solidity ^0.4.24;

/*
    This is intended to represent a future ERC to standardize claim management.
    The interface is intended to match that of ERC780 as closely as possible,
    so that the two standards are interoperable. The difference with this
    standard is that claims are stored on a contract controlled by the issuer,
    rather than a central registry.
*/

contract ERCXXXX_ClaimManager {
    function setClaim(address subject, bytes32 key, bytes32 value) public;
    function setSelfClaim(bytes32 key, bytes32 value) public;
    function getClaim(address subject, bytes32 key) public constant returns(bytes32);
    function removeClaim(address subject, bytes32 key) public;
}
