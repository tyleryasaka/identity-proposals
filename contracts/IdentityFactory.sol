pragma solidity ^0.4.24;

import "./Identity.sol";
import "./KeyManager.sol";

contract IdentityFactory {
    event CreatedIdentityWithManager(address identity, address manager);

    bytes32 constant OWNER_KEY = 0x0000000000000000000000000000000000000000000000000000000000000000;

    function createIdentityWithMetaWallet(address metaWallet) public {
        Identity identity = new Identity(address(this));
        KeyManager identityManager = new KeyManager(identity, address(this));
        identityManager.addKey(bytes32(metaWallet), 2);
        identityManager.addKey(bytes32(msg.sender), 1);
        identityManager.removeKey(bytes32(address(this)));
        identity.setData(OWNER_KEY, bytes32(address(identityManager)));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }

    function createIdentityWithManager() public {
        Identity identity = new Identity(address(this));
        KeyManager identityManager = new KeyManager(identity, address(this));
        identityManager.addKey(bytes32(msg.sender), 1);
        identityManager.removeKey(bytes32(address(this)));
        identity.setData(OWNER_KEY, bytes32(address(identityManager)));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }

    function createIdentityWithExecution(uint256 operationType, address to, uint256 value, bytes data) public {
        Identity identity = new Identity(address(this));
        identity.execute(operationType, to, value, data);
        identity.setData(OWNER_KEY, bytes32(msg.sender));
        emit CreatedIdentityWithManager(address(identity), msg.sender);
    }
}
