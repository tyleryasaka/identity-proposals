const Ajv = require('ajv')
const schema = require('../schemas/0.0.0.json')

const requiredMethods = ['isValid', 'getClaims']

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

  async getClaims(id) {
    const claims = await this._getClaims(id)
    const claimsValidity = await Promise.all(claims.map(async claim => {
      return this._isValidStructure(claim) && (await this._isValid(claim))
    }))
    const validClaims = claims.filter((claim, c) => {
      return claimsValidity[c]
    })
    return validClaims
  }

  async addClaim(subjectId, claim) {
    if (!this._isValidStructure(claim)) {
      throw new Error('Error adding claim: claim structure is invalid')
    }
    const success = await this._addClaim(subjectId, claim)
    return success
  }
}

module.exports = Claimtastic
