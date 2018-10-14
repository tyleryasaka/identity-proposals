pragma solidity ^0.4.24;

import "./ERC725.sol";
import "./ERCXXXX_ClaimManager.sol";

library ClaimLibrary {
    bytes32 constant CLAIM_MANAGEMENT_DELEGATE_TYPE = 0x0000000000000000000000000000000000000000000000000000000000000123;

    function getClaim(address issuer, address subject, bytes32 delegateType) public view returns(bytes32) {
        ERC725 identity = ERC725(issuer);
        address claimManagerAddress = identity.getDelegate(CLAIM_MANAGEMENT_DELEGATE_TYPE);
        ERCXXXX_ClaimManager claimManager = ERCXXXX_ClaimManager(claimManagerAddress);
        return claimManager.getClaim(subject, delegateType);
    }
}
