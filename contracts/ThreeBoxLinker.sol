pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";

contract ThreeBoxLinker {
    event LinkCreated(address identity, address threeBox);

    mapping(address => address) links;

    function setThreeBox(address threeBox) public {
        links[msg.sender] = threeBox;
        emit LinkCreated(msg.sender, threeBox);
    }

    function getThreeBox(address identity) public view returns (address) {
        return links[identity];
    }
}
