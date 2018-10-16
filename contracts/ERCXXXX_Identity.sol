pragma solidity ^0.4.24;

interface ERCXXXX_Identity {
    event Executed(address indexed to, uint256 indexed value, bytes data);
    event ExecutionFailed(address indexed to, uint256 indexed value, bytes data);

    function owner() external view returns(address);
    function transferOwnership(address newOwner) external;
    function execute(address _to, uint256 _value, bytes _data) external returns (bool _success);
}
