const Ajv = require('ajv')
const schema = require('../schemas/0.0.0.json')

const requiredMethods = ['isValid', 'getClaims']

class Claimtastic {
  constructor() {
    const ajv = new Ajv()
    this._isValidSchema = ajv.compile(schema)

    // check that methods are implemented
    if (this.isValid === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without an "isValid" method.')
    }
    if (this.getClaims === undefined) {
      throw new TypeError('The "Claimtastic" class is abstract. It cannot be instantiated without a "getClaims" method.')
    }
  }

  isValidSchema(claim) {
    return this._isValidSchema(claim)
  }

  async getValidClaims(id) {
    const claims = await this.getClaims(id)
    const claimsValidity = await Promise.all(claims.map(async claim => {
      return this.isValidSchema(claim) && (await this.isValid(claim))
    }))
    const validClaims = claims.filter((claim, c) => {
      return claimsValidity[c]
    })
    return validClaims
  }
}

module.exports = Claimtastic
