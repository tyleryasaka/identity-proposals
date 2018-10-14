var ClaimManager = artifacts.require('ClaimManager')
var ClaimManager780 = artifacts.require('ClaimManager780')
var ClaimRegistry = artifacts.require('ClaimRegistry')
var ClaimLibrary = artifacts.require('ClaimLibrary')
var Identity = artifacts.require('Identity')
var Web3 = require('web3')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const emptyClaim = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimManagerDelegateKey = '0x0000000000000000000000000000000000000000000000000000000000000123'
const web3 = new Web3()

const getEncodedCall = (web3, instance, method, params = []) => {
  const contract = new web3.eth.Contract(instance.abi)
  return contract.methods[method](...params).encodeABI()
}

contract('ClaimManager', function(accounts) {
  it('should be able to manage claims as the issuer', async function() {
    // Deploy contracts
    const claimManager = await ClaimManager.new()

    // Call setClaim
    await claimManager.setClaim(accounts[1], claimKey, claimValue)

    // Call getClaim
    const claim = await claimManager.getClaim(accounts[1], claimKey)
    assert.equal(claim, claimValue)

    // Call removeClaim
    await claimManager.removeClaim(accounts[1], claimKey)

    // Chefck that claim was removed
    const removedClaim = await claimManager.getClaim(accounts[1], claimKey)
    assert.equal(removedClaim, emptyClaim)
  })

  it('should be able to serve as a proxy for ERC780', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const claimRegistry = await ClaimRegistry.new()
    const claimManager = await ClaimManager780.new(claimRegistry.address, identity.address)

    // Call setClaim
    const encodedCall = getEncodedCall(web3, claimRegistry, 'setClaim', [accounts[1], claimKey, claimValue])
    await identity.execute(claimRegistry.address, 0, encodedCall)

    // Call getClaim
    const claim = await claimManager.getClaim(accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })

  it('should work with ERC725', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const claimManager = await ClaimManager.new()
    const claimLibrary = await ClaimLibrary.new()

    // Call setClaim
    await claimManager.setClaim(accounts[1], claimKey, claimValue)

    // Set claimManager as delegate
    await identity.setDelegate(claimManagerDelegateKey, claimManager.address)

    // Call getClaim
    const claim = await claimLibrary.getClaim(identity.address, accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })
})
