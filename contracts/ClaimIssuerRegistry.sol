pragma solidity ^0.4.24;

import "./ERCXXXX_ClaimIssuer.sol";
import "./ERC780.sol";

contract ClaimIssuerRegistry is ERCXXXX_ClaimIssuerRegistry {
    mapping(address => address) public claimManagers;
    ERC780 public registry780;

    constructor(address _registry780) public {
      registry780 = ERC780(_registry780);
    }

    function setClaimManager(address claimManager) external {
        claimManagers[msg.sender] = claimManager;
        emit ClaimManagerSet(msg.sender, claimManager);
    }

    function getClaim(address issuer, address subject, bytes32 key) external constant returns(bytes32) {
        address claimManagerAddress = claimManagers[issuer];
        if (claimManagerAddress != 0x0000000000000000000000000000000000000000) {
            ERCXXXX_ClaimManager claimManager = ERCXXXX_ClaimManager(claimManagerAddress);
            return claimManager.getClaim(subject, key);
        } else {
            return registry780.getClaim(issuer, subject, key);
        }
    }
}
