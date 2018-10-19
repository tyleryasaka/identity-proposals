pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";

/* TODO: implement ERC165 */

contract Identity is ERCXXXX_Identity {
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

    function execute(address to, uint256 value, bytes data) external onlyOwner {
        require(executeCall(to, value, data));
    }

    // Copied from uPort's Proxy, which copied from GnosisSafe
    // https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol#L18
    function executeCall(address to, uint256 value, bytes data) internal returns (bool success) {
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }
}
