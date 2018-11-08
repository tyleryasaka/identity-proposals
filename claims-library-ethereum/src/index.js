const Claimtastic = require('../../claims-library/src/claimtastic.js')
const Box = require('3box')
const IdentityContract = require('../../build/contracts/Identity.json')
const IdentityFactoryContract = require('../../build/contracts/IdentityFactory.json')
const ThreeBoxLinkerContract = require('../../build/contracts/ThreeBoxLinker.json')
const ClaimRegistry780Contract = require('../../build/contracts/ClaimRegistry780.json')
const Web3 = require('web3')

const KEY_DID = 'DID'
const KEY_CLAIMS = 'claims'

const REVOCATION_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

// for development purposes only
const FACTORY_ADDRESS_RINKEBY = '0xa88127A96085091b468ecD4851f2db9CC8586327'
const LINKER_ADDRESS_RINKEBY = '0x88cbd9B79EA52e08E77cAb692D5e59a3Af685fc8'
const REGISTRY_ADDRESS_RINKEBY = '0xeD06550D5Ab30b6851AB9b16CC31fe301cFEdfe0'

class ClaimtasticEthereum extends Claimtastic {
  constructor({ web3 }) {
    super()
    const provider = web3 ? web3.currentProvider : Web3.givenProvider
    this.web3 = new Web3(provider)
  }

  /*
    Public methods
  */

  async unlock({ box } = {}) {
    const boxInstance = box || Box
    const accounts = await this.web3.eth.getAccounts()
    this.web3.eth.defaultAccount = this.walletAddress = accounts[0]
    this.box = await boxInstance.openBox(this.walletAddress, this.web3.currentProvider)
    await new Promise(resolve => {
      this.box.onSyncDone(resolve)
    })
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

  async revokeClaim(subjectId, claimId) {
    this._requireUnlocked()
    const claims = await this._getClaims(subjectId)
    const claim = claims.find(c => c.id === claimId)
    const signature = claim.signature.signatureValue
    const signatureHash = this.web3.utils.sha3(signature)
    const issuerIdentity = await this.getIdentity()
    const identityAddress = this._getIdentityContract(issuerIdentity)
    const claimRegistryContract = new this.web3.eth.Contract(
      ClaimRegistry780Contract.abi,
      REGISTRY_ADDRESS_RINKEBY
    )
    const identityContract = new this.web3.eth.Contract(
      IdentityContract.abi,
      identityAddress
    )
    const executionData = claimRegistryContract.methods.setClaim(
      identityAddress,
      signatureHash,
      REVOCATION_VALUE
    ).encodeABI()
    const tx = identityContract.methods.execute(0, REGISTRY_ADDRESS_RINKEBY, 0, executionData)
    const receipt = await new Promise(resolve => {
      tx.send({ from: this.walletAddress }).on('receipt', resolve)
    })
    return true
  }

  /*
    Private methods - used by base class
    These methods are required by the base class. The child class is responsible for implementing them.
  */

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
      const isGoodSignature = this._checksum(recovered) === this._checksum(issuerWallet)
      const isRevoked = await this._isRevoked(signature, issuer)
      return isGoodSignature && !isRevoked
    } catch(e) {
      console.error(e)
      return false
    }
  }

  async _addClaim(claim) {
    this._requireUnlocked()
    const claims = (await this.box.public.get(KEY_CLAIMS)) || []
    if (claims.map(c => c.id).includes(claim.id)) {
      throw new Error(`Claim with id ${claim.id} already exists`)
    }
    claims.push(claim)
    await this.box.public.set(KEY_CLAIMS, claims)
    return true
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

  /*
    Private methods - used by this inherited class
  */

  _requireUnlocked() {
    if (!this.unlocked) {
      throw new Error('ClaimtasticEthereum has not been unlocked yet')
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

  _checksum(address) {
    return this.web3.utils.toChecksumAddress(address)
  }

  _getDID(contractAddress) {
    return `did:erc725:${contractAddress}`
  }

  _getIdentityContract(did) {
    return did.split(':')[2]
  }

  async _getWallet(did) {
    const contractAddress = this._getIdentityContract(did)
    const threeBoxLinkerContract = new this.web3.eth.Contract(
      ThreeBoxLinkerContract.abi,
      LINKER_ADDRESS_RINKEBY
    )
    return threeBoxLinkerContract.methods.getThreeBox(contractAddress).call()
  }

  async _isRevoked(signature, issuer) {
    const signatureHash = this.web3.utils.sha3(signature)
    const claimRegistryContract = new this.web3.eth.Contract(
      ClaimRegistry780Contract.abi,
      REGISTRY_ADDRESS_RINKEBY
    )
    const issuerAddress = this._getIdentityContract(issuer)
    const revocation = await claimRegistryContract.methods.getClaim(
      issuerAddress,
      issuerAddress,
      signatureHash
    ).call()
    return revocation === REVOCATION_VALUE
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
