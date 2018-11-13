const html = require('choo/html')
const devtools = require('choo-devtools')
const choo = require('choo')
const ClaimtasticEthereum = require('../src/index')
const Box = require('3box')
require('../node_modules/tachyons/css/tachyons.min.css')
require('file-loader?name=[name].[ext]!../index.html')

const app = choo()
app.use(devtools())
app.use(store)
app.route('/', mainView)
app.route('/wallet/:wallet', mainView)
app.mount('body')

function mainView (state, emit) {
  const {
    claimtasticEthereum,
    claimtasticEthereum: { unlocked },
    selfClaims,
    did,
    name,
    image,
    inputSpiritAnimal,
    loading
  } = state
  const spiritAnimalClaim = selfClaims.length && selfClaims.find(c => c.selfClaim.type.includes('SpiritAnimal'))
  const inputSpiritAnimalValue = spiritAnimalClaim ? spiritAnimalClaim.selfClaim.claim.animal : inputSpiritAnimal
  const hasSpiritAnimal = Boolean(spiritAnimalClaim)
  const canEdit = !state.params.wallet
  const spiritAnimalDisabled = (hasSpiritAnimal || !canEdit) ? 'disabled' : null
  const _name = name ? name : 'Anonymous'
  const src = image ? `https://ipfs.infura.io/ipfs/${image.contentUrl['/']}` : 'http://tachyons.io/img/logo.jpg'
  const loadingSpinner = html`
    <div class="dark-overlay" onclick="return false;">
      <div class="lds-dual-ring"></div>
    </div>
  `
  const content = html`
    <body>
      ${loading ? loadingSpinner : null}
      <header class="tc pv4 pv5-ns">
        <img src=${src} class="br-100 pa1 ba b--black-10 h3 w3" alt="avatar">
        <h1 class="f5 f4-ns fw6 mid-gray">${_name}</h1>
        ${did ? html`
          <h2 class="f6 gray fw2 tracked">${did}</h2>
        ` : null }
        ${(!did && canEdit) ? html`
          <button class="b ph3 pv2 ba b--black bg-transparent grow pointer f6" onclick=${createIdentity}>Create ERC725 identity</button>
        ` : null }
        ${canEdit ? html`
          <div>
            <h3><a target="_blank" href="https://alpha.3box.io" class="f5 fw6 db blue no-underline underline-hover">Edit 3Box profile</a></h3>
            <h3><a target="_blank" href="https://eth-claims-demo.firebaseapp.com#wallet/${state.myWallet}" class="f5 fw6 db blue no-underline underline-hover">My public profile link</a></h3>
          </div>
        ` : null }

      </header>
      ${did ? html`
        <section class="mw5 mw7-ns center bg-light-gray pa3 ph5-ns">
          <article class="pa4 black-80">
            <fieldset id="sign_up" class="ba b--transparent ph0 mh0">
              <legend class="ph0 mh0 fw6 clip">Sign Up</legend>
              <div class="mt3">
                <label class="db fw4 lh-copy f6" for="spirit-animal">Spirit Animal</label>
                <input class="pa2 input-reset ba bg-transparent w-100 measure" type="text" name="spirit-animal" onchange=${updateSpiritAnimal} value=${inputSpiritAnimalValue} ${spiritAnimalDisabled}>
              </div>
            </fieldset>
            ${(canEdit && !hasSpiritAnimal) ? html`
              <div class="mt3"><button class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onclick=${addSpiritAnimal}>Claim my spirit animal</button></div>
            ` : null}
            ${(canEdit && hasSpiritAnimal) ? html`
              <div class="mt3"><button class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onclick=${removeSpiritAnimal}>Remove this claim</button></div>
            ` : null}
          </article>
        </section>
      ` : null }
      <footer class="tc pv4 pv5-ns">
        <div class="f6 gray fw2 tracked">Copyright and related rights waived via <a class="blue no-underline underline-hover" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank">CC0</a>.</div>
        <div class="f6 gray fw2 tracked">Source code on <a class="blue no-underline underline-hover" href="https://github.com/tyleryasaka/identity-proposals/tree/master/claims-library-ethereum" target="_blank">github</a>.</div>
      </footer>
    </body>
  `
  return content

  async function updateSpiritAnimal(evt) {
    emit('updateSpiritAnimal', evt.target.value)
  }

  async function addSpiritAnimal() {
    emit('startLoading')
    await claimtasticEthereum.addSelfClaim(
      did,
      'SpiritAnimal',
      { animal: inputSpiritAnimal }
    )
    emit('loadClaims')
  }

  async function removeSpiritAnimal() {
    emit('startLoading')
    await claimtasticEthereum.removeClaim(spiritAnimalClaim.selfClaim.id)
    emit('updateSpiritAnimal', '')
    emit('loadClaims')
  }

  async function createIdentity() {
    emit('createIdentity')
  }
}

function store (state, emitter) {
  state.claimtasticEthereum = {}
  state.selfClaims = []
  state.inputSpiritAnimal = ''
  state.loading = true

  emitter.on('DOMContentLoaded', async function() {
    if (window.ethereum) {
      try {
        // Request account access if needed
        await ethereum.enable()
      } catch (error) {
        console.error('denied access')
        // User denied account access...
        return
      }
    } else if (!window.web3) {
      alert('Please use a web3-enabled browser')
      return
    }
    state.web3Provider = window.ethereum || window.web3.currentProvider
    window.claimtastic = state.claimtasticEthereum = new ClaimtasticEthereum({ web3Provider: state.web3Provider })
    const web3 = state.claimtasticEthereum.web3
    const id = await web3.eth.net.getId()
    if (id !== 4) {
      alert('Please switch to the Rinkeby testnet.')
      return
    }
    const accounts = await web3.eth.getAccounts()
    if (accounts.length === 0) {
      alert('Please enable your web3 browser by logging in')
      return
    }
    state.myWallet = accounts[0]
    emitter.emit('render')
    emitter.emit('unlock')
  })

  emitter.on('startLoading', async function() {
    state.loading = true
    emitter.emit('render')
  })

  emitter.on('endLoading', async function() {
    state.loading = false
    emitter.emit('render')
  })

  emitter.on('unlock', async function() {
    if (!state.params.wallet) {
      await state.claimtasticEthereum.unlock()
    }
    emitter.emit('loadClaims')
  })

  emitter.on('updateSpiritAnimal', async function(inputSpiritAnimal) {
    state.inputSpiritAnimal = inputSpiritAnimal
    emitter.emit('render')
  })

  emitter.on('createIdentity', async function () {
    emitter.emit('startLoading')
    const _did = await state.claimtasticEthereum.createIdentity()
    state.did = _did
    emitter.emit('endLoading')
  })

  emitter.on('loadClaims', async function () {
    emitter.emit('startLoading')
    const wallet = state.params.wallet
    const _did = state.did || await state.claimtasticEthereum.getIdentity(wallet)
    state.did = _did
    const obj = await state.claimtasticEthereum.getClaims(_did)
    const profile = await Box.getProfile(wallet || state.myWallet, state.web3Provider)
    state.name = profile.name
    state.image = (profile.images && profile.images.length) ? profile.images[0] : null
    state.selfClaims = obj.selfClaims
    emitter.emit('endLoading')
  })
}
