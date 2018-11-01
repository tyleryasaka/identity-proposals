# claimtastic.js

*work in progress*

This is a *abstract* javascript library for managing *claims* (TODO define claims). It conforms to [w3c verifiable claims](https://www.w3.org/TR/verifiable-claims-data-model/), with the goal of making this standard easy to use in the real world.

I call the library *abstract* because it cannot be used on its own. It is more like an interface that allows other libraries to fill in the implementation details. This library is a Javascript class that can be extended.

## Rationale

There are a lot of ways that decentralized claims can be implemented. It seems unclear right now what the "right" approach is, or whether there will ever be one.

With this in mind, I want people to be able to begin building claims implementations without being locked in to them. One step toward avoiding lock-in is to have a standard interface for interacting with claims, and a standard format for representing them. Thankfully the format already exists (see [W3C Verifiable Claims](https://www.w3.org/TR/verifiable-claims-data-model/)).

This library, then, makes this format easy to use and creates a standard javascript interface.

## Terms
- `identity`
- `claim`
- `self claim`
- `attestation`
- `issuer`
- `subject`
- `type`
- `implementation`: an application of this framework on a particular platform (multiple implementations per platform are allowed). This library should be used, with values passed in for the parameters.

## Library

This library is an "abstract" javascript class. (Abstract classes don't currently exist in Javascript, but this class pretends to be abstract.) It cannot be used directly; rather, specific implementations should define the missing methods.

### Unimplemented methods

Implementations (inherited classes) should define these methods. Javascript doesn't currently have the concept of private methods, but these methods are intended for internal use only (they are used by the public methods).

#### \_getClaims
- input:
  - `subjectId`: `id` of subject (string)
- returns: promise -> array of claims (json)

#### \_isValid
- input:
  - `claim`: claim (json)
- returns: promise -> validity of claim (boolean)

#### \_addClaim
- input:
  - `subjectId`: `id` of subject identity (string)
  - `claim`: the claim object (json)
- returns: promise -> success (boolean)

```javascript
class MyImplementation extends Claimtastic {
  constructor() {
    super()
    // ...
  }

  async _getClaims(subjectId) {
    // ...
    return claims
  }

  async _validate(claim) {
    // ...
    return isValid
  }

  async _addClaim(subjectId, claim) {
    // ...
    return success
  }
}
```

### Public Methods

#### getClaims

Retrieves all valid claims for a given subject identifier. To be considered valid, not only must the claim be valid as determined by the validation function; it must also conform to the JSON schema.

- input:
  - `subjectId`: `id` of subject identity (string)
- returns: promise -> array of claims (json)

```javascript
const myImplementation = new MyImplementation()

const claims = await myImplementation.getClaims(subjectId)
```

#### getSelfClaims

Self claims are things that the identity says about itself. E.g. "This is my facebook profile" or "I'm a US citizen". A self claim is just a statement - not guaranteed to be true in any way.

- input:
  - `subjectId`: `id` of subject identity (string)
- returns: promise -> array of claims (json)

```javascript
const myImplementation = new MyImplementation()

const selfClaims = await myImplementation.getSelfClaims(subjectId)
```

#### getAttestations

Attestations are claims by others about the validity of a self claim. E.g. "I have verified that this Facebook profile belongs to this person" or "I have verified that this person is a US citizen". An attestation references a self-claim; a self-claim can have multiple attestations (from different issuers).

- input:
  - `subjectId`: `id` of subject identity (string)
  - `claimId`: `id` of self claim (string)
- returns: promise -> array of claims (json)

```javascript
const myImplementation = new MyImplementation()

const selfClaims = await myImplementation.getSelfClaims(subjectId)
const someSelfClaim = selfClaims[0]

const attestations = await myImplementation.getAttestations(subjectId, someSelfClaim.id)
```

#### addClaim

Adds a claim to an identity. Only the subject identity should be authorized to do this.

- input:
  - `claim`: the claim object (json)
- returns: promise -> success (boolean)

```javascript
const myImplementation = new MyImplementation()

const claim = {
  id: 'http://example.gov/credentials/3732',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
    ageOver: 21
  }
}

const claimAdded = await myImplementation.addClaim(claim)
```

#### addSelfClaim

Convenience method for adding a self-claim to an identity. Only the subject identity should be authorized to do this.

- input:
  - `subjectId`: `id` of subject identity (string)
  - `claimType`: `type` of new self claim (string)
  - `claimData`: data for new self claim (json)
- returns: promise -> success (boolean)

```javascript
const myImplementation = new MyImplementation()

const claimType = 'ProofOfAgeCredential'
const claimData = { ageOver: 21 }

const claimAdded = await myImplementation.addSelfClaim(subjectId, claimType, claimData)
```

#### addAttestation

Convenience method for adding an attestation to an identity. Only the subject identity should be authorized to do this.

- input:
  - `subjectId`: `id` of subject identity (string)
  - `claimId`: `id` of self claim (string)
  - `issuerId`: `issuer` id of attestation (string)
  - `issued`: `issued` date that attestation was made (string)
  - `signature`: signed message of self claim (string)
- returns: promise -> success (boolean)

```javascript
const myImplementation = new MyImplementation()

const subjectId = 'did:example:ebfeb1f712ebc6f1c276e12ec21'
const claimId = 'http://example.gov/credentials/3732'
const issuerId = 'https://dmv.example.gov'
const issued = '2010-01-01'
const signature = 'BavEll0/I1zpYw8XNi1bgVg/sCneO4Jugez8RwDg...'

const attestationAdded = await myImplementation.addSelfClaim(subjectId, claimId, issuerId, issued, signature)
```

### Schema

The schemas will be versioned; all versions are stored in [schemas](./schemas). The current version is [0.0.0](./schemas/0.0.0.json). Schemas are [JSON schemas](https://json-schema.org/) which should define a document that is a valid [w3c verifiable claim](https://www.w3.org/TR/verifiable-claims-data-model/). These schemas should be considered a subset of the w3c verifiable claim spec: a given document might not conform to the current schema, but still conform to w3c. But if a document does not conform to w3c, it should not conform to the current schema.

The purpose of defining a JSON schema in this framework is convenience. JSON schemas are easy for developers to read, are unambiguous, and can be automatically validated using tools such as [ajv](https://github.com/epoberezkin/ajv).

### Types

To make claims interoperable, platform implementations should coordinate on `type`s. The table below should serve as a reference for currently standardized types. Anyone is welcome to make a pull request to update this table with new `type`s. The intention is for it to grow over time.

`Type` is the integer representation of the `type`. `Name` is a human-friendly title for the `type`. And `description` should provide information about its purpose and usage.

To make things less confusing, it's probably best to attempt to group similar `type`s under ranges of integers. For example, the range 1000-1999 could perhaps be reserved for social media claims; 2000-2999 for government-issue claims; etc.

I have kicked things off with `0`: `spirit animal`.

| Type | Name | Description |
| --- | --- | --- |
| 0 | spirit animal | this should be a self-claim, the value of which should be the identity's self-proclaimed spirit animal |

### Implementations

Anyone that builds an implementation on top of this library is welcome to make a PR to update this table.

| Implementation | Name | Url |
| --- | --- | --- |
| | | |
