---

eip: XXXX
title: Minimal Identity Proxy
author: Tyler Yasaka (@tyleryasaka)
discussions-to: https://github.com/ethereum/EIPs/issues/XXXX
status: WIP
type: Standards Track
category: ERC
created: 2018-XX-XX
---

## Simple Summary
A standard interface for a minimal identity proxy.

## Abstract

This standard describes an identity **proxy** contract that is **decoupled from management logic**. It is a *proxy* because it accepts instructions to execute arbitrary contract calls. It is *decoupled from management logic* because it allows any valid Ethereum address to be its owner. This allows management of the identity to be deferred either to a wallet or to a management contract, creating a separation of concerns. It also allows the management logic to be upgraded over time while keeping the address of the identity constant.

## Motivation

Standardizing a minimal interface for an identity proxy allows third parties to interact with various identity proxy contracts in a consistent manner. Such third parties might include but are not limited to: wallet clients, Dapps, and identity management contracts.

## Specification

#### owner

Returns the current owner of the contract. Matches the signature of the corresponding method in OpenZeppelin's [Ownable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) contract as closely as possible.

```
function owner() external view returns(address);
```

#### transferOwnership

Changes the current owner to `newOwner`. Matches the signature of the corresponding method in OpenZeppelin's [Ownable](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol) contract as closely as possible.

```
function transferOwnership(address newOwner) external;
```

#### execute

Executes an action on other contracts or a transfer of ether. MUST only be called by the current owner of the contract. Matches the signature of the corresponding method in [ERC725](https://github.com/ethereum/EIPs/issues/725) as closely as possible.

```
function execute(address to, uint256 value, bytes data, uint256 operationType) external;
```

## Rationale
A lot of work has already been done around identity, and the goal here is not to reinvent the wheel. Rather, it is intended to be a progression of existing work. The identity proxy contract is far from an original concept. The purpose of standardizing it here is to formally define a minimum interface to encourage all projects that implement identity proxies to be interoperable.

The purpose of an identity proxy is to allow an entity to exist as a [first-class citizen](https://medium.com/@tyleryasaka/the-3-essentials-of-identity-in-ethereum-51fba7e1dd32) in Ethereum, with the ability to execute arbitrary contract calls, but with more complex management logic than what can be performed with a mere wallet. It also opens up the possibility of [meta transactions](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84), where a third party can trigger executions on behalf of an identity. Further, identity proxies can be the recipients of claims [via ERC780](https://github.com/ethereum/EIPs/issues/780), allowing claims to be held over a long period of time even if a user changes wallets.

Inspiration for this began with [ERC725](https://github.com/ethereum/EIPs/issues/725). ERC725 attempts to solve the same problems; however, the concern with ER725 is that it couples the identity proxy with a management scheme. This scheme is not only too complex for some use cases, but it is also not upgradable over time. Arguably, these issues arise from a lack of separation of concerns. This criticism has been elaborated by Tyler Yasaka in [this blog post](https://medium.com/@tyleryasaka/erc725-proposed-changes-ea2dc221136e). The community responded favorably to the idea of decoupling the identity proxy from the management scheme. The author of ERC725, [@frozeman](https://github.com/frozeman?tab=overview&from=2018-09-01&to=2018-09-30), responded [on the ER725 discussion](https://github.com/ethereum/EIPs/issues/725#issuecomment-431615263) and [Twitter](https://twitter.com/feindura/status/1053740219357380609) to the blog post.

It is also worth noting that uPort previously implemented an [almost identical architecture](https://github.com/uport-project/uport-identity/blob/develop/contracts/Proxy.sol). They have since [abandoned this approach](https://medium.com/uport/next-generation-uport-identity-app-released-59bbc32a83a0). Nonetheless, others in the community retain interest in identity proxy contracts.

Other attempts at standardizing identity do not directly address a minimal proxy contract interface:
- [ERC1056](https://github.com/ethereum/EIPs/issues/1056) is a registry that associates an identity (represented as an address) to an owner (also an address). This does not provide all of the functionality that a proxy contract provides. Namely, there is no way using 1056 to execute an arbitrary contract call where `msg.sender` is the address of the identity itself.
- [ERC1077](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1077.md) proposes a standard for a third party executing transactions on the behalf of an identity (meta transactions). It is intended to be used alongside ERC725. This is a related but separate concern from identity proxies. In [this repo](https://github.com/tyleryasaka/identity-proposals), Tyler Yasaka has implemented a proof of concept where an identity manager that supports meta transactions (in a similar fashion to ERC1077) can be used alongside an identity proxy.
- [ERC1484](https://github.com/ethereum/EIPs/issues/1495) attempts to "aggregate" multiple identity standards into a common format. Like ERC1056, it does not address the specific issue of executing a contract call where `msg.sender` is the identity itself. In fact, identities are represented by numbers in this standard, not addresses.


## Implementation

- [Implementation by Tyler Yasaka](https://github.com/tyleryasaka/identity-proposals)


### Solidity Interface
```
pragma solidity ^0.4.24;

interface ERCXXXX {
    function owner() external view returns(address);
    function transferOwnership(address newOwner) external;
    function execute(address to, uint256 value, bytes data, uint256 operationType) external;
}
```

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
