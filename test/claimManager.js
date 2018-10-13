var ClaimManager = artifacts.require('ClaimManager')

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
})
