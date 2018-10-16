pragma solidity ^0.4.24;

import "./Identity.sol";
import "./IdentityManager.sol";

contract IdentityFactory {
    event CreatedIdentityWithManager(address identity, address manager);

    function createIdentityWithManager() public {
        Identity identity = new Identity(address(this));
        IdentityManager identityManager = new IdentityManager(identity, msg.sender);
        identity.transferOwnership(address(identityManager));
        emit CreatedIdentityWithManager(address(identity), address(identityManager));
    }
}
