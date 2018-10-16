pragma solidity ^0.4.24;

import "./ERCXXXX_ClaimIssuer.sol";
import "./ERC780.sol";

contract ClaimIssuerRegistry is ERCXXXX_ClaimIssuerRegistry {
    mapping(address => address) public issuers;
    ERC780 public registry780;

    constructor(address _registry780) public {
      registry780 = ERC780(_registry780);
    }

    function setClaimIssuer(address claimIssuer) external {
        issuers[msg.sender] = claimIssuer;
    }

    function getClaim(address issuer, address subject, bytes32 key) external constant returns(bytes32) {
        address issuerAddress = issuers[issuer];
        if (issuerAddress != 0x0000000000000000000000000000000000000000) {
            ERCXXXX_ClaimIssuer claimIssuer = ERCXXXX_ClaimIssuer(issuerAddress);
            return claimIssuer.getClaim(subject, key);
        } else {
            return registry780.getClaim(issuer, subject, key);
        }
    }
}
