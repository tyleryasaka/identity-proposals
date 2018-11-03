const Claimtastic = require('claimtastic')
const Box = require('@tyleryasaka/3box')
const IdentityContract = require('../../build/contracts/Identity.json')
const Web3 = require('web3')

class ClaimtasticEthereum extends Claimtastic {
  constructor({ web3 }) {
    super()
    const provider = web3 ? web3.currentProvider : Web3.givenProvider
    this.web3 = new Web3(provider)
  }

  async init({ box } = {}) {
    const boxInstance = box || Box
    const accounts = await this.web3.eth.getAccounts()
    this.walletAddress = accounts[0]
    this.box = await boxInstance.openBox(this.walletAddress, this.web3.currentProvider)
  }

  async createIdentity() {
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
    return (await this.box.public.get('claims')) || []
  }

  async _isValid(claim) {
    return true
  }

  async _addClaim(claim) {
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

const claimtasticEthereum = new ClaimtasticEthereum({ web3: window.web3 })
claimtasticEthereum.init().then(() => {
  console.log('initialized')
})

window.claimtasticEthereum = claimtasticEthereum

window.createIdentity = async function() {
  const id = await claimtasticEthereum.createIdentity()
  console.log('identity', id)
}

window.getId = async function() {
  console.log('hi')
  const accounts = await claimtasticEthereum.web3.eth.getAccounts()
  console.log('accounts', accounts)
  const profile = await claimtasticEthereum.getSubjectId(accounts[0])
  console.log('profile', profile)
}

window.addClaim = async function() {
  const subjectId = await claimtasticEthereum.getSubjectId()
  const success = await claimtasticEthereum.addSelfClaim(subjectId, 'SpiritAnimal', {
    animal: 'northern bobwhite'
  })
  console.log('success', success)
}

window.getClaims = async function() {
  const claims = await claimtasticEthereum.getClaims()
  console.log('claims', claims)
}

console.log('claimtastic', claimtasticEthereum)
