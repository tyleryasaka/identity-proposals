var Identity = artifacts.require('Identity')
var Counter = artifacts.require('Counter')
var IdentityManager = artifacts.require('IdentityManager')
var IdentityRegistry = artifacts.require('IdentityRegistry')
var ClaimRegistry = artifacts.require('ClaimRegistry')
var Web3 = require('web3')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const web3 = new Web3()

const getEncodedCall = (web3, instance, method, params = []) => {
  const contract = new web3.eth.Contract(instance.abi)
  return contract.methods[method](...params).encodeABI()
}

contract('Identity', function(accounts) {
  it('should allow the owner to call execute', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const counter = await Counter.new()
    const identityRegistry = await IdentityRegistry.new()

    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Call counter.increment from identity
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await identity.execute(counter.address, 0, encodedCall, { from: accounts[0] })

    // Check that increment was called
    assert.equal((await counter.get()).toString(), '1')
    assert.equal(result.logs.length, 1)
    assert.equal(result.logs[0].event, 'Executed')
    assert.equal(result.logs[0].args.to, counter.address)
    assert.equal(result.logs[0].args.value, 0)
    assert.equal(result.logs[0].args.data, encodedCall)
  })

  it('should be able to integrate with a key manager', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const counter = await Counter.new()

    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Transfer identity ownership to the key manager
    const identityManager = await IdentityManager.new(identity.address, { from: accounts[1] })
    await identity.transferOwnership(identityManager.address)

    // Call counter.increment from identity, through identity manager
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await identityManager.execute(counter.address, 0, encodedCall, { from: accounts[1] })

    // Check that increment was called
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should own itself via ERC1056', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const identityRegistry = await IdentityRegistry.new()

    // Check that identity owns itself via ERC1056
    const identityOwner = await identityRegistry.identityOwner(identity.address)
    assert.equal(identityOwner, identity.address)
  })

  it('should be able to make a claim via ERC780', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const claimRegistry = await ClaimRegistry.new()

    // Call setClaim using identity
    const subject = accounts[1]
    const encodedCall = getEncodedCall(web3, claimRegistry, 'setClaim', [subject, claimKey, claimValue])
    const result = await identity.execute(claimRegistry.address, 0, encodedCall)

    // Check that claim was recorded
    const claim = await claimRegistry.getClaim(identity.address, subject, claimKey)
    assert.equal(claim, claimValue)
  })

  it('should be able to set and get ambassadors', async function() {
    // Deploy contracts
    const identity = await Identity.new()
    const counter = await Counter.new()

    // Call setPointer
    await identity.setAmbassador(0, counter.address)

    // Call getPointer
    const pointer = await identity.getAmbassador(0)
    assert.equal(pointer, counter.address)
  })
})
