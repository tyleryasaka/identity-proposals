const Claimtastic = require('../../claims-library/src/claimtastic.js')
const Box = require('@tyleryasaka/3box')
const IdentityContract = require('../../build/contracts/Identity.json')
const Web3 = require('web3')

class ClaimtasticEthereum extends Claimtastic {
  constructor({ web3 }) {
    super()
    const provider = web3 ? web3.currentProvider : Web3.givenProvider
    this.web3 = new Web3(provider)
  }

  async unlock({ box } = {}) {
    const boxInstance = box || Box
    const accounts = await this.web3.eth.getAccounts()
    this.walletAddress = accounts[0]
    this.box = await boxInstance.openBox(this.walletAddress, this.web3.currentProvider)
    this.unlocked = true
  }

  _requireUnlocked() {
    if (!this.unlocked) {
      throw new Error('ClaimtasticEthereum has not been unlocked yet')
    }
  }

  async createIdentity() {
    this._requireUnlocked()
    const identityContract = new this.web3.eth.Contract(IdentityContract.abi)
    const deployment = identityContract.deploy({
      data: IdentityContract.bytecode,
      arguments: [this.walletAddress]
    })
    const receipt = await new Promise(resolve => {
      deployment.send({ from: this.walletAddress }).on('receipt', resolve)
    })
    await this.box.public.set('identity-contract', receipt.contractAddress)
    const id = await this.getSubjectId(this.walletAddress)
    return id
  }

  async getSubjectId(walletAddress) {
    walletAddress = walletAddress || this.walletAddress
    try {
      const profile = await Box.getProfile(walletAddress)
      const identityContract = profile['identity-contract']
      if (!identityContract) {
        return null
      }
      return `did:erc725:${identityContract}`
    } catch(e) {
      if (JSON.parse(e).message === 'address not linked') {
        return null
      } else {
        throw e
      }
    }
  }

  async _getClaims(subjectId) {
    this._requireUnlocked()
    return (await this.box.public.get('claims')) || []
  }

  async _isValid(claim) {
    // self claims are automatically valid
    if (claim.type.includes('SelfClaim') && claim.issuer === claim.claim.id) {
      return true
    }
    return false
  }

  async _addClaim(claim) {
    this._requireUnlocked()
    claim.id = this.web3.utils.sha3(JSON.stringify(claim))
    const claims = (await this.box.public.get('claims')) || []
    if (!claims.map(claim => claim.id).includes(claim.id)) {
      claims.push(claim)
      await this.box.public.set('claims', claims)
      return true
    } else {
      throw new Error(`Claim with id ${claim.id} already exists`)
    }
  }
}

module.exports = ClaimtasticEthereum
