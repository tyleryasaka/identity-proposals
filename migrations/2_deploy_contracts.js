const Identity = artifacts.require('./Identity.sol')
const Counter = artifacts.require('./Counter.sol')

module.exports = function(deployer) {
  return deployer.then(() => {
    return deployContracts(deployer)
  })
}

async function deployContracts(deployer) {
  await deployer.deploy(Identity)
  await deployer.deploy(Counter)
}
