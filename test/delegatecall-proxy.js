const Forwarder = artifacts.require('Forwarder')
const Forwarder2 = artifacts.require('Forwarder2')
const Resolver = artifacts.require('Resolver')
const DummyContract = artifacts.require('DummyContract')
const IDummyContract = artifacts.require('IDummyContract')

const fs = require('fs')
const solc = require('solc');
const truffleContract = require('truffle-contract')
const compile = require('truffle-compile')

function createForwarder(address, from) {
  const solidityCode = `
  pragma solidity ^0.4.24;
  contract Forwarder3 {
    function() external payable {
      require(msg.sig != 0x0, "function sig not specified");
      assembly {
        calldatacopy(mload(0x40), 0, calldatasize)
        let result := delegatecall(gas, ${address}, mload(0x40), calldatasize, mload(0x40), 0)
        returndatacopy(mload(0x40), 0, returndatasize)
        switch result
        case 1 { return(mload(0x40), returndatasize) }
        default { revert(mload(0x40), returndatasize) }
      }
    }
  }
  `;
  const source = { 'contracts/Forwarder3.sol': solidityCode }
  const options = {
    'contracts_directory': 'contracts',
    solc
  }
  return new Promise(function (resolve, reject) {
    compile(source, options, function (err, val) {
      if (err) {
        reject(err)
      }
      const Forwarder3 = truffleContract(val.Forwarder3);
      Forwarder3.setProvider(web3.currentProvider);
      Forwarder3.defaults({
        from,
        gas: 6721975
      })
      resolve(Forwarder3)
    });
  })
}

function web3GetStorageAt(address, position) {
  return new Promise((resolve, reject) => {
    web3.eth.getStorageAt(address, position, (err, res) => {
      if (err !== null) return reject(err);
      return resolve(res);
    });
  });
}

contract('Forwarder', async (accounts) => {
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

  it('should deploy 3 dynamically created forwarder contracts', async () => {
    // first
    let Forwarder3 = await createForwarder(dummyContract.address, accounts[0]);
    let forwarder = await Forwarder3.new();
    let dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    let res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    forwarder = await Forwarder3.new();
    dummyContractForwarder = await IDummyContract.at(forwarder.address);
    await dummyContractForwarder.increment();
    res = await dummyContractForwarder.get();
    assert.equal(res.toNumber(), 1);

    forwarder = await Forwarder3.new();
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
