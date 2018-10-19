# Identity Standards Proposals

This began as a demonstration of how [ERC725](https://github.com/ethereum/EIPs/issues/725) can be split into two separate standards, keeping a separation of concerns between identity and key management.

Now, this has evolved into a full-fledged exploration of identity standards and includes some proposed standards to support **flexible, long-lasting identity management for users on Ethereum**.

## Rationale

When designing these standards, I think it is important to be crystal clear regarding what problem(s) we are attempting to solve. I will describe my goals here.

### 1. Universal Login

Here I want to fill an important gap that I think exists in the Ethereum ecosystem. For all intents and purposes, wallets are essentially acting as users' identities on the blockchain. This forbids any sort of wise identity management solution. Such a solution would allow keys to be rotated over time, and would allow for a hierarchy of keys for management. A master key might grant you full control of your identity, but would be something that you would want to keep somewhere safe (i.e. not on your phone). However, you could have a lower level key that you carry on your phone. If you lose your phone and think the private key could be compromised, no problem. You can simply use your master key to remove that key. Bottom line: we want to decouple the wallet from the identity.

I believe there is value in standardizing a universal login; this allows users to be able to manage their identity across various browsers/clients.

Picture this: a user is browing a Dapp on Chrome with Metamask. They do something in the Dapp which triggers the Metamask popup window. They see the normal transaction flow, but instead of seeing the wallet, they see the identity that they are logged in as. The transaction executes on the blockchain, but interestingly: the wallet makes the transaction call, but on the Dapp, the identity's address is displayed as the author of the call (not the wallet). This is because the identity is a proxy contract, and the wallet simply told the identity what action to perform.

Another possibility that emerges when you decouple wallet from identity: [meta transactions](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84). It would be possible now for someone to browse *and interact on* a web3 Dapp using their own identity *but with no ETH*. Applications would have the option to pay for their users' transactions.

### 2. Claims

A claim is simply a statement made by one identity (the issuer) about another (the subject). There are a lot of use cases for claims. For example, a government entity might issue a claim saying that someone has a valid driver's license. Another use case could be notarization. Someone could digitally sign a statement saying that they witnessed a certain event.

Picture this: my local government has issued a claim saying that I am eligible to purchase alcohol. I go to a restaurant for dinner and order wine. The restaurant has an app that can quickly check that I have a valid government-issued claim stating that I am allowed to make the purchase. Then I go to the bar afterwards. I decide to get beer this time. Because there is a standard place to look for the "allowed to purchase alcohol" claim, the bar can use its own app to look this up.

This may or not be a realistic real-world scenario in the near future, but regardless it should not be difficult to see the value in having standardized claims lookup.

## Existing Standards

The existing standards around identity and claims (that I am aware of and find relevant) are as follows:
- [ERC725](https://github.com/ethereum/EIPs/issues/725)
- [ERC735](https://github.com/ethereum/EIPs/issues/735)
- [ERC780](https://github.com/ethereum/EIPs/issues/780)
- [ERC1056](https://github.com/ethereum/EIPs/issues/1056)

### ERC725 Concerns

ERC725 attempts to solve the universal login issue. However I find it to be tightly coupled and inflexible. It will lock the user into a specific key management format for all of time. See [my Medium post](https://medium.com/@tyleryasaka/erc725-proposed-changes-ea2dc221136e).

### ERC735 Concerns

Claims are attached to subject rather than issuer. Again, see [my Medium post](https://medium.com/@tyleryasaka/erc725-proposed-changes-ea2dc221136e).

### ERC780 Concerns

 Relies on universal registry contract. I think this will work for some use cases, but I think it has some limitations:

 (1) It's inflexible. It relies on a registry that is deployed once and cannot be upgraded. Not only can it not be upgraded, but it cannot be customized for special use cases.

 (2) It lacks support for *computable claims*. I have talked to multiple people that have expressed a desire to be able to define their own logic for claim validity. For example, I might wish to say that a "registration claim" that I have issued is valid only when a `isRegistrationOpen` flag is set to `true`. It is true that perhaps computable claims can be conceptualized as permissions rather than claims - such that the logic is implemented at a level above the claims - nonetheless, I think it is better to be unopinionated here and allow people to use computable claims if they wish.

### ERC1056 Concerns

I actually like ERC1056. However, it does not address universal login. (It does have the concept of an owner which is decoupled from the identity address. However, this is merely an association on a registry; it does not add the capability of the owner being able to send a transaction on behalf of the identity, where `msg.sender` is the identity address.)

## Proposed Standards

### ERCXXXX_Identity

```
interface ERCXXXX_Identity {
    function owner() external view returns(address);
    function transferOwnership(address newOwner) external;
    function execute(address to, uint256 value, bytes data) external;
}

interface ERCXXXX_IdentityManager {
    function hasRole(address actor, uint256 level) external view returns(bool);
    function addRole(address actor, uint256 level) external;
    function removeRole(address actor) external;
    function execute(address to, uint256 value, bytes data) external;
    function executeSigned(address to, uint256 value, bytes executionData, uint8 v, bytes32 r, bytes32 s) external;
}
```

This is heavily inspired by ERC725, but it decouples the identity proxy from the management functions. It also simplifies management by only using Ethereum addresses as keys (which I have renamed to `roles`). I think this is adequate and sufficient for the overwhelming majority of use cases relating to end users, meta transactions, and universal login. If more advanced signature schemes are desired, there is nothing preventing anyone from adding additional methods to an identity manager contract.

The roles in in the identity manager can be used for off-chain message signing as well as on-chain transaction execution. The `executeSigned` method is designed specifically to allow applications to pay for their users' transactions.

I suggest the following representation of role levels:

- 0: no role
- 1: management role (all privileges)
- 2: action role (can execute transactions but cannot manage roles)
- 3: encryption role (cannot perform any on-chain actions; used for off-chain message signing and verification)

### ERCXXXX_ClaimManager

```
interface ERCXXXX_ClaimManager {
    function getClaim(address subject, bytes32 key) external constant returns(bytes32);
}

interface ERCXXXX_ClaimIssuerRegistry {
    function setClaimManager(address claimManager) external;
    function getClaim(address issuer, address subject, bytes32 key) external constant returns(bytes32);
}
```

This is inspired by ERC780, but it allows the issuer to implement the `getClaim` method however they like (it just needs to conform to the interface). *It is fully backwards compatible with ERC780.*

There is a global `ClaimIssuerRegistry` contract, which simply allows a `ClaimManager` contract to be associated with an issuer address. This allows the issuer to implement their own custom issuing contract, which is flexible and allows computable claims to be implemented.

The `getClaim` method on the `ClaimIssuerRegistry` contract MUST be implemented as follows: if the given `issuer` does not have an associated `ClaimManager` contract, ERC780's `getClaim` method should be called with the given arguments. If there is an associated `ClaimManager` contract, then the `getClaim` method on that contract should be called, passing in the given `subject` and `key`.

## This Codebase

There are a lot of contracts here. Some of them are definitions/implementations of existing standards; others are implementations of the standards I have defined here.

The tests demonstrate usage of these standards. They can be run with `npm test` (after you have done an `npm install`).
