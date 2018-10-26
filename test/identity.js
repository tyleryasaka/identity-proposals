var Identity = artifacts.require('Identity')
var Counter = artifacts.require('Counter')
var IdentityManager = artifacts.require('IdentityManager')
var IdentityRegistry = artifacts.require('IdentityRegistry')
var ClaimRegistry780 = artifacts.require('ClaimRegistry780')
var IdentityFactory = artifacts.require('IdentityFactory')
var MetaWallet = artifacts.require('MetaWallet')
var SimpleToken = artifacts.require('SimpleToken')
var Web3 = require('web3')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const delegateType = '0x0000000000000000000000000000000000000000000000000000000000000abc'
const operationCall = 0
const web3 = new Web3(Web3.givenProvider)

const getEncodedCall = (web3, instance, method, params = []) => {
  const contract = new web3.eth.Contract(instance.abi)
  return contract.methods[method](...params).encodeABI()
}

const sign = async (params, account) => {
  const signatureData = web3.utils.soliditySha3(...params)
  return await web3.eth.sign(signatureData, account)
}

const assertVMExecption = async (fn) => {
  try {
    await fn()
    throw null;
  } catch (error) {
    assert.include(String(error), 'VM Exception')
  }
}

contract('Identity', function(accounts) {
  it('should allow the owner to call execute', async function() {
    // Deploy contracts
    const identity = await Identity.new(accounts[0])
    const counter = await Counter.new()
    const identityRegistry = await IdentityRegistry.new()

    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Call counter.increment from identity
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await identity.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[0] })

    // Check that increment was called
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should be able to integrate with identity manager', async function() {
    // Deploy contracts
    const identity = await Identity.new(accounts[0])
    const counter = await Counter.new()

    // Counter should be 0 initially
    assert.equal((await counter.get()).toString(), '0')

    // Transfer identity ownership to the key manager
    const identityManager = await IdentityManager.new(identity.address, accounts[1], { from: accounts[1] })
    await identity.transferOwnership(identityManager.address)

    // Call counter.increment from identity, through identity manager
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await identityManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })

    // Check that increment was called
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should own itself via ERC1056', async function() {
    // Deploy contracts
    const identity = await Identity.new(accounts[0])
    const identityRegistry = await IdentityRegistry.new()

    // Check that identity owns itself via ERC1056
    const identityOwner = await identityRegistry.identityOwner(identity.address)
    assert.equal(identityOwner, identity.address)
  })

  it('should be able to make a claim via ERC780', async function() {
    // Deploy contracts
    const identity = await Identity.new(accounts[0])
    const claimRegistry780 = await ClaimRegistry780.new()

    // Call setClaim using identity
    const subject = accounts[1]
    const encodedCall = getEncodedCall(web3, claimRegistry780, 'setClaim', [subject, claimKey, claimValue])
    const result = await identity.execute(operationCall, claimRegistry780.address, 0, encodedCall)

    // Check that claim was recorded
    const claim = await claimRegistry780.getClaim(identity.address, subject, claimKey)
    assert.equal(claim, claimValue)
  })

  describe('gas cost comparison', async function() {
    let identity, identityWithManager, counter, identityManager, metaWallet, simpleToken

    beforeEach(async function() {
      identity = await Identity.new(accounts[0])
      identityWithManager = await Identity.new(accounts[0])
      metaWallet = await MetaWallet.new()
      counter = await Counter.new()
      identityManager = await IdentityManager.new(identityWithManager.address, accounts[1], { from: accounts[1] })
      await identityManager.addRole(metaWallet.address, 2, { from: accounts[1] })
      await identityWithManager.transferOwnership(identityManager.address)

      simpleToken = await SimpleToken.new()
      await simpleToken.transfer(accounts[1], 10)
      await simpleToken.approve(metaWallet.address, 10, { from: accounts[1] })
      await metaWallet.deposit(simpleToken.address, identityManager.address, 10, { from: accounts[1] })
      const balance = Number(await metaWallet.balanceOf(simpleToken.address, identityManager.address))
      assert.equal(balance, 10)
    })

    it('without identity or manager', async function() {
      // Call counter.increment
      await counter.increment()

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })

    it('with identity, without manager', async function() {
      // Call counter.increment from identity
      const encodedCall = getEncodedCall(web3, counter, 'increment')
      await identity.execute(operationCall, counter.address, 0, encodedCall)

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })

    it('with identity and manager', async function() {
      // Call counter.increment from identity, through identity manager
      const encodedCall = getEncodedCall(web3, counter, 'increment')
      await identityManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })

    it('with identity and manager and meta wallet', async function() {
      // Call counter.increment from identity, through identity manager, through meta wallet
      // yes, this is getting really meta
      const encodedCall = getEncodedCall(web3, counter, 'increment')
      const nonceKey = web3.utils.soliditySha3("execute", counter.address, 0, encodedCall, identityManager.address)
      const nonce = Number(await metaWallet.getNonce(nonceKey))
      const expiry = Math.floor( Date.now() / 1000 ) + 100
      const signature = await sign([metaWallet.address, "execute", counter.address, 0, encodedCall, expiry, identityManager.address, simpleToken.address, 1, nonce], accounts[1])
      await metaWallet.execute(counter.address, 0, encodedCall, expiry, signature, identityManager.address, simpleToken.address, 1, { from: accounts[2] })

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })
  })
})

