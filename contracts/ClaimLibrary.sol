pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "./ERCXXXX_ClaimManager.sol";

library ClaimLibrary {
    bytes32 constant CLAIM_MANAGEMENT_DELEGATE_TYPE = 0x0000000000000000000000000000000000000000000000000000000000000123;

    function getClaim(address issuer, address subject, bytes32 key) public view returns(bytes32) {
        ERCXXXX_Identity identity = ERCXXXX_Identity(issuer);
        address claimManagerAddress = identity.getDelegate(CLAIM_MANAGEMENT_DELEGATE_TYPE);
        ERCXXXX_ClaimManager claimManager = ERCXXXX_ClaimManager(claimManagerAddress);
        return claimManager.getClaim(subject, key);
    }
}
