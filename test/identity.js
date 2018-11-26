var Identity = artifacts.require('Identity')
var Counter = artifacts.require('Counter')
var KeyManager = artifacts.require('KeyManager')
var IdentityRegistry = artifacts.require('IdentityRegistry')
var ClaimRegistry780 = artifacts.require('ClaimRegistry780')
var IdentityFactory = artifacts.require('IdentityFactory')
var MetaWallet = artifacts.require('MetaWallet')
var SimpleToken = artifacts.require('SimpleToken')
var Web3 = require('web3')

const claimKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
const claimValue = '0x0000000000000000000000000000000000000000000000000000000000000123'
const OWNER_KEY = '0x0000000000000000000000000000000000000000000000000000000000000000'
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
    const keyManager = await KeyManager.new(identity.address, accounts[1], { from: accounts[1] })
    await identity.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

    // Call counter.increment from identity, through identity manager
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await keyManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })

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
    let identity, identityWithManager, counter, keyManager, metaWallet, simpleToken

    beforeEach(async function() {
      identity = await Identity.new(accounts[0])
      identityWithManager = await Identity.new(accounts[0])
      metaWallet = await MetaWallet.new()
      counter = await Counter.new()
      keyManager = await KeyManager.new(identityWithManager.address, accounts[1], { from: accounts[1] })
      await keyManager.addKey(web3.utils.padLeft(metaWallet.address, 64), 2, { from: accounts[1] })
      await identityWithManager.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

      simpleToken = await SimpleToken.new()
      await simpleToken.transfer(accounts[1], 10)
      await simpleToken.approve(metaWallet.address, 10, { from: accounts[1] })
      await metaWallet.deposit(simpleToken.address, keyManager.address, 10, { from: accounts[1] })
      const balance = Number(await metaWallet.balanceOf(simpleToken.address, keyManager.address))
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
      await keyManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })

    it('with identity and manager and meta wallet', async function() {
      // Call counter.increment from identity, through identity manager, through meta wallet
      // yes, this is getting really meta
      const encodedCall = getEncodedCall(web3, counter, 'increment')
      const nonceKey = web3.utils.soliditySha3("execute", counter.address, 0, encodedCall, keyManager.address)
      const nonce = Number(await metaWallet.getNonce(nonceKey))
      const expiry = Math.floor( Date.now() / 1000 ) + 100
      const signature = await sign([metaWallet.address, "execute", counter.address, 0, encodedCall, expiry, keyManager.address, simpleToken.address, 1, nonce], accounts[1])
      await metaWallet.execute(counter.address, 0, encodedCall, expiry, signature, keyManager.address, simpleToken.address, 1, { from: accounts[2] })

      // Check that increment was called
      assert.equal((await counter.get()).toString(), '1')
    })
  })
})

