pragma solidity ^0.4.24;

import "./erc725.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Identity is ERC725, Ownable {
    mapping(uint256 => address) pointers;

    function execute(address _to, uint256 _value, bytes _data) public onlyOwner returns (bool _success) {
        _success = _to.call(_data, _value);
        if (_success) {
            emit Executed(_to, _value, _data);
        } else {
            emit ExecutionFailed(_to, _value, _data);
        }
    }

    function setPointer(uint256 key, address value) public {
        pointers[key] = value;
        emit PointerSet(key, value);
    }

    function getPointer(uint256 key) public view returns (address value) {
        return pointers[key];
    }
}
