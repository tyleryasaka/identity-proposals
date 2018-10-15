# Identity Standards Proposals

This began as a demonstration of how [ERC725](https://github.com/ethereum/EIPs/issues/725) can be split into two separate standards, keeping a separation of concerns between identity and key management.

Now, this has evolved into a full-fledged exploration of identity standards and includes some proposed standards to support **flexible, long-lasting identity management for users on Ethereum**.

## Rationale

When designing these standards, I think it is important to be crystal clear regarding what problem(s) we are attempting to solve. I will describe my goals here.

### 1. Universal Login

Here I want to fill an important gap that I think exists in the Ethereum ecosystem. For all intents and purposes, wallets are essentially acting as users' identities on the blockchain. This forbids any sort of wise identity management solution. Such a solution would allow keys to be rotated over time, and would allow for a hierarchy of keys for management. A master key might grant you full control of your identity, but would be something that you would want to keep somewhere safe (i.e. not on your phone). However, you could have a lower level key that you carry on your phone. If you lose your phone and think the private key could be compromised, no problem. You can simply use your master key to remove that key. Bottom line: we want to decouple the wallet from the identity.

This is related to [meta transactions](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84).

I believe there is value in standardizing a universal login; this allows users to be able to manage their identity across various browsers/clients.

Picture this: a user is browing a Dapp on Chrome with Metamask. They do something in the Dapp which triggers the Metamask popup window. They see the normal transaction flow, but instead of seeing the wallet, they see the identity that they are logged in as. The transaction executes on the blockchain, but interestingly: the wallet makes the transaction call, but on the Dapp, the identity's address is displayed as the author of the call (not the wallet). This is because the identity is a proxy contract, and the wallet simply told the identity what action to perform.

### 2. Claims

A claim is simply a statement made by one identity (the issuer) about another (the subject). There are a lot of use cases for claims. For example, a government entity might issue a claim saying that someone has a valid driver's license. Another use case could be notarization. Someone could digitally sign a statement saying that they witnessed a certain event.

Picture this: my local government has issued a claim saying that I am eligible to purchase alcohol. I go to a restaurant for dinner and order wine. The restaurant has an app that can quickly check that I have a valid government-issued claim stating that I am allowed to make the purchase. Then I go to the bar afterwards. I decide to get beer this time. Because there is a standard place to look for the "allowed to purchase alcohol" claim, the bar can use its own app to look this up.

This may or not be a realistic real-world scenario in the near future, but regardless it should not be difficult to see the value in having standardized claims lookup.

### 3. Decentralized Architecture

While exploring identity solutions, I had an epiphany. I realized that there are certain systems that are *interactive* in nature. By interactive, I mean that they involve relations between decision-making agents. Example of these types of systems are games, economies... and yes, claims-based systems.

I also have conceptualized two different approaches for modeling interactive systems on Ethereum. I call them the registry method and the delegate method.

The *registry method* defines a contract to act as a central repository of all activity in a given context. So in the context of claims, this registry is a claims registry (such as [ERC780](https://github.com/ethereum/EIPs/issues/780)). In the context of a game of [block-paper-scissors](https://github.com/monospaced-out/block-paper-scissors), this might be a [contract that stores all moves in the game](https://github.com/monospaced-out/block-paper-scissors/blob/master/contracts/BlockPaperScissors.sol).

The *delegate method* instead allows each agent (i.e. each identity) to deploy its own context-specific *delegate contract* to represent it in that context. So for block-paper-scissors, I might deploy a contract and declare it to be my delegate for that game. I would record all of my plays in that contract. For claims, I might declare a claims contract and declare it to be my delegate for claims.

Generalizing a bit, I would call the registry method a *centralized architecture*. And I would call the delegate method a *decentralized architecture*. Benefits of centralized architecture are simplicity and efficiency, and providing a central index for all activity in a given context. Benefits of decentralized architecture are flexibility and lack of a central point of failure. I think there are some scenarios in which centralized architectures make sense, and others in which decentralized architectures make sense.

I think in the world of identity and claims, decentralized architecture should at least be an option. Applications should be able to determine on a case-by-case basis what architecture they wish to use. I think for claims at the very least, a decentralized architecture makes sense. Thus I think that **a good identity standard will be compatible with both centralized and decentralized architectures**.

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

Standardizing is hard; we have to think about what things should be standardized, and what things should be left to implementation. We also have to think about the purpose of standardization. Do we want various user-facing clients to have a common contract interface? Or do we want to provide a consistent contract-to-contract interface? If something is standardized, there should be a clear use case that it intends to solve.

With that in mind, it may turn out that some of my ideas in here should just be implementation suggestions rather than standards.

### ERCXXXX_KeyManager

This is for now a placeholder, until I have had time to think through this further. That said, an easy starting place would be to use the key management functions of ERC725, as I suggested in my [Medium post](https://medium.com/@tyleryasaka/erc725-proposed-changes-ea2dc221136e). The value I can see in standardizing this is around UI. Might add value in allowing multiple clients to help a user manage an identity.

### ERCXXXX_Identity

```
contract ERCXXXX_Identity {
    event Executed(address indexed to, uint256 indexed value, bytes data);
    event ExecutionFailed(address indexed to, uint256 indexed value, bytes data);

    function execute(address _to, uint256 _value, bytes _data) public returns (bool _success);
    function setDelegate(bytes32 delegateType, address delegate) public;
    function getDelegate(bytes32 delegateType) public view returns (address delegate);
}
```

This is heavily inspired by ERC725, but it has some major modifications. It strips out all of the key management functions, and adds `setDelegate` and `getDelegate`. A `delegate` is represented by an address and is referenced by a `delegateType`. There is one `delegate` per identity per `delegateType`.

The purpose of a delegate is to represent the identity in a specific context, in the spirit of the decentralized architecture I defined above. For example, a delegate for claims would be a contract that holds all claims issued by the associated identity. The `delegateType` can be used to specify the context.

Delegates can be thought of as a way to extend the functionality of the identity contract. The contract can't be changed or upgraded, but delegates can. The delegates allow the identity contract to essentially gain new abilities over time as needed.

Would love feedback on the delegate idea - does it make sense or would it be better to leave it out?

### ERCXXXX_ClaimIssuer

```
contract ERCXXXX_ClaimIssuer {
    function getClaim(address subject, bytes32 key) public constant returns(bytes32);
}
```

The claim manager standard should be implemented by the delegate contract for claims for an identity. So if I want to issue claims, I would first deploy an implementation of `ERCXXXX_ClaimIssuer`. Then I would call `setDelegate` on my identity, passing in the address of my `ERCXXXX_ClaimIssuer` contract as the delegate address. (The `delegateType` should be coordinated and perhaps even standardized to some degree; I would propose `0x0000000000000000000000000000000000000000000000000000000000000000` as the delegateType for issued claims.)

## This Codebase

There are a lot of contracts here. Some of them are definitions/implementations of existing standards; others are implementations of the standards I have defined here. I also added a library that for now just has a convenience method for looking up a claim issued using `ERCXXXX_Identity` and `ERCXXXX_ClaimIssuer`. Note that this method has the *exact* same parameters and return value as ERC780's `getClaim` method. I did my best to keep these standards as interoperable as possible.

The tests demonstrate usage of these standards. They can be run with `npm test` (after you have done an `npm install`).
