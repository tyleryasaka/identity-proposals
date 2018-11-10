pragma solidity ^0.4.24;

import "./Identity.sol";
import "./IdentityManager.sol";

contract IdentityFactory {
    event CreatedIdentityWithManager(address identity, address manager);

    bytes32 constant DELEGATE_OWNER = 0x0000000000000000000000000000000000000000000000000000000000000000;

    function createIdentityWithMetaWallet(address metaWallet) public {
        Identity identity = new Identity(address(this));
        IdentityManager identityManager = new IdentityManager(identity, address(this));
        identityManager.addRole(metaWallet, 2);
        identityManager.addRole(msg.sender, 1);
        identityManager.removeRole(address(this));
        identity.setDelegate(DELEGATE_OWNER, bytes32(address(identityManager)));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }

    function createIdentityWithManager() public {
        Identity identity = new Identity(address(this));
        IdentityManager identityManager = new IdentityManager(identity, address(this));
        identityManager.addRole(msg.sender, 1);
        identityManager.removeRole(address(this));
        identity.setDelegate(DELEGATE_OWNER, bytes32(address(identityManager)));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }

    function createIdentityWithExecution(uint256 operationType, address to, uint256 value, bytes data) public {
        Identity identity = new Identity(address(this));
        identity.execute(operationType, to, value, data);
        identity.setDelegate(DELEGATE_OWNER, bytes32(msg.sender));
        emit CreatedIdentityWithManager(address(identity), msg.sender);
    }
}
