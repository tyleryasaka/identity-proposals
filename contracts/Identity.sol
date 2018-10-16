pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/* TODO: implement ERC165 */

contract Identity is ERCXXXX_Identity {
    address private _owner;

    constructor() public {
      _owner = msg.sender;
    }

    modifier onlyOwner() {
      require(msg.sender == _owner);
      _;
    }

    function owner() external view returns(address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        _owner = newOwner;
    }

    function execute(address to, uint256 value, bytes data) external onlyOwner {
        to.call(data, value);
        emit Executed(to, value, data);
    }
}
