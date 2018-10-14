var ClaimIssuer = artifacts.require('ClaimIssuer')
var ClaimIssuer780 = artifacts.require('ClaimIssuer780')
var ClaimRegistry = artifacts.require('ClaimRegistry')
var ClaimLibrary = artifacts.require('ClaimLibrary')
var Identity = artifacts.require('Identity')
var Web3 = require('web3')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const emptyClaim = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimIssuerDelegateKey = '0x0000000000000000000000000000000000000000000000000000000000000123'
const web3 = new Web3()

const getEncodedCall = (web3, instance, method, params = []) => {
  const contract = new web3.eth.Contract(instance.abi)
  return contract.methods[method](...params).encodeABI()
}

contract('ClaimIssuer', function(accounts) {
  it('should be able to manage claims as the issuer', async function() {
    // Deploy contracts
    const claimIssuer = await ClaimIssuer.new()

    // Call setClaim
    await claimIssuer.setClaim(accounts[1], claimKey, claimValue)

    // Call getClaim
    const claim = await claimIssuer.getClaim(accounts[1], claimKey)
    assert.equal(claim, claimValue)

    // Call removeClaim
    await claimIssuer.removeClaim(accounts[1], claimKey)

    // Chefck that claim was removed
    const removedClaim = await claimIssuer.getClaim(accounts[1], claimKey)
    assert.equal(removedClaim, emptyClaim)
  })

  it('should be able to serve as a proxy for ERC780', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const claimRegistry = await ClaimRegistry.new()
    const claimIssuer = await ClaimIssuer780.new(claimRegistry.address, identity.address)

    // Call setClaim
    const encodedCall = getEncodedCall(web3, claimRegistry, 'setClaim', [accounts[1], claimKey, claimValue])
    await identity.execute(claimRegistry.address, 0, encodedCall)

    // Call getClaim
    const claim = await claimIssuer.getClaim(accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })

  it('should work with ERCXXXX_Identity', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const claimIssuer = await ClaimIssuer.new()
    const claimLibrary = await ClaimLibrary.new()

    // Call setClaim
    await claimIssuer.setClaim(accounts[1], claimKey, claimValue)

    // Set claimIssuer as delegate
    await identity.setDelegate(claimIssuerDelegateKey, claimIssuer.address)

    // Call getClaim
    const claim = await claimLibrary.getClaim(identity.address, accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })
})
