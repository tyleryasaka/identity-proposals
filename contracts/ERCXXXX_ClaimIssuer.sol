pragma solidity ^0.4.24;

/*
    This is intended to represent a future ERC to standardize claim management.
    getClaim should first look for a claim regsitry associated with an issuer.
    If the claim registry does not exist, ERC780 should be used.
*/

interface ERCXXXX_ClaimManager {
    function getClaim(address subject, bytes32 key) external constant returns(bytes32);
}

interface ERCXXXX_ClaimIssuerRegistry {
    event ClaimManagerSet(address issuer, address claimManager);

    function setClaimManager(address claimManager) external;
    function getClaim(address issuer, address subject, bytes32 key) external constant returns(bytes32);
}
