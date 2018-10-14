pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "./ERCXXXX_ClaimIssuer.sol";

library ClaimLibrary {
    bytes32 constant CLAIM_MANAGEMENT_DELEGATE_TYPE = 0x0000000000000000000000000000000000000000000000000000000000000123;

    function getClaim(address issuer, address subject, bytes32 key) public view returns(bytes32) {
        ERCXXXX_Identity identity = ERCXXXX_Identity(issuer);
        address claimIssuerAddress = identity.getDelegate(CLAIM_MANAGEMENT_DELEGATE_TYPE);
        ERCXXXX_ClaimIssuer claimIssuer = ERCXXXX_ClaimIssuer(claimIssuerAddress);
        return claimIssuer.getClaim(subject, key);
    }
}
