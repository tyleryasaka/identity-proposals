const Ajv = require('ajv')
const schema = require('../schemas/0.0.0.json')

const requiredMethods = ['isValid', 'getClaims']

const SELF_CLAIM_TYPE = 'SelfClaim'
const ATTESTATION_TYPE = 'Attestation'

function getToday() {
  const today = new Date()
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
}

class Claimtastic {
  constructor() {
    const ajv = new Ajv()
    this._isValidStructure = ajv.compile(schema)

    // check that methods are implemented
    if (this._isValid === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without an "isValid" method.')
    }
    if (this._getClaims === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without a "getClaims" method.')
    }
    if (this._addClaim === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without an "addClaim" method.')
    }
  }

  isValidStructure(claim) {
    return this._isValidStructure(claim)
  }

  isSelfClaim(claim) {
    return claim.type.includes(SELF_CLAIM_TYPE) && (claim.issuer === claim.claim.id)
  }

  async getClaims(subjectId) {
    const claims = await this._getClaims(subjectId)
    const claimsValidity = await Promise.all(claims.map(async claim => {
      if (!this._isValidStructure(claim)) {
        return false
      }
      if (this.isSelfClaim(claim)) {
        return true
      }
      return await this._isValid(claim)
    }))
    const validClaims = claims.filter((claim, c) => {
      return claimsValidity[c]
    })
    return validClaims
  }

  async getSelfClaims(subjectId) {
    const claims = await this.getClaims(subjectId)
    return claims.filter(claim => {
      return claim.type.includes(SELF_CLAIM_TYPE)
    })
  }

  async getAttestations(subjectId, claimId) {
    const claims = await this.getClaims(subjectId)
    return claims.filter(claim => {
      return claim.type.includes(ATTESTATION_TYPE) && (claim.targetClaim === claimId)
    })
  }

  async addClaim(claim) {
    const success = await this._addClaim(claim)
    return success
  }

  async addSelfClaim(subjectId, claimType, claimData) {
    claimData.id = subjectId
    const claim = {
      type: ['Credential', 'SelfClaim', claimType],
      issuer: subjectId,
      issued: getToday(),
      claim: claimData
    }
    const success = await this._addClaim(claim)
    return success
  }

  async issueAttestation(subjectId, claimId, issuerId) {
    const issued = getToday()
    const subjectClaims = await this.getClaims(subjectId)
    const claim = subjectClaims.find(c => c.id === claimId)
    if (!claim) {
      throw new Error(`Claim with id ${claimId} not found on subject ${subjectId}`)
    }
    const signature = await this._signClaim(claim)
    // the subject identity should add this claim to their account
    return {
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
    }
  }
}

module.exports = Claimtastic
