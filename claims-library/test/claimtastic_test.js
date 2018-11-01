const { assert } = require('chai')
const Claimtastic = require('../src/claimtastic.js')

const subjectId_1 = 'did:example:1'
const subjectId_2 = 'did:example:2'

const invalidStructureClaim = {
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
const validSelfClaim = {
  id: 'http://example.gov/credentials/3735',
  type: ['Credential', 'SelfClaim', 'SpiritAnimal'],
  issuer: subjectId_1,
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    animal: 'northern bobwhite'
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
const validAttestation = {
  id: 'http://example.gov/credentials/3737',
  type: ['Credential', 'Attestation'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    verified: true
  },
  targetClaim: 'http://example.gov/credentials/3735',
  signature: {
    signatureValue: 'abc-123'
  },
  amIValid: 'yes'
}
const otherAttestation = {
  id: 'http://example.gov/credentials/3738',
  type: ['Credential', 'Attestation'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    verified: true
  },
  targetClaim: 'http://example.gov/credentials/other-id',
  signature: {
    signatureValue: 'abc-123'
  },
  amIValid: 'yes'
}

class MyImplementation extends Claimtastic {
  constructor() {
    super()
    this.addedClaims = []
    // do custom things
  }

  async _isValid(claim) {
    // example only. not a good validation method.
    return Promise.resolve(claim.amIValid === 'yes')
  }

  async _getClaims(id) {
    const claims = [invalidStructureClaim, validClaim_1, invalidClaim, validSelfClaim, validClaim_3, validAttestation, otherAttestation]
    return Promise.resolve(claims.filter(claim => claim.claim.id === id))
  }

  async _addClaim(claim) {
    // do stuff
    this.addedClaims.push(claim)
    const success = true
    return success
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

      // valid claims for id should be returned
      assert.deepInclude(validClaims, validClaim_1)
      assert.deepInclude(validClaims, validSelfClaim)

      // invalid schema should not be returned
      assert.notDeepInclude(validClaims, invalidStructureClaim)

      // invalid claim should not be returned
      assert.notDeepInclude(validClaims, invalidClaim)

      // claim for other id should not be returned
      assert.notDeepInclude(validClaims, validClaim_3)
    })
  })

  describe('getSelfClaims', function() {
    it('should return valid self claims', async function() {
      const myImplementation = new MyImplementation()
      const selfClaims = await myImplementation.getSelfClaims(subjectId_1)

      // valid claims for id should be returned
      assert.deepInclude(selfClaims, validSelfClaim)

      // non self claims should not be returned
      assert.notDeepInclude(selfClaims, validClaim_1)
      assert.notDeepInclude(selfClaims, invalidStructureClaim)
      assert.notDeepInclude(selfClaims, invalidClaim)
      assert.notDeepInclude(selfClaims, validClaim_3)
      assert.notDeepInclude(selfClaims, validAttestation)
    })
  })

  describe('getAttestations', function() {
    it('should return valid attestations', async function() {
      const myImplementation = new MyImplementation()
      const attestations = await myImplementation.getAttestations(subjectId_1, 'http://example.gov/credentials/3735')

      // valid claims for id should be returned
      assert.deepInclude(attestations, validAttestation)

      // non self claims should not be returned
      assert.notDeepInclude(attestations, validClaim_1)
      assert.notDeepInclude(attestations, invalidStructureClaim)
      assert.notDeepInclude(attestations, invalidClaim)
      assert.notDeepInclude(attestations, validClaim_3)
      assert.notDeepInclude(attestations, validSelfClaim)
      assert.notDeepInclude(attestations, otherAttestation)
    })
  })

  describe('addClaim', function() {
    it('should return the result of the _addClaim method', async function() {
      const myImplementation = new MyImplementation()
      const result = await myImplementation.addClaim(validClaim_1)
      assert.equal(result, true)
      assert.equal(myImplementation.addedClaims.length, 1)
      assert.deepEqual(myImplementation.addedClaims[0], validClaim_1)
    })
  })

  describe('addSelfClaim', function() {
    it('should construct a self claim and return the result of the _addClaim method', async function() {
      const today = new Date()
      const myImplementation = new MyImplementation()
      const claimType = 'SpiritAnimal'
      const claimData = {
        animal: 'northern bobwhite'
      }
      const result = await myImplementation.addSelfClaim(subjectId_1, claimType, claimData)
      assert.equal(result, true)
      assert.equal(myImplementation.addedClaims.length, 1)
      assert.deepEqual(myImplementation.addedClaims[0], {
        type: ['Credential', 'SelfClaim', 'SpiritAnimal'],
        issuer: subjectId_1,
        issued: `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`,
        claim: {
          id: subjectId_1,
          animal: 'northern bobwhite'
        }
      })
    })
  })

  describe('addAttestation', function() {
    it('should construct an attestation and return the result of the _addClaim method', async function() {
      const subjectId = subjectId_1
      const claimId = 'http://example.gov/credentials/3734'
      const issuerId = subjectId_2
      const issued = '1999-12-31'
      const signature = 'abc-123'
      const myImplementation = new MyImplementation()
      const result = await myImplementation.addAttestation(
        subjectId,
        claimId,
        issuerId,
        issued,
        signature
      )
      assert.equal(result, true)
      assert.equal(myImplementation.addedClaims.length, 1)
      assert.deepEqual(myImplementation.addedClaims[0], {
        type: ['Credential', 'Attestation'],
        issuer: issuerId,
        issued: issued,
        claim: {
          id: subjectId,
          verified: true
        },
        targetClaim: claimId,
        signature: {
          signatureValue: signature
        }
      })
    })
  })
})
