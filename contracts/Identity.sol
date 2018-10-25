pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";

contract Identity is ERCXXXX_Identity {
    event ContractCreation(address newContract);

    uint256 constant OPERATION_CALL = 0;
    uint256 constant OPERATION_DELEGATECALL = 1;
    uint256 constant OPERATION_CREATE = 2;

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

    function execute(address to, uint256 value, bytes data, uint256 operationType) external onlyOwner {
        if (operationType == OPERATION_CALL)
            executeCall(to, value, data);
        else if (operationType == OPERATION_DELEGATECALL)
            executeDelegateCall(to, data);
        else {
            address newContract = executeCreate(data);
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
