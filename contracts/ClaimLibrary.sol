pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERCXXXX_ClaimManager.sol";

library ClaimLibrary {
    function getClaim(address issuer, address subject, bytes32 key) public view returns(bytes32) {
        ERC725 identity = ERC725(issuer);
        address claimManagerAddress = identity.getAmbassador(0);
        ERCXXXX_ClaimManager claimManager = ERCXXXX_ClaimManager(claimManagerAddress);
        return claimManager.getClaim(subject, key);
    }
}
