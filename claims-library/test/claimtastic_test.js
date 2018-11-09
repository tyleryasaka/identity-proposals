const { assert } = require('chai')
const Claimtastic = require('../src/claimtastic.js')

const subjectId_1 = 'did:example:1'
const subjectId_2 = 'did:example:2'

const invalidStructureClaim = {
  id: '851d7429e6fe4ce5eb94c741e83958fdd55b039e',
  claim: {
    id: subjectId_1
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}
const invalidClaim = {
  id: 'e860de95458480c8b2a7484216bc1aca890ec139',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    ageOver: 21
  },
  signature: {
    signatureValue: 'invalid-signature'
  }
}
const validClaim_1 = {
  id: 'e860de95458480c8b2a7484216bc1aca890ec139',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    ageOver: 21
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}
const validSelfClaim = {
  id: 'd9a8cc3ed051fc2acf7221f8aa1693cce2d0596d',
  type: ['Credential', 'SelfClaim', 'SpiritAnimal'],
  issuer: subjectId_1,
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    animal: 'northern bobwhite'
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}
const validClaim_3 = {
  id: '7ee3d30476dfae9796af2f3659cca3c3a0ad2b48',
  type: ['Credential', 'ProofOfAgeCredential'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_2,
    hello: 'world'
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}
const validAttestation = {
  id: '2690ac41cedc91e9b862f058d624712be94659b6',
  type: ['Credential', 'Attestation'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    targetClaim: 'd9a8cc3ed051fc2acf7221f8aa1693cce2d0596d',
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}
const otherAttestation = {
  id: '4e7a2d8e3ff3beb9af0c0a7cb587a0c59aafa347',
  type: ['Credential', 'Attestation'],
  issuer: 'https://dmv.example.gov',
  issued: '2010-01-01',
  claim: {
    id: subjectId_1,
    targetClaim: '7ee3d30476dfae9796af2f3659cca3c3a0ad2b48',
  },
  signature: {
    signatureValue: 'valid-signature'
  }
}

class MyImplementation extends Claimtastic {
  constructor() {
    super()
    this.addedClaims = []
    // do custom things
  }

  async _signClaim(claimHash) {
    return 'valid-signature'
  }

  async _isValidSignature(claimHash, signature, issuer) {
    return Promise.resolve(signature === 'valid-signature')
  }

  async _getClaims(id) {
    return Promise.resolve(this.addedClaims.filter(c => c.claim.id === id))
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
        'The "Claimtastic" class is abstract. It cannot be instantiated without the "_signClaim" method.'
      )
    })
  })

  describe('getClaims', function() {
    it('should return valid claims', async function() {
      const myImplementation = new MyImplementation()
      myImplementation.addedClaims = [validClaim_1]
      const validClaims = await myImplementation.getClaims(subjectId_1)
      const validBadgeIds = validClaims.badges.map(c => c.id)
      const validSelfClaimIds = validClaims.selfClaims.map(c => c.selfClaim.id)

      assert.include(validBadgeIds, validClaim_1.id)
    })

    it('should not return invalid claims', async function() {
      const myImplementation = new MyImplementation()
      myImplementation.addedClaims = [invalidStructureClaim, invalidClaim]
      const validClaims = await myImplementation.getClaims(subjectId_1)
      const validBadgeIds = validClaims.badges.map(c => c.id)

      assert.notInclude(validBadgeIds, invalidStructureClaim.id)
      assert.notInclude(validBadgeIds, invalidClaim.id)
    })

    it('should not return claims for other subjects', async function() {
      const myImplementation = new MyImplementation()
      myImplementation.addedClaims = [validClaim_3]
      const validClaims = await myImplementation.getClaims(subjectId_1)
      const validBadgeIds = validClaims.badges.map(c => c.id)

      assert.notInclude(validBadgeIds, validClaim_3.id)
    })

    it('should recognize self claims', async function() {
      const myImplementation = new MyImplementation()
      myImplementation.addedClaims = [validSelfClaim]
      const validClaims = await myImplementation.getClaims(subjectId_1)
      const validSelfClaimIds = validClaims.selfClaims.map(c => c.selfClaim.id)

      assert.include(validSelfClaimIds, validSelfClaim.id)
    })

    it('should recognize attestations', async function() {
      const myImplementation = new MyImplementation()
      myImplementation.addedClaims = [validSelfClaim, validAttestation, otherAttestation]
      const validClaims = await myImplementation.getClaims(subjectId_1)

      assert.equal(validClaims.selfClaims.length, 1)
      const validAttestations = validClaims.selfClaims[0].attestations
      const validAttestationIds = validAttestations.map(c => c.id)

      assert.include(validAttestationIds, validAttestation.id)
      assert.notInclude(validAttestationIds, otherAttestation.id)
    })
  })

  describe('addClaim', function() {
    it('should return the result of the _addClaim method', async function() {
      const myImplementation = new MyImplementation()
      const result = await myImplementation.addClaim(validClaim_1)
      assert.equal(result, validClaim_1.id)
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
      assert.ok(result)
      assert.equal(myImplementation.addedClaims.length, 1)
      assert.deepEqual(myImplementation.addedClaims[0], {
        id: result,
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

  describe('issueAttestation', function() {
    it('should construct an attestation', async function() {
      const subjectId = subjectId_1
      const issuerId = subjectId_2
      const signature = 'valid-signature'
      const myImplementation = new MyImplementation()
      await myImplementation.addClaim(validClaim_1)
      const attestation = await myImplementation.issueAttestation(
        subjectId,
        validClaim_1.id,
        issuerId
      )
      assert.ok(attestation)
      const issued = attestation.issued
      assert.deepEqual(attestation, {
        type: ['Credential', 'Attestation'],
        issuer: issuerId,
        issued: issued,
        claim: {
          id: subjectId,
          targetClaim: validClaim_1.id
        },
        signature: {
          signatureValue: signature
        }
      })
    })
  })
})
