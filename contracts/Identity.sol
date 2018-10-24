pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./ERCXXXX_Identity.sol";

contract Identity is ERCXXXX_Identity {
    event Executed(address to, uint256 value, bytes data);

    address private _owner;

    constructor(address owner) public {
        _owner = owner;
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

    function execute(Transaction memory tx) public onlyOwner {
        require(executeCall(tx.to, tx.value, tx.data));
        /* emit Executed(to, value, data); */
    }

    // Copied from uPort's Proxy, which copied from GnosisSafe
    // https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol#L18
    function executeCall(address to, uint256 value, bytes data) internal returns (bool success) {
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }
}
