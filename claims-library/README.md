# claimtastic.js

*work in progress*

This is a minimal javascript library for managing *claims* (TODO define claims). It conforms to [w3c verifiable claims](https://www.w3.org/TR/verifiable-claims-data-model/), with the goal of making this standard easy to use in the real world.

This library is platform-agnostic. That is, it is not tied to any specific implementation on any particular platform. It parameterizes platform-specific details.

## Rationale

I'm trying to build a particular claims system but I want to avoid creating a walled garden. I'd rather have my implementation be a part of a larger and open ecosystem. So I'm trying to modularize this implementation, abstracting it out into multiple layers to maximize reusability and interoperability. This library is the first of these layers (i.e. the base layer).

This library attempts to be as unopinionated and flexible as possible, in order to encourage anyone else building claims systems to use this as a base layer. Actually, I don't really care if we use this library or another one. I would just like to see people coordinating on an open ecosystem rather than building a bunch of walled gardens. If you think a better alternative exists and think I should use it instead of this, please let me know.

## Terms
- `identity`
- `claim`
- `issuer`
- `subject`
- `type`
- `implementation`: an application of this framework on a particular platform (multiple implementations per platform are allowed). This library should be used, with values passed in for the parameters.

## Library

This library is a javascript class. The parameters are passed into the constructor.

### Parameters

#### lookup function (required)
- input:
  - `id`: `id` of subject (string)
- returns: array of claims (json)

#### validation function
- input:
  - `claim`: claim (json)
- returns: validity of claim (boolean)

```javascript
function lookup(id) {
  // ...
  return claims
}

function validate(claim) {
  // ...
  return isValid
}

const myImplementation = new Claimtastic(lookup, validate)
```

### Methods

#### getValidClaims

Retrieves all valid claims for a given identifier. To be considered valid, not only must the claim be valid as determined by the validation function; it must also conform to the JSON schema.

- input:
  - `id`: `id` of subject identity (string)
- returns: array of claims (json)

```javascript
const myImplementation = new Claimtastic(lookup, validate)

const claims = myImplementation.getValidClaims(id)
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
