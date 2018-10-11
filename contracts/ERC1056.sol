pragma solidity ^0.4.24;

contract ERC1056 {
    event DIDOwnerChanged(
        address indexed identity,
        address owner,
        uint previousChange
    );

    event DIDDelegateChanged(
        address indexed identity,
        bytes32 delegateType,
        address delegate,
        uint validTo,
        uint previousChange
    );

    event DIDAttributeChanged(
        address indexed identity,
        bytes32 name,
        bytes value,
        uint validTo,
        uint previousChange
    );

    function identityOwner(address identity) public view returns(address);
    function changeOwner(address identity, address newOwner) public;
    function changeOwnerSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, address newOwner) public;
    function validDelegate(address identity, bytes32 delegateType, address delegate) public view returns(bool);
    function addDelegate(address identity, bytes32 delegateType, address delegate, uint validity) public;
    function addDelegateSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 delegateType, address delegate, uint validity) public;
    function revokeDelegate(address identity, bytes32 delegateType, address delegate) public;
    function revokeDelegateSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 delegateType, address delegate) public;
    function setAttribute(address identity, bytes32 name, bytes value, uint validity) public;
    function setAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes value, uint validity) public;
    function revokeAttribute(address identity, bytes32 name, bytes value) public;
    function revokeAttributeSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 name, bytes value) public;
}
