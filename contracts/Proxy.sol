pragma solidity ^0.4.23;
pragma experimental "v0.5.0";

import "./Resolver.sol";

contract Proxy {
  Resolver public resolver;

  function() external payable {
    if (msg.sig == 0x0) {
      return;
    }

    address destination = resolver.lookup(msg.sig);

    assembly {
      calldatacopy(mload(0x40), 0, calldatasize)
      let result := delegatecall(gas, destination, mload(0x40), calldatasize, mload(0x40), 0)
      returndatacopy(mload(0x40), 0, returndatasize)
      switch result
      case 1 { return(mload(0x40), returndatasize) }
      default { revert(mload(0x40), returndatasize) }
    }
  }

  function setResolver(address _resolver) public {
    resolver = Resolver(_resolver);
  }
}
