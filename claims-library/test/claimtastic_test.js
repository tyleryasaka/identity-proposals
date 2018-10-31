const { assert } = require('chai')
const Claimtastic = require('../src/claimtastic.js')

const subjectId_1 = 'did:example:1'
const subjectId_2 = 'did:example:2'

const invalidSchemaClaim = {
  id: 'http://example.gov/credentials/3732',
  claim: {
    id: subjectId_1
  },
  amIValid: 'yes'
}
const invalidClaim = {
  id: 'http://example.gov/credentials/3733',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    ageOver: 21
  },
  amIValid: 'no'
}
const validClaim_1 = {
  id: 'http://example.gov/credentials/3734',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    ageOver: 21
  },
  amIValid: 'yes'
}
const validClaim_2 = {
  id: 'http://example.gov/credentials/3735',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    ageOver: 18
  },
  amIValid: 'yes'
}
const validClaim_3 = {
  id: 'http://example.gov/credentials/3736',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_2,
    ageOver: 21
  },
  amIValid: 'yes'
}

class MyImplementation extends Claimtastic {
  constructor() {
    super()
    // do custom things
  }

  async _isValid(claim) {
    // example only. not a good validation method.
    return Promise.resolve(claim.amIValid === 'yes')
  }

  async _getClaims(id) {
    const claims = [invalidSchemaClaim, validClaim_1, invalidClaim, validClaim_2, validClaim_3]
    return Promise.resolve(claims.filter(claim => claim.claim.id === id))
  }

  async _addClaim(subjectId, claim) {
    // TODO
  }
}

describe('Claimtastic', function() {
  describe('constructor', function() {
    it('should throw an error if instantiated directly', function() {
      assert.throws(
        () => { new Claimtastic() },
        TypeError,
        'The "Claimtastic" class is abstract. It cannot be instantiated without an "isValid" method.'
      )
    })
  })

  describe('getClaims', function() {
    it('should use the isValid and getClaim methods to return valid claims', async function() {
      const myImplementation = new MyImplementation()
      const validClaims = await myImplementation.getClaims(subjectId_1)
      console.log('claims', validClaims)

      // valid claims for id should be returned
      assert.deepInclude(validClaims, validClaim_1)
      assert.deepInclude(validClaims, validClaim_2)

      // invalid schema should not be returned
      assert.notDeepInclude(validClaims, invalidSchemaClaim)

      // invalid claim should not be returned
      assert.notDeepInclude(validClaims, invalidClaim)

      // claim for other id should not be returned
      assert.notDeepInclude(validClaims, validClaim_3)
    })
  })
})
