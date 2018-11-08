const html = require('choo/html')
const devtools = require('choo-devtools')
const choo = require('choo')
const ClaimtasticEthereum = require('../src/index')
import '../node_modules/tachyons/css/tachyons.min.css'

const app = choo()
app.use(devtools())
app.use(store)
app.route('/', mainView)
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
  const spiritAnimalDisabled = hasSpiritAnimal ? 'disabled' : null
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
        ` : html `
          <button class="b ph3 pv2 ba b--black bg-transparent grow pointer f6" onclick=${createIdentity}>Create identity</button>
        `}
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
            ${!hasSpiritAnimal ? html`
              <div class="mt3"><button class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onclick=${addSpiritAnimal}>Claim my spirit animal</button></div>
            ` : null}
            ${hasSpiritAnimal ? html`
              <div class="mt3"><button class="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onclick=${removeSpiritAnimal}>Remove this claim</button></div>
            ` : null}
          </article>
        </section>
      ` : null }
    </body>
  `
  return content

  async function unlock() {
    emit('unlock')
  }

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

  emitter.on('DOMContentLoaded', function() {
    window.claimtastic = state.claimtasticEthereum = new ClaimtasticEthereum({ web3: window.web3 })
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
    await state.claimtasticEthereum.unlock()
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
    const _did = state.did || await state.claimtasticEthereum.getIdentity()
    state.did = _did
    const obj = await state.claimtasticEthereum.getClaims(_did)
    state.name = await state.claimtasticEthereum.box.public.get('name')
    const images = await state.claimtasticEthereum.box.public.get('image')
    state.image = (images && images.length) ? images[0] : null
    state.selfClaims = obj.selfClaims
    emitter.emit('endLoading')
  })
}
