pragma solidity ^0.4.24;

import "./ERCXXXX_ClaimManager.sol";
import "./ERCXXXX_ClaimVerifier.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ClaimManager is ERCXXXX_ClaimManager, Ownable {
    mapping(address => mapping(bytes32 => bytes32)) public claims;

    event ClaimSet(
        address indexed subject,
        bytes32 indexed key,
        bytes32 value,
        uint updatedAt
    );

    event ClaimRemoved(
        address indexed subject,
        bytes32 indexed key,
        uint removedAt
    );
    ERCXXXX_ClaimVerifier _verifier;

    // create or update clams
    function setClaim(address subject, bytes32 key, bytes32 value) public onlyOwner {
        claims[subject][key] = value;
        emit ClaimSet(subject, key, value, now);
    }

    function setSelfClaim(bytes32 key, bytes32 value) public onlyOwner {
        setClaim(address(this), key, value);
    }

    function getClaim(address subject, bytes32 key) public view returns(bytes32) {
        if (address(_verifier) != 0x0000000000000000000000000000000000000000000000000000000000000000) {
            bool isValid = _verifier.isClaimValid(address(this), subject, key);
            if (isValid) {
                return claims[subject][key];
            } else {
                return 0x0000000000000000000000000000000000000000000000000000000000000000;
            }
        }
        return claims[subject][key];
    }

    function removeClaim(address subject, bytes32 key) public onlyOwner {
        delete claims[subject][key];
        emit ClaimRemoved(subject, key, now);
    }

    function setVerifier(address verifier) public onlyOwner {
        _verifier = ERCXXXX_ClaimVerifier(verifier);
    }
}
