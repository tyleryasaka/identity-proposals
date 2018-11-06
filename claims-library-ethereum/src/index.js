const Claimtastic = require('../../claims-library/src/claimtastic.js')
const Box = require('3box')
const IdentityContract = require('../../build/contracts/Identity.json')
const IdentityFactoryContract = require('../../build/contracts/IdentityFactory.json')
const ThreeBoxLinkerContract = require('../../build/contracts/ThreeBoxLinker.json')
const Web3 = require('web3')

const KEY_DID = 'DID'
const KEY_CLAIMS = 'claims'

// for development purposes only
const FACTORY_ADDRESS_RINKEBY = '0xa88127A96085091b468ecD4851f2db9CC8586327'
const LINKER_ADDRESS_RINKEBY = '0x88cbd9B79EA52e08E77cAb692D5e59a3Af685fc8'

class ClaimtasticEthereum extends Claimtastic {
  constructor({ web3 }) {
    super()
    const provider = web3 ? web3.currentProvider : Web3.givenProvider
    this.web3 = new Web3(provider)
  }

  async unlock({ box } = {}) {
    const boxInstance = box || Box
    const accounts = await this.web3.eth.getAccounts()
    this.web3.eth.defaultAccount = this.walletAddress = accounts[0]
    this.box = await boxInstance.openBox(this.walletAddress, this.web3.currentProvider)
    this.unlocked = true
  }

  async createIdentity() {
      this._requireUnlocked()
      const identityFactoryContract = new this.web3.eth.Contract(
        IdentityFactoryContract.abi,
        FACTORY_ADDRESS_RINKEBY
      )
      const threeBoxLinkerContract = new this.web3.eth.Contract(
        ThreeBoxLinkerContract.abi,
        LINKER_ADDRESS_RINKEBY
      )
      const executionData = threeBoxLinkerContract.methods.setThreeBox(this.walletAddress).encodeABI()
      const tx = identityFactoryContract.methods.createIdentityWithExecution(0, LINKER_ADDRESS_RINKEBY, 0, executionData)
      const receipt = await new Promise(resolve => {
        tx.send({ from: this.walletAddress }).on('receipt', resolve)
      })
      const identityAddress = receipt.events.CreatedIdentityWithManager.returnValues.identity
      await this.box.public.set(KEY_DID, this._getDID(identityAddress))
      return this.getIdentity()
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

  async _signClaim(claimHash) {
    // TODO: fix this. some reason signature recovery only works with data hashed this way.
    // this makes the signing data unreadable
    const secondHash = this.web3.utils.sha3(claimHash)
    return this.web3.eth.personal.sign(secondHash, this.walletAddress)
  }

  async _isValidSignature(claimHash, signature, issuer) {
    try {
      const secondHash = this.web3.utils.sha3(claimHash)
      const recovered = await this.web3.eth.personal.ecRecover(secondHash, signature)
      const issuerWallet = await this._getWallet(issuer)
      return this._checksum(recovered) === this._checksum(issuerWallet)
    } catch(e) {
      console.error(e)
      return false
    }
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

  _checksum(address) {
    return this.web3.utils.toChecksumAddress(address)
  }

  async _addClaim(claim) {
    this._requireUnlocked()
    claim.id = this._hashClaim(claim)
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

  async _getWallet(did) {
    const split = did.split(':')
    const contractAddress = split[2]
    const threeBoxLinkerContract = new this.web3.eth.Contract(
      ThreeBoxLinkerContract.abi,
      LINKER_ADDRESS_RINKEBY
    )
    return threeBoxLinkerContract.methods.getThreeBox(contractAddress).call()
  }

  // async deploy() {
  //   const accounts = await this.web3.eth.getAccounts()
  //   const threeBoxLinkerContract = new this.web3.eth.Contract(IdentityFactoryContract.abi)
  //   const deployment = threeBoxLinkerContract.deploy({
  //     data: IdentityFactoryContract.bytecode,
  //     arguments: []
  //   })
  //   const receipt = await new Promise(resolve => {
  //     deployment.send({ from: accounts[0] }).on('receipt', resolve)
  //   })
  //   console.log('deployed factory', receipt)
  // }
}

module.exports = ClaimtasticEthereum
