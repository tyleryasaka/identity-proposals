const Claimtastic = require('../../claims-library/src/claimtastic.js')
const Box = require('3box')
const IdentityContract = require('../../build/contracts/Identity.json')
const IdentityFactoryContract = require('../../build/contracts/IdentityFactory.json')
const Web3 = require('web3')

const KEY_DID = 'DID'
const KEY_CLAIMS = 'claims'

// for development purposes only
const RINKEBY_CONTRACT_ADDRESS = '0x0041c932B4EFe5c835959fA28BA2E0301d9712FA'

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
    await this.box.public.set(KEY_DID, this._getDID(receipt.contractAddress))
    await this.box.public.set(KEY_IDENTITY_MANAGEMENT_SCHEME, SCHEME_WALLET)
    return await this.getIdentity()
  }

  async createIdentityWithManager() {
    this._requireUnlocked()
    const identityFactoryContract = new this.web3.eth.Contract(
      IdentityFactoryContract.abi,
      RINKEBY_CONTRACT_ADDRESS
    )
    const tx = identityFactoryContract.methods.createIdentityWithManager()
    const receipt = await new Promise(resolve => {
      tx.send({ from: this.walletAddress }).on('receipt', resolve)
    })
    const identityAddress = receipt.events.CreatedIdentityWithManager.returnValues.identity
    await this.box.public.set(KEY_DID, this._getDID(identityAddress))
    await this.box.public.set(KEY_IDENTITY_MANAGEMENT_SCHEME, SCHEME_CONTRACT)
    return await this.getIdentity()
  }

  async getIdentity(walletAddress) {
    walletAddress = walletAddress || this.walletAddress
    const profile = await this._getProfile(walletAddress)
    return profile ? profile[KEY_DID] : null
  }

  _requireUnlocked() {
    if (!this.unlocked) {
      throw new Error('ClaimtasticEthereum has not been unlocked yet')
    }
  }

  async _signClaim(claim) {
    return ''
  }

  async _getProfile(walletAddress) {
    try {
      return await Box.getProfile(walletAddress)
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
    const wallet = subjectId ? (await this._getWallet(subjectId)) : this.walletAddress
    if (!wallet) {
      return []
    }
    const profile = await this._getProfile(wallet)
    if (!profile || !profile[KEY_CLAIMS]) {
      return []
    }
    return profile[KEY_CLAIMS]
  }

  async _isValid(claim) {
    // TODO
    return false
  }

  async _addClaim(claim) {
    this._requireUnlocked()
    claim.id = this.web3.utils.sha3(JSON.stringify(claim))
    const claims = (await this.box.public.get(KEY_CLAIMS)) || []
    if (claims.map(c => c.id).includes(claim.id)) {
      throw new Error(`Claim with id ${claim.id} already exists`)
    }
    claims.push(claim)
    await this.box.public.set(KEY_CLAIMS, claims)
    return true
  }

  _getDID(contractAddress) {
    return `did:erc725:${contractAddress}`
  }

  _getDIDWithManager(contractAddress) {
    return `did:erc725+:${contractAddress}`
  }

  async _getWallet(did) {
    const split = did.split(':')
    const scheme = split[1]
    const contractAddress = split[2]
    const identityContract = new this.web3.eth.Contract(
      IdentityContract.abi,
      contractAddress
    )
    const owner = await identityContract.methods.owner().call()
    if (scheme === 'erc725') {
      return owner
    } else if (scheme === 'erc725+') {
      // TODO think about how to get wallet from identity manager
    }
  }
}

module.exports = ClaimtasticEthereum
