pragma solidity ^0.4.24;

import "./Identity.sol";
import "./IdentityManager.sol";

contract IdentityFactory {
    event CreatedIdentityWithManager(address identity, address manager);

    function createIdentityWithMetaWallet(address metaWallet) public {
        Identity identity = new Identity(address(this));
        IdentityManager identityManager = new IdentityManager(identity, address(this));
        identityManager.addRole(metaWallet, 2);
        identityManager.addRole(msg.sender, 1);
        identityManager.removeRole(address(this));
        identity.transferOwnership(address(identityManager));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }

    function createIdentityWithManager() public {
        Identity identity = new Identity(address(this));
        IdentityManager identityManager = new IdentityManager(identity, address(this));
        identityManager.addRole(msg.sender, 1);
        identityManager.removeRole(address(this));
        identity.transferOwnership(address(identityManager));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }
}
