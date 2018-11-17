const Forwarder = artifacts.require('Forwarder')
const Forwarder2 = artifacts.require('Forwarder2')
const Resolver = artifacts.require('Resolver')
const DummyContract = artifacts.require('DummyContract')
const IDummyContract = artifacts.require('IDummyContract')

function web3GetStorageAt(address, position) {
  return new Promise((resolve, reject) => {
    web3.eth.getStorageAt(address, position, (err, res) => {
      if (err !== null) return reject(err);
      return resolve(res);
    });
  });
}

contract('Forwarder', async () => {
  let resolver;
  let dummyContract;
  before(async () => {
    // creating single contract from which the forwarder contract will inherit storage and functions
    dummyContract = await DummyContract.new();
    resolver = await Resolver.new();
    await resolver.register('increment()', dummyContract.address);
    await resolver.register('get()', dummyContract.address);
  });

  it('should deploy 3 forwarder contracts', async () => {
    // first
    let forwarder = await Forwarder.new();
    await forwarder.setResolver(resolver.address);
    let dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    let res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    // second
    forwarder = await Forwarder.new();
    await forwarder.setResolver(resolver.address);
    dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    // third
    forwarder = await Forwarder.new();
    await forwarder.setResolver(resolver.address);
    dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);
  });

  it('should deploy 3 forwarder contracts without resolver', async () => {
    // first
    let forwarder = await Forwarder2.new(dummyContract.address);
    let dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    let res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    // second
    forwarder = await Forwarder2.new(dummyContract.address);
    dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    // third
    forwarder = await Forwarder2.new(dummyContract.address);
    dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);
  });

  it('should deploy 3 contracts', async () => {
    // first
    let dummyContract = await DummyContract.new();
    await dummyContract.increment();
    let res = await dummyContract.get();
    assert.equal(res.toNumber(), 1);

    // second
    dummyContract = await DummyContract.new();
    await dummyContract.increment();
    res = await dummyContract.get();
    assert.equal(res.toNumber(), 1);

    // third
    dummyContract = await DummyContract.new();
    await dummyContract.increment();
    res = await dummyContract.get();
    assert.equal(res.toNumber(), 1);
  });
})
