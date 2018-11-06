const Ajv = require('ajv')
const schema = require('../schemas/0.0.0.json')
const hash = require('object-hash')

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
    if (this._isValidSignature === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without an "_isValidSignature" method.')
    }
    if (this._getClaims === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without a "_getClaims" method.')
    }
    if (this._addClaim === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without an "_addClaim" method.')
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
      const hash = this._hashClaim(claim)
      const signature = claim.signature.signatureValue
      const issuer = claim.issuer
      return await this._isValidSignature(hash, signature, issuer)
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
    const targetClaim = subjectClaims.find(c => c.id === claimId)
    if (!targetClaim) {
      throw new Error(`Claim with id ${claimId} not found on subject ${subjectId}`)
    }
    const claim = {
      type: ['Credential', 'Attestation'],
      issuer: issuerId,
      issued,
      claim: {
        id: subjectId,
        data: targetClaim
      }
    }
    const hash = this._hashClaim(claim)
    const signature = await this._signClaim(hash)
    claim.signature = { signatureValue: signature }
    // the subject identity should add this claim to their account
    return claim
  }

  _hashClaim(claim) {
    return hash(claim, {
      excludeKeys: (key) => {
        return (key === 'id') || (key === 'signature')
      }
    })
  }
}

module.exports = Claimtastic