contract('KeyManager', function(accounts) {
  it('should be able to add and remove keys', async function() {
    const identity = await Identity.new(accounts[0])
    const keyManager = await KeyManager.new(identity.address, accounts[0])
    const actionPurpose = 2
    const emptyPurpose = 0

    // add key
    await keyManager.addKey(web3.utils.padLeft(accounts[1], 64), actionPurpose)

    // check that key was added
    let purpose = await keyManager.getKey(web3.utils.padLeft(accounts[1], 64))
    assert.equal(purpose, actionPurpose)

    // add key, signed
    let nonceKey = web3.utils.soliditySha3("addKeySigned", accounts[2], actionPurpose)
    let nonce = Number(await keyManager.getNonce(nonceKey))
    let expiry = Math.floor( Date.now() / 1000 ) + 100
    let signature = await sign([keyManager.address, "addKeySigned", accounts[2], actionPurpose, nonce, expiry], accounts[0])
    await keyManager.addKeySigned(accounts[2], actionPurpose, expiry, signature, { from: accounts[3] })

    // check that key was added
    purpose = await keyManager.getKey(web3.utils.padLeft(accounts[2], 64))
    assert.equal(purpose, actionPurpose)

    // remove key
    await keyManager.removeKey(web3.utils.padLeft(accounts[1], 64))

    // check that key was removed
    purpose = await keyManager.getKey(web3.utils.padLeft(accounts[1], 64))
    assert.equal(purpose, emptyPurpose)

    // remove key, signed
    nonceKey = web3.utils.soliditySha3("removeKeySigned", accounts[2])
    nonce = Number(await keyManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([keyManager.address, "removeKeySigned", accounts[2], nonce, expiry], accounts[0])
    await keyManager.removeKeySigned(accounts[2], expiry, signature, { from: accounts[3] })

    // check that key was removed
    purpose = await keyManager.getKey(web3.utils.padLeft(accounts[2], 64))
    assert.equal(purpose, emptyPurpose)
  })

  it('should allow execution for action purposes', async function() {
    const identity = await Identity.new(accounts[0])
    const keyManager = await KeyManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionPurpose = 2
    await identity.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

    // add key
    await keyManager.addKey(web3.utils.padLeft(accounts[1], 64), actionPurpose)

    // execute counter
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    await keyManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })
    assert.equal((await counter.get()).toString(), '1')

    // execute counter, signed
    let nonceKey = web3.utils.soliditySha3(operationCall, "executeSigned", counter.address, 0, encodedCall)
    let nonce = Number(await keyManager.getNonce(nonceKey))
    let signature = await sign([keyManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '2')

    // remove key
    await keyManager.removeKey(web3.utils.padLeft(accounts[1], 64))

    // execute counter should fail
    await assertVMExecption(async () => {
      await keyManager.execute(operationCall, counter.address, 0, encodedCall, { from: accounts[1] })
    })

    // execute counter, signed should fail
    nonceKey = web3.utils.soliditySha3("executeSigned", operationCall, counter.address, 0, encodedCall)
    nonce = Number(await keyManager.getNonce(nonceKey))
    signature = await sign([keyManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    assert.equal(nonce, 1)
    await assertVMExecption(async () => {
      await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    })
  })

  it('should not allow replay attacks', async function() {
    const identity = await Identity.new(accounts[0])
    const keyManager = await KeyManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionPurpose = 2
    await identity.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

    // add key
    await keyManager.addKey(web3.utils.padLeft(accounts[1], 64), actionPurpose)

    // execute counter, signed
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    let nonce = 0
    signature = await sign([keyManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, 0], accounts[1])
    await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '1')

    // replay attack should fail
    await assertVMExecption(async () => {
      await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, 0, signature, { from: accounts[3] })
    })
  })

  it('should be able to be deployed with identity in one transaction', async function() {
    // Deploy contracts
    const counter = await Counter.new()
    const identityFactory = await IdentityFactory.new()
    const metaWallet = await MetaWallet.new()

    // Create identity and manager with factory
    const result = await identityFactory.createIdentityWithMetaWallet(metaWallet.address)
    assert.equal(result.logs.length, 1)
    const { identity, manager } = result.logs[0].args
    assert.ok(identity)
    assert.ok(manager)

    // Test new contracts
    const keyManager = KeyManager.at(manager)
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    await keyManager.execute(operationCall, counter.address, 0, encodedCall)
    assert.equal((await counter.get()).toString(), '1')
  })

  it('should enforce expiry', async function() {
    const identity = await Identity.new(accounts[0])
    const keyManager = await KeyManager.new(identity.address, accounts[0])
    const counter = await Counter.new()
    const actionPurpose = 2
    await identity.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

    // add key, signed with invalid expiry
    let nonceKey = web3.utils.soliditySha3("addKeySigned", accounts[1], actionPurpose)
    let nonce = Number(await keyManager.getNonce(nonceKey))
    let expiry = Math.floor( Date.now() / 1000 ) - 100
    let signature = await sign([keyManager.address, "addKeySigned", accounts[1], actionPurpose, nonce, expiry], accounts[0])
    await assertVMExecption(async () => {
      await keyManager.addKeySigned(accounts[1], actionPurpose, expiry, signature, { from: accounts[3] })
    })

    // add key, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([keyManager.address, "addKeySigned", accounts[1], actionPurpose, nonce, expiry], accounts[0])
    await keyManager.addKeySigned(accounts[1], actionPurpose, expiry, signature, { from: accounts[3] })

    // execute counter, signed with invalid expiry
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    nonceKey = web3.utils.soliditySha3("executeSigned", operationCall, counter.address, 0, encodedCall)
    nonce = Number(await keyManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) - 100
    signature = await sign([keyManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, expiry], accounts[1])
    await assertVMExecption(async () => {
      await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, expiry, signature, { from: accounts[2] })
    })

    // execute counter, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([keyManager.address, "executeSigned", operationCall, counter.address, 0, encodedCall, nonce, expiry], accounts[1])
    await keyManager.executeSigned(operationCall, counter.address, 0, encodedCall, expiry, signature, { from: accounts[2] })
    assert.equal((await counter.get()).toString(), '1')

    // remove key, signed with invalid expiry
    nonceKey = web3.utils.soliditySha3("removeKeySigned", accounts[1])
    nonce = Number(await keyManager.getNonce(nonceKey))
    expiry = Math.floor( Date.now() / 1000 ) - 100
    signature = await sign([keyManager.address, "removeKeySigned", accounts[1], nonce, expiry], accounts[0])
    await assertVMExecption(async () => {
      await keyManager.removeKeySigned(accounts[1], expiry, signature, { from: accounts[3] })
    })
    let purpose = await keyManager.getKey(web3.utils.padLeft(accounts[1], 64))
    assert.equal(purpose, actionPurpose)

    // add key, signed with valid expiry
    expiry = Math.floor( Date.now() / 1000 ) + 100
    signature = await sign([keyManager.address, "removeKeySigned", accounts[1], nonce, expiry], accounts[0])
    await keyManager.removeKeySigned(accounts[1], expiry, signature, { from: accounts[3] })
    purpose = await keyManager.getKey(web3.utils.padLeft(accounts[1], 64))
    assert.equal(purpose, 0)
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
    const keyManager = await KeyManager.new(identityWithManager.address, accounts[1], { from: accounts[1] })
    await keyManager.addKey(web3.utils.padLeft(metaWallet.address, 64), 2, { from: accounts[1] })
    await identityWithManager.setData(OWNER_KEY, web3.utils.padLeft(keyManager.address, 64))

    const simpleToken = await SimpleToken.new()
    await simpleToken.transfer(accounts[1], 10)
    await simpleToken.approve(metaWallet.address, 10, { from: accounts[1] })
    await metaWallet.deposit(simpleToken.address, keyManager.address, 10, { from: accounts[1] })

    // Facilitate a sponsored execution
    // The identity manager will sign a message giving permission for the wallet to transfer 3 tokens in exchange for executing the call.
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const nonceKey = web3.utils.soliditySha3("execute", counter.address, 0, encodedCall, keyManager.address)
    const nonce = Number(await metaWallet.getNonce(nonceKey))
    const expiry = Math.floor( Date.now() / 1000 ) + 100
    const tokensToTransfer = 3
    const signature = await sign([metaWallet.address, "execute", counter.address, 0, encodedCall, expiry, keyManager.address, simpleToken.address, tokensToTransfer, nonce], accounts[1])
    await metaWallet.execute(counter.address, 0, encodedCall, expiry, signature, keyManager.address, simpleToken.address, tokensToTransfer, { from: accounts[2] })

    // Check that increment was called and tokens have been transferred
    assert.equal((await counter.get()).toString(), '1')
    const balance = Number(await simpleToken.balanceOf(accounts[2]))
    assert.equal(balance, tokensToTransfer)
  })
})
