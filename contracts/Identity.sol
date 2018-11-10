pragma solidity ^0.4.24;

import "./ERC725.sol";

contract Identity is ERC725 {
    event ContractCreation(address newContract);

    uint256 constant OPERATION_CALL = 0;
    uint256 constant OPERATION_DELEGATECALL = 1;
    uint256 constant OPERATION_CREATE = 2;
    bytes32 constant DELEGATE_OWNER = 0x0000000000000000000000000000000000000000000000000000000000000000;

    mapping(bytes32 => bytes32) delegates;

    constructor(address owner) public {
        delegates[DELEGATE_OWNER] = bytes32(owner);
    }

    modifier onlyOwner() {
        require(msg.sender == address(delegates[DELEGATE_OWNER]));
        _;
    }

    function getDelegate(bytes32 _delegateType) external view returns (bytes32 _delegate) {
        return delegates[_delegateType];
    }

    function setDelegate(bytes32 _delegateType, bytes32 _delegate) external onlyOwner {
        delegates[_delegateType] = _delegate;
    }

    function execute(uint256 _operationType, address _to, uint256 _value, bytes _data) external onlyOwner {
        if (_operationType == OPERATION_CALL)
            executeCall(_to, _value, _data);
        else if (_operationType == OPERATION_DELEGATECALL)
            executeDelegateCall(_to, _data);
        else {
            address newContract = executeCreate(_data);
            emit ContractCreation(newContract);
        }
    }

    // copied from GnosisSafe
    // https://github.com/gnosis/safe-contracts/blob/v0.0.2-alpha/contracts/base/Executor.sol
    function executeCall(address to, uint256 value, bytes data)
        internal
        returns (bool success)
    {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    // copied from GnosisSafe
    // https://github.com/gnosis/safe-contracts/blob/v0.0.2-alpha/contracts/base/Executor.sol
    function executeDelegateCall(address to, bytes data)
        internal
        returns (bool success)
    {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := delegatecall(gas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    // copied from GnosisSafe
    // https://github.com/gnosis/safe-contracts/blob/v0.0.2-alpha/contracts/base/Executor.sol
    function executeCreate(bytes data)
        internal
        returns (address newContract)
    {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            newContract := create(0, add(data, 0x20), mload(data))
        }
    }
}
