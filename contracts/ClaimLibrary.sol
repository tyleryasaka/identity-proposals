pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERCXXXX_ClaimManager.sol";

library ClaimLibrary {
    uint256 constant CLAIM_MANAGEMENT_AMBASSADOR_KEY = 123;

    function getClaim(address issuer, address subject, bytes32 key) public view returns(bytes32) {
        ERC725 identity = ERC725(issuer);
        address claimManagerAddress = identity.getAmbassador(CLAIM_MANAGEMENT_AMBASSADOR_KEY);
        ERCXXXX_ClaimManager claimManager = ERCXXXX_ClaimManager(claimManagerAddress);
        return claimManager.getClaim(subject, key);
    }
}
