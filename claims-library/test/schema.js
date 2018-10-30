const assert = require('assert')
const Ajv = require('ajv')
const schema = require('../schemas/0.0.0.json')
const ajv = new Ajv()

function assertValid(data) {
  assert.equal(ajv.validate(schema, data), true)
}

function assertInvalid(data) {
  assert.equal(ajv.validate(schema, data), false)
}

describe('schema', function() {
  it('should validate the example on the W3C website', function() {
    // https://www.w3.org/TR/verifiable-claims-data-model/#x4.1.2-expressing-an-entity-credential-in-json
    assertValid({
      id: 'http://example.gov/credentials/3732',
      type: ['Credential', 'ProofOfAgeCredential'],
      issuer: 'https://dmv.example.gov',
      issued: '2010-01-01',
      claim: {
        id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
        ageOver: 21
      }
    })
  })

  it('should not be valid without the "Credential" type', function() {
    // https://www.w3.org/TR/verifiable-claims-data-model/#x4.1.2-expressing-an-entity-credential-in-json
    assertInvalid({
      id: 'http://example.gov/credentials/3732',
      type: ['ProofOfAgeCredential'],
      issuer: 'https://dmv.example.gov',
      issued: '2010-01-01',
      claim: {
        id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
        ageOver: 21
      }
    })
  })

  it('should not be valid without all required fields', function() {
    // https://www.w3.org/TR/verifiable-claims-data-model/#x4.1.2-expressing-an-entity-credential-in-json
    assertInvalid({
      id: 'http://example.gov/credentials/3732',
      type: ['Credential', 'ProofOfAgeCredential'],
      issuer: 'https://dmv.example.gov',
      claim: {
        id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
        ageOver: 21
      }
    })
  })
})
