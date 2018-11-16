pragma solidity ^0.4.24;

contract DummyContract {
    // resolver needs to be the first in storage to match the Proxy contract storage ordering
    address resolver;
    uint count;

    constructor () public {
        count = 0;
    }

    function increment() public {
        count = count + 1;
    }

    function get() public view returns (uint) {
        return count;
    }

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

    mapping(address => mapping(bytes32 => bytes32)) public claims;

    // create or update clams
    function setClaim(address subject, bytes32 key, bytes32 value) public {
        claims[subject][key] = value;
        emit ClaimSet(subject, key, value, now);
    }

    function setSelfClaim(bytes32 key, bytes32 value) external {
        setClaim(address(this), key, value);
    }

    function getClaim(address subject, bytes32 key) external view returns(bytes32) {
        return claims[subject][key];
    }

    function removeClaim(address subject, bytes32 key) external {
        delete claims[subject][key];
        emit ClaimRemoved(subject, key, now);
    }
}
