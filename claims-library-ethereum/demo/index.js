const ClaimtasticEthereum = require('../src/index')

const claimtasticEthereum = new ClaimtasticEthereum({ web3: window.web3 })
claimtasticEthereum.unlock().then(() => {
  console.log('unlocked')
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
  const profile = await claimtasticEthereum.getIdentity(accounts[0])
  console.log('profile', profile)
}

window.addClaim = async function() {
  const subjectId = await claimtasticEthereum.getIdentity()
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