contract('IdentityManager', function(accounts) {
  it('should be able to add and remove roles', async function() {
    const identity = await Identity.new(accounts[0])
    const identityManager = await IdentityManager.new(identity.address, accounts[0])
    const actionRole = 2
    const emptyRole = 0

    // add role
    await identityManager.addRole(accounts[1], actionRole)

    // check that role was added
    let hasRole = await identityManager.hasRole(accounts[1], actionRole)
    assert.equal(hasRole, true)

    // add role, signed
    let nonceKey = web3.utils.soliditySha3("addRoleSigned", accounts[2], actionRole)
    let nonce = Number(await identityManager.getNonce(nonceKey))
    let expiry = Math.floor( Date.now() / 1000 ) + 100
    let signature = await sign([identityManager.address, "addRoleSigned", accounts[2], actionRole, nonce, expiry], accounts[0])
    await identityManager.addRoleSigned(accounts[2], actionRole, expiry, signature, { from: accounts[3] })

    // check that role was added
    hasRole = await identityManager.hasRole(accounts[2], actionRole)
    assert.equal(hasRole, true)

    // remove role
    await identityManager.removeRole(accounts[1])

    // check that role was removed
    hasRole = await identityManager.hasRole(accounts[1], actionRole)
    assert.equal(hasRole, false)

    // remove role, signed
    nonceKey = web3.utils.soliditySha3("removeRoleSigned", accounts[2])
    nonce = Number(await identityManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([identityManager.address, "removeRoleSigned", accounts[2], nonce, expiry], accounts[0])
    await identityManager.removeRoleSigned(accounts[2], expiry, signature, { from: accounts[3] })

    // check that role was removed
    hasRole = await identityManager.hasRole(accounts[2], actionRole)
    assert.equal(hasRole, false)
  })

  it('should allow execution for action roles', async function() {
    const identity = await Identity.new(accounts[0])
    const identityManager = await IdentityManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionRole = 2
    await identity.transferOwnership(identityManager.address)

    // add role
    await identityManager.addRole(accounts[1], actionRole)

    // execute counter
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    await identityManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })
    assert.equal((await counter.get()).toString(), '1')

    // execute counter, signed
    let nonceKey = web3.utils.soliditySha3(operationCall, "executeSigned", counter.address, 0, encodedCall)
    let nonce = Number(await identityManager.getNonce(nonceKey))
    let signature = await sign([identityManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '2')

    // remove role
    await identityManager.removeRole(accounts[1])

    // execute counter should fail
    await assertVMExecption(async () => {
      await identityManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })
    })

    // execute counter, signed should fail
    nonceKey = web3.utils.soliditySha3("executeSigned", operationCall, counter.address, 0, encodedCall)
    nonce = Number(await identityManager.getNonce(nonceKey))
    signature = await sign([identityManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    assert.equal(nonce, 1)
    await assertVMExecption(async () => {
      await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    })
  })

  it('should not allow replay attacks', async function() {
    const identity = await Identity.new(accounts[0])
    const identityManager = await IdentityManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionRole = 2
    await identity.transferOwnership(identityManager.address)

    // add role
    await identityManager.addRole(accounts[1], actionRole)

    // execute counter, signed
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    let nonce = 0
    signature = await sign([identityManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '1')

    // replay attack should fail
    await assertVMExecption(async () => {
      await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[3] })
    })
  })

  it('should be able to be deployed with identity in one transaction', async function() {
    // Deploy contracts
    const counter = await Counter.new()
    const identityFactory = await IdentityFactory.new()
    const metaWallet = await MetaWallet.new()

    // Create identity and manager with factory
    const result = await identityFactory.createIdentityWithManager(metaWallet.address)
    assert.equal(result.logs.length, 1)
    const { identity, manager } = result.logs[0].args
    assert.ok(identity)
    assert.ok(manager)

    // Test new contracts
    const identityManager = IdentityManager.at(manager)
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    await identityManager.execute(operationCall, counter.address, 0, encodedCall)
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should enforce expiry', async function() {
    const identity = await Identity.new(accounts[0])
    const identityManager = await IdentityManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionRole = 2
    await identity.transferOwnership(identityManager.address)

    // add role, signed with invalid expiry
    let nonceKey = web3.utils.soliditySha3("addRoleSigned", accounts[1], actionRole)
    let nonce = Number(await identityManager.getNonce(nonceKey))
    let expiry = Math.floor( Date.now() / 1000 ) - 100
    let signature = await sign([identityManager.address, "addRoleSigned", accounts[1], actionRole, nonce, expiry], accounts[0])
    await assertVMExecption(async () => {
      await identityManager.addRoleSigned(accounts[1], actionRole, expiry, signature, { from: accounts[3] })
    })

    // add role, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([identityManager.address, "addRoleSigned", accounts[1], actionRole, nonce, expiry], accounts[0])
    await identityManager.addRoleSigned(accounts[1], actionRole, expiry, signature, { from: accounts[3] })

    // execute counter, signed with invalid expiry
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    nonceKey = web3.utils.soliditySha3("executeSigned", operationCall, counter.address, 0, encodedCall)
    nonce = Number(await identityManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) - 100
    signature = await sign([identityManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, expiry], accounts[1])
    await assertVMExecption(async () => {
      await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, expiry, signature, { from: accounts[2] })
    })

    // execute counter, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([identityManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, expiry], accounts[1])
    await identityManager.executeSigned(operationCall, counter.address, 0, encodedCall, expiry, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '1')

    // remove role, signed with invalid expiry
    nonceKey = web3.utils.soliditySha3("removeRoleSigned", accounts[1])
    nonce = Number(await identityManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) - 100
    signature = await sign([identityManager.address, "removeRoleSigned", accounts[1], nonce, expiry], accounts[0])
    await assertVMExecption(async () => {
      await identityManager.removeRoleSigned(accounts[1], expiry, signature, { from: accounts[3] })
    })
    let hasRole = await identityManager.hasRole(accounts[1], actionRole)
    assert.equal(hasRole, true)

    // add role, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([identityManager.address, "removeRoleSigned", accounts[1], nonce, expiry], accounts[0])
    await identityManager.removeRoleSigned(accounts[1], expiry, signature, { from: accounts[3] })
    hasRole = await identityManager.hasRole(accounts[1], actionRole)
    assert.equal(hasRole, false)
  })
})

