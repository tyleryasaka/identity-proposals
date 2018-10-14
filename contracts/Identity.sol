pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/* TODO: implement ERC165 */

contract Identity is ERCXXXX_Identity {
    address private _owner;
    mapping(bytes32 => address) delegates;

    constructor() public {
      _owner = msg.sender;
    }

    modifier onlyOwner() {
      require(msg.sender == _owner);
      _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        _owner = newOwner;
    }

    function execute(address _to, uint256 _value, bytes _data) public onlyOwner returns (bool _success) {
        _success = _to.call(_data, _value);
        if (_success) {
            emit Executed(_to, _value, _data);
        } else {
            emit ExecutionFailed(_to, _value, _data);
        }
    }

    function setDelegate(bytes32 delegateType, address delegate) public {
        delegates[delegateType] = delegate;
        emit DelegateSet(delegateType, delegate);
    }

    function getDelegate(bytes32 delegateType) public view returns (address delegate) {
        return delegates[delegateType];
    }
}
