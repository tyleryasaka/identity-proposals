pragma solidity ^0.4.24;

import "./ERCXXXX_ClaimVerifier.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/*
    Example, trivial implementation of claim verifier. There are many
    more interesting implementations that might be imagined.
*/

contract ClaimVerifier is ERCXXXX_ClaimVerifier, Ownable {
    bool isRegistrationOpen;

    function setRegistrationStatus(bool status) public onlyOwner {
        isRegistrationOpen = status;
    }

    function isClaimValid(address issuer, address subject, bytes32 key) public view returns (bool) {
        return isRegistrationOpen;
    }
}
