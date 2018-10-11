pragma solidity ^0.4.24;

contract ERC725 {
    event Executed(address indexed to, uint256 indexed value, bytes data);
    event ExecutionFailed(address indexed to, uint256 indexed value, bytes data);
    event PointerSet(uint256 indexed key, address indexed value);
    function execute(address _to, uint256 _value, bytes _data) public returns (bool _success);
    function transferOwnership(address newOwner) public;
    function setPointer(uint256 key, address value) public;
    function getPointer(uint256 key) public view returns (address value);
}
