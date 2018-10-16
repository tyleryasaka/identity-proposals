pragma solidity ^0.4.24;

/*
    This is intended to represent a future ERC to standardize claim management.
    getClaim should first look for a claim regsitry associated with an issuer.
    If the claim registry does not exist, ERC780 should be used.
*/

contract ERCXXXX_ClaimIssuer {
    function getClaim(address subject, bytes32 key) public constant returns(bytes32);
}

contract ERCXXXX_ClaimIssuerRegistry {
    function setIssuer(address claimIssuer) public;
    function getClaim(address issuer, address subject, bytes32 key) public constant returns(bytes32);
}
