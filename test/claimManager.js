var ClaimManager = artifacts.require('ClaimManager')
var ClaimVerifier = artifacts.require('ClaimVerifier')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const emptyClaim = '0x0000000000000000000000000000000000000000000000000000000000000000'

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

  it('should be able to integrate with claim verifier', async function() {
    // Deploy contracts
    const claimManager = await ClaimManager.new()
    const claimVerifier = await ClaimVerifier.new()

    // Set up claim verifier
    await claimVerifier.setRegistrationStatus(true)
    claimManager.setVerifier(claimVerifier.address)

    // Call setClaim
    await claimManager.setClaim(accounts[1], claimKey, claimValue)

    // Call getClaim
    const claim = await claimManager.getClaim(accounts[1], claimKey)
    assert.equal(claim, claimValue)

    // Set registration status to closed
    await claimVerifier.setRegistrationStatus(false)

    // Chefck that claim is no longer valid
    const invalidatedClaim = await claimManager.getClaim(accounts[1], claimKey)
    assert.equal(invalidatedClaim, emptyClaim)
  })
})
