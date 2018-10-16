var ClaimIssuer = artifacts.require('ClaimIssuer')
var ClaimIssuerRegistry = artifacts.require('ClaimIssuerRegistry')
var ClaimRegistry780 = artifacts.require('ClaimRegistry780')
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
})

contract('ClaimIssuerRegistry', function(accounts) {
  it('should integrate with ClaimIssuer', async function() {
    // Deploy contracts
    const claimRegistry780 = ClaimRegistry780.new()
    const claimIssuerRegistry = await ClaimIssuerRegistry.new(claimRegistry780.address)
    const claimIssuer = await ClaimIssuer.new()

    // Call setIssuer
    await claimIssuerRegistry.setIssuer(claimIssuer.address)

    // Call setClaim
    await claimIssuer.setClaim(accounts[1], claimKey, claimValue)

    // Call getClaim
    const claim = await claimIssuerRegistry.getClaim(accounts[0], accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })

  it('should be backwards compatible with ERC780', async function() {
    // Deploy contracts
    const claimRegistry780 = await ClaimRegistry780.new()
    const claimIssuerRegistry = await ClaimIssuerRegistry.new(claimRegistry780.address)

    // Call setClaim
    await claimRegistry780.setClaim(accounts[1], claimKey, claimValue)

    // Call getClaim
    const claim = await claimIssuerRegistry.getClaim(accounts[0], accounts[1], claimKey)
    assert.equal(claim, claimValue)
  })
})
