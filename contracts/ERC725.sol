pragma solidity ^0.4.24;

interface ERC725 {
    event DelegateSet(bytes32 indexed delegateType, address indexed delegate);

    function getDelegate(bytes32 _delegateType) external view returns (address _delegate);
    function setDelegate(bytes32 _delegateType, address _delegate) external;
    function execute(uint256 _operationType, address _to, uint256 _value, bytes _data) external;
}
