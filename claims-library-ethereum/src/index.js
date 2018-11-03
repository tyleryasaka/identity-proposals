const Claimtastic = require('claimtastic')
const Box = require('@tyleryasaka/3box')

class ClaimtasticEthereum extends Claimtastic {
  constructor(box) {
    super()
    this.box = box
  }
}

const claimtasticEthereum = new ClaimtasticEthereum(Box)

console.log('claimtastic', claimtasticEthereum)
