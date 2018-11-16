pragma solidity ^0.4.23;
pragma experimental "v0.5.0";

contract Resolver {
  mapping (bytes4 => address) public pointers;

  function register(string signature, address destination) public {
    pointers[stringToSig(signature)] = destination;
  }

  function lookup(bytes4 sig) public view returns (address) {
    return pointers[sig];
  }

  function stringToSig(string signature) public pure returns (bytes4) {
    return bytes4(keccak256(abi.encodePacked(signature)));
  }
}
