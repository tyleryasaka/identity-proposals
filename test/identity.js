var Identity = artifacts.require('Identity')
var Counter = artifacts.require('Counter')
var Web3 = require('web3')

const getEncodedCall = (web3, instance, method, params = []) => {
  const contract = new web3.eth.Contract(instance.abi)
  return contract.methods[method](...params).encodeABI()
}

contract('Identity', function(accounts) {
  it('should allow the owner to call execute', async function() {
    const web3 = new Web3()
    const identity = await Identity.deployed()
    const counter = await Counter.deployed()
    assert.equal((await counter.get()).toString(), '0')
    const encodedCall = getEncodedCall(web3, counter, 'increment')
    const result = await identity.execute(counter.address, 0, encodedCall, { from: accounts[0] })
    assert.equal((await counter.get()).toString(), '1')
    assert.equal(result.logs.length, 1)
    assert.equal(result.logs[0].event, 'Executed')
    assert.equal(result.logs[0].args.to, counter.address)
    assert.equal(result.logs[0].args.value, 0)
    assert.equal(result.logs[0].args.data, encodedCall)
  })
})