contract('MetaWallet', function(accounts) {
  it('should be able to deposit and withdraw tokens', async function() {
    // set up
    const metaWallet = await MetaWallet.new()
    const simpleToken = await SimpleToken.new()
    await simpleToken.transfer(accounts[1], 10)
    await simpleToken.approve(metaWallet.address, 10, { from: accounts[1] })

    // check initial balances
    let balanceInMetaWallet = Number(await metaWallet.balanceOf(simpleToken.address, accounts[1]))
    let balance = Number(await simpleToken.balanceOf(accounts[1]))
    let metaWalletTotal = Number(await simpleToken.balanceOf(metaWallet.address))
    assert.equal(balanceInMetaWallet, 0)
    assert.equal(balance, 10)
    assert.equal(metaWalletTotal, 0)

    // deposit and check new balances
    await metaWallet.deposit(simpleToken.address, accounts[1], 4, { from: accounts[1] })
    balanceInMetaWallet = Number(await metaWallet.balanceOf(simpleToken.address, accounts[1]))
    balance = Number(await simpleToken.balanceOf(accounts[1]))
    metaWalletTotal = Number(await simpleToken.balanceOf(metaWallet.address))
    assert.equal(balanceInMetaWallet, 4)
    assert.equal(balance, 6)
    assert.equal(metaWalletTotal, 4)

    // balance should not change if deposit fails
    await assertVMExecption(async () => {
      await metaWallet.deposit(simpleToken.address, accounts[1], 100, { from: accounts[1] })
    })
    balanceInMetaWallet = Number(await metaWallet.balanceOf(simpleToken.address, accounts[1]))
    balance = Number(await simpleToken.balanceOf(accounts[1]))
    metaWalletTotal = Number(await simpleToken.balanceOf(metaWallet.address))
    assert.equal(balanceInMetaWallet, 4)
    assert.equal(balance, 6)
    assert.equal(metaWalletTotal, 4)

    // withdraw and check new balances
    await metaWallet.withdraw(simpleToken.address, accounts[1], 3, { from: accounts[1] })
    balanceInMetaWallet = Number(await metaWallet.balanceOf(simpleToken.address, accounts[1]))
    balance = Number(await simpleToken.balanceOf(accounts[1]))
    metaWalletTotal = Number(await simpleToken.balanceOf(metaWallet.address))
    assert.equal(balanceInMetaWallet, 1)
    assert.equal(balance, 9)
    assert.equal(metaWalletTotal, 1)

    // balance should not change if withdraw fails
    await assertVMExecption(async () => {
      await metaWallet.withdraw(simpleToken.address, accounts[1], 123, { from: accounts[1] })
    })
    balanceInMetaWallet = Number(await metaWallet.balanceOf(simpleToken.address, accounts[1]))
    balance = Number(await simpleToken.balanceOf(accounts[1]))
    metaWalletTotal = Number(await simpleToken.balanceOf(metaWallet.address))
    assert.equal(balanceInMetaWallet, 1)
    assert.equal(balance, 9)
    assert.equal(metaWalletTotal, 1)
  })

  it('should be able to facilitate a sponsored execution', async function() {
    // set up
    const identityWithManager = await Identity.new(accounts[0])
    const metaWallet = await MetaWallet.new()
    const counter = await Counter.new()
    const identityManager = await IdentityManager.new(identityWithManager.address, accounts[1], { from: accounts[1] })
    await identityManager.addRole(metaWallet.address, 2, { from: accounts[1] })
    await identityWithManager.transferOwnership(identityManager.address)

    const simpleToken = await SimpleToken.new()
    await simpleToken.transfer(accounts[1], 10)
    await simpleToken.approve(metaWallet.address, 10, { from: accounts[1] })
    await metaWallet.deposit(simpleToken.address, identityManager.address, 10, { from: accounts[1] })

    // Facilitate a sponsored execution
    // The identity manager will sign a message giving permission for the wallet to transfer 3 tokens in exchange for executing the call.
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const nonceKey = web3.utils.soliditySha3("execute", counter.address, 0, encodedCall, identityManager.address)
    const nonce = Number(await metaWallet.getNonce(nonceKey))
    const expiry = Math.floor( Date.now() / 1000 ) + 100
    const tokensToTransfer = 3
    const signature = await sign([metaWallet.address, "execute", counter.address, 0, encodedCall, expiry, identityManager.address, simpleToken.address, tokensToTransfer, nonce], accounts[1])
    await metaWallet.execute(counter.address, 0, encodedCall, expiry, signature, identityManager.address, simpleToken.address, tokensToTransfer, { from: accounts[2] })

    // Check that increment was called and tokens have been transferred
    assert.equal((await counter.get()).toString(), '1')
    const balance = Number(await simpleToken.balanceOf(accounts[2]))
    assert.equal(balance, tokensToTransfer)
  })
})
