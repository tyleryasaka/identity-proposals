pragma solidity ^0.4.23;
pragma experimental "v0.5.0";

contract Forwarder2 {
  address destination;

  constructor(address contractAddress) public {
    destination = contractAddress;
  }

  function() external payable {
    require(msg.sig != 0x0, "function sig not specified");

    address _destination = destination;

    assembly {
      calldatacopy(mload(0x40), 0, calldatasize)
      let result := delegatecall(gas, _destination, mload(0x40), calldatasize, mload(0x40), 0)
      returndatacopy(mload(0x40), 0, returndatasize)
      switch result
      case 1 { return(mload(0x40), returndatasize) }
      default { revert(mload(0x40), returndatasize) }
    }
  }
}
