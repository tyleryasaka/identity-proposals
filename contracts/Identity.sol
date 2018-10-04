pragma solidity ^0.4.24;

import "./erc725.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Identity is ERC725, Ownable {
    function execute(address _to, uint256 _value, bytes _data) public onlyOwner returns (bool _success) {
        _success = _to.call(_data, _value);
        if (_success) {
            emit Executed(_to, _value, _data);
        } else {
            emit ExecutionFailed(_to, _value, _data);
        }
    }
}
