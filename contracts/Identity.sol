pragma solidity ^0.4.24;

import "./erc725.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/* TODO: implement ERC165 */

contract Identity is ERC725 {
    address private _owner;
    mapping(uint256 => address) ambassadors;

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

    function setAmbassador(uint256 key, address value) public {
        ambassadors[key] = value;
        emit AmbassadorSet(key, value);
    }

    function getAmbassador(uint256 key) public view returns (address value) {
        return ambassadors[key];
    }
}
