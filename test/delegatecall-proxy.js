const Proxy = artifacts.require('Proxy')
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

contract('Proxy', async () => {
  let resolver;
  before(async () => {
    // creating single contract from which the proxy contract will inherit storage and functions
    const dummyContract = await DummyContract.new();
    resolver = await Resolver.new();
    await resolver.register('increment()', dummyContract.address);
    await resolver.register('get()', dummyContract.address);
  });

  it('should deploy 3 proxy contracts', async () => {
    // first
    let proxy = await Proxy.new();
    await proxy.setResolver(resolver.address);
    let dummyContractProxy = await IDummyContract.at(proxy.address);
    await dummyContractProxy.increment();
    let res = await dummyContractProxy.get();
    assert.equal(res.toNumber(), 1);

    // second
    proxy = await Proxy.new();
    await proxy.setResolver(resolver.address);
    dummyContractProxy = await IDummyContract.at(proxy.address);
    await dummyContractProxy.increment();
    res = await dummyContractProxy.get();
    assert.equal(res.toNumber(), 1);

    // third
    proxy = await Proxy.new();
    await proxy.setResolver(resolver.address);
    dummyContractProxy = await IDummyContract.at(proxy.address);
    await dummyContractProxy.increment();
    res = await dummyContractProxy.get();
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
