import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import './style.css'

type Layer = 'surface' | 'control' | 'signal'

const layerOrder: Layer[] = ['surface', 'control', 'signal']

const layers: Record<Layer, {
  label: string
  code: string
  title: string
  body: string
  proof: string
  color: string
}> = {
  surface: {
    label: 'Public surface',
    code: 'UI',
    title: 'The part people choose.',
    body: 'Clear product interfaces for browsing, understanding, booking and buying.',
    proof: 'React · Svelte · responsive UI',
    color: '#2347ff',
  },
  control: {
    label: 'Control room',
    code: 'CMS',
    title: 'The part the team owns.',
    body: 'A custom back office shaped around the actual work — content, inventory and decisions.',
    proof: 'Purpose-built admin · roles · one deploy',
    color: '#ff4f2e',
  },
  signal: {
    label: 'Operational signal',
    code: 'OPS',
    title: 'The part that closes the loop.',
    body: 'Bookings, QR validation, sales signals and the rules that keep the product moving.',
    proof: 'Workflows · analytics · live state',
    color: '#75e2f0',
  },
}

const caseStudies = [
  {
    name: 'BKS24',
    href: 'https://bks24.by/',
    kind: 'Corporate platform',
    copy: 'A production website built to make a technical company understandable at a glance.',
    stack: 'TypeScript · responsive frontend',
    visual: 'bks',
  },
  {
    name: 'Fintherm',
    href: 'https://fintherm.com.ru/',
    kind: 'Website + content system',
    copy: 'The public site and its editing workflow shipped as one maintainable product.',
    stack: 'Custom CMS · content operations',
    visual: 'fintherm',
  },
  {
    name: 'The One',
    href: 'https://the-one.ru/',
    kind: 'Catalog + control room',
    copy: 'A visual product catalog backed by an admin built to control every meaningful detail.',
    stack: 'Catalog · custom admin · deployment',
    visual: 'theone',
  },
]

function ProductMachine({ active, onActive }: { active: Layer; onActive: (layer: Layer) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#edebe4', 12, 24)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.2, 13)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.setAttribute('aria-hidden', 'true')
    element.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight('#ffffff', '#98a7af', 2.4))
    const key = new THREE.DirectionalLight('#ffffff', 4.2)
    key.position.set(6, 8, 8)
    scene.add(key)
    const blue = new THREE.PointLight('#2347ff', 18, 15)
    blue.position.set(-5, -2, 4)
    scene.add(blue)
    const orange = new THREE.PointLight('#ff4f2e', 12, 12)
    orange.position.set(5, 3, 2)
    scene.add(orange)

    const machine = new THREE.Group()
    machine.position.set(0.65, -0.05, 0)
    machine.rotation.set(-0.06, -0.22, -0.025)
    scene.add(machine)

    const targetRotation = new THREE.Vector2(-0.06, -0.22)
    const pointer = new THREE.Vector2(2, 2)
    const raycaster = new THREE.Raycaster()
    const pickTargets: THREE.Object3D[] = []
    const cardMounts: THREE.Group[] = []
    const materials: Record<Layer, THREE.MeshStandardMaterial> = {} as Record<Layer, THREE.MeshStandardMaterial>
    const wheel = new THREE.Group()
    machine.add(wheel)

    const stepAngle = (Math.PI * 2) / layerOrder.length
    const wheelRadius = 2.05
    const cardWidth = 5.8
    const cardHeight = 3.32
    let selectedIndex = layerOrder.indexOf(activeRef.current)
    wheel.rotation.x = -selectedIndex * stepAngle
    let targetWheelAngle = wheel.rotation.x
    let wheelVelocity = 0

    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#171b19', roughness: 0.4, metalness: 0.62 })
    const hardwareMaterial = new THREE.MeshStandardMaterial({ color: '#d9d7cf', roughness: 0.26, metalness: 0.82 })

    layerOrder.forEach((layer, layerIndex) => {
      const pivot = new THREE.Group()
      pivot.rotation.x = layerIndex * stepAngle
      wheel.add(pivot)

      const arms = new THREE.Group()
      ;[-cardWidth * 0.38, cardWidth * 0.38].forEach((x) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.055, wheelRadius, 0.055), hardwareMaterial)
        arm.position.set(x, wheelRadius / 2, 0)
        arms.add(arm)
      })
      pivot.add(arms)

      const hinge = new THREE.Group()
      hinge.position.y = wheelRadius
      pivot.add(hinge)
      cardMounts.push(hinge)

      const hingeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, cardWidth + 0.5, 20), hardwareMaterial)
      hingeBar.rotation.z = Math.PI / 2
      hinge.add(hingeBar)

      ;[-cardWidth * 0.4, cardWidth * 0.4].forEach((x) => {
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 10, 28), frameMaterial)
        collar.position.x = x
        collar.rotation.y = Math.PI / 2
        hinge.add(collar)
      })

      const card = new THREE.Group()
      card.name = layer
      card.position.y = -(cardHeight / 2 + 0.18)
      hinge.add(card)

      const frame = new THREE.Mesh(new THREE.BoxGeometry(cardWidth + 0.22, cardHeight + 0.22, 0.18), frameMaterial)
      frame.name = layer
      card.add(frame)
      pickTargets.push(frame)

      const material = new THREE.MeshStandardMaterial({
        color: layers[layer].color,
        emissive: layers[layer].color,
        emissiveIntensity: layer === activeRef.current ? 0.3 : 0.05,
        roughness: 0.34,
        metalness: 0.16,
      })
      materials[layer] = material
      const screen = new THREE.Mesh(new THREE.BoxGeometry(cardWidth, cardHeight, 0.2), material)
      screen.name = layer
      screen.position.z = 0.13
      card.add(screen)
      pickTargets.push(screen)

      const ink = new THREE.MeshBasicMaterial({ color: '#111412', transparent: true, opacity: 0.82 })
      const paleInk = new THREE.MeshBasicMaterial({ color: '#edebe4', transparent: true, opacity: 0.78 })
      const content = new THREE.Group()
      content.position.z = 0.26
      card.add(content)

      const header = new THREE.Mesh(new THREE.BoxGeometry(cardWidth * 0.88, 0.12, 0.035), ink)
      header.position.y = cardHeight * 0.34
      content.add(header)

      if (layer === 'surface') {
        const hero = new THREE.Mesh(new THREE.BoxGeometry(cardWidth * 0.52, cardHeight * 0.5, 0.04), paleInk)
        hero.position.set(-cardWidth * 0.16, -0.12, 0)
        content.add(hero)
        for (let i = 0; i < 3; i += 1) {
          const line = new THREE.Mesh(new THREE.BoxGeometry(cardWidth * (0.25 - i * 0.035), 0.09, 0.045), ink)
          line.position.set(cardWidth * 0.3, 0.42 - i * 0.32, 0)
          content.add(line)
        }
      }

      if (layer === 'control') {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(cardWidth * 0.16, cardHeight * 0.68, 0.04), ink)
        rail.position.set(-cardWidth * 0.36, -0.12, 0)
        content.add(rail)
        for (let i = 0; i < 6; i += 1) {
          const cell = new THREE.Mesh(new THREE.BoxGeometry(cardWidth * 0.25, 0.34, 0.045), i % 2 ? ink : paleInk)
          cell.position.set(-cardWidth * 0.08 + (i % 2) * cardWidth * 0.29, 0.44 - Math.floor(i / 2) * 0.55, 0)
          content.add(cell)
        }
      }

      if (layer === 'signal') {
        ;[0.32, 0.7, 0.48, 0.88, 0.6, 1].forEach((height, index) => {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, cardHeight * height * 0.44, 0.045), ink)
          bar.position.set(-1.25 + index * 0.5, -cardHeight * 0.18 + (cardHeight * height * 0.22), 0)
          content.add(bar)
        })
        const status = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 20), paleInk)
        status.position.set(cardWidth * 0.35, -cardHeight * 0.24, 0.02)
        content.add(status)
      }
    })

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7.3, 28), frameMaterial)
    axle.rotation.z = Math.PI / 2
    machine.add(axle)

    ;[-3.3, 3.3].forEach((x) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius, 0.08, 12, 80), hardwareMaterial)
      rim.position.x = x
      rim.rotation.y = Math.PI / 2
      wheel.add(rim)

      for (let spokeIndex = 0; spokeIndex < 6; spokeIndex += 1) {
        const angle = (spokeIndex / 6) * Math.PI * 2
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, wheelRadius * 1.92, 10), hardwareMaterial)
        spoke.position.x = x
        spoke.rotation.x = angle
        wheel.add(spoke)
      }

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.28, 24), frameMaterial)
      hub.position.x = x
      hub.rotation.z = Math.PI / 2
      wheel.add(hub)
    })

    const counter = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.07, 12, 60),
      new THREE.MeshStandardMaterial({ color: '#ff4f2e', emissive: '#ff4f2e', emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.24 }),
    )
    counter.position.set(3.48, 0, 0)
    counter.rotation.y = Math.PI / 2
    wheel.add(counter)

    const dustGeometry = new THREE.BufferGeometry()
    const dust = Array.from({ length: 260 }, () => [
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    ]).flat()
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dust, 3))
    const dustCloud = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({ color: '#2347ff', size: 0.028, transparent: true, opacity: 0.52 }),
    )
    scene.add(dustCloud)

    let dragging = false
    let moved = 0
    let lastX = 0
    let lastY = 0

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerDown = (event: PointerEvent) => {
      dragging = true
      moved = 0
      lastX = event.clientX
      lastY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.classList.add('is-dragging')
    }

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event)
      if (dragging) {
        const dx = event.clientX - lastX
        const dy = event.clientY - lastY
        moved += Math.abs(dx) + Math.abs(dy)
        targetRotation.y += dx * 0.006
        targetRotation.x = THREE.MathUtils.clamp(targetRotation.x + dy * 0.004, -0.55, 0.34)
        lastX = event.clientX
        lastY = event.clientY
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      updatePointer(event)
      if (moved < 8) {
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObjects(pickTargets, false)[0]
        const layer = hit?.object.name as Layer | undefined
        if (layer && layer in layers) onActive(layer)
      }
      dragging = false
      renderer.domElement.classList.remove('is-dragging')
    }

    const onPointerLeave = () => {
      dragging = false
      renderer.domElement.classList.remove('is-dragging')
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const { width, height } = element.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.position.z = width < 720 ? 15.8 : 13
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(element)

    const timer = new THREE.Timer()
    timer.connect(document)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const animate = (timestamp?: number) => {
      timer.update(timestamp)
      const elapsed = timer.getElapsed()
      machine.rotation.x = THREE.MathUtils.lerp(machine.rotation.x, targetRotation.x, 0.075)
      machine.rotation.y = THREE.MathUtils.lerp(machine.rotation.y, targetRotation.y, 0.075)

      const nextIndex = layerOrder.indexOf(activeRef.current)
      if (nextIndex !== selectedIndex) {
        const baseTarget = -nextIndex * stepAngle
        targetWheelAngle = baseTarget + Math.round((wheel.rotation.x - baseTarget) / (Math.PI * 2)) * Math.PI * 2
        selectedIndex = nextIndex
      }

      if (reducedMotion) {
        wheel.rotation.x = targetWheelAngle
        wheelVelocity = 0
      } else {
        wheelVelocity += (targetWheelAngle - wheel.rotation.x) * 0.025
        wheelVelocity *= 0.82
        wheel.rotation.x += wheelVelocity
      }

      cardMounts.forEach((mount, index) => {
        const lag = reducedMotion ? 0 : -wheelVelocity * 1.7
        mount.rotation.x = THREE.MathUtils.lerp(mount.rotation.x, lag, 0.13)
        const layer = layerOrder[index]
        mount.position.z = THREE.MathUtils.lerp(mount.position.z, layer === activeRef.current ? 1.55 : 0, 0.11)
        materials[layer].emissiveIntensity = THREE.MathUtils.lerp(
          materials[layer].emissiveIntensity,
          layer === activeRef.current ? 0.32 : 0.045,
          0.09,
        )
      })

      if (!reducedMotion) dustCloud.rotation.y = elapsed * 0.012

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      timer.dispose()
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      renderer.dispose()
      element.removeChild(renderer.domElement)
    }
  }, [onActive])

  return <div className="machine-canvas" ref={host} />
}

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === 'bks') {
    return (
      <div className="visual visual-bks" aria-hidden="true">
        <div className="browser-line" />
        <div className="bks-type">BKS</div>
        <div className="bks-grid"><i /><i /><i /><i /></div>
      </div>
    )
  }

  if (kind === 'fintherm') {
    return (
      <div className="visual visual-fintherm" aria-hidden="true">
        <div className="heat-disc" />
        <div className="admin-window"><i /><i /><i /><i /><i /></div>
        <div className="temperature">+72°C</div>
      </div>
    )
  }

  return (
    <div className="visual visual-theone" aria-hidden="true">
      <div className="one-word">ONE</div>
      <div className="catalog-sheet sheet-a" />
      <div className="catalog-sheet sheet-b" />
      <div className="catalog-sheet sheet-c" />
    </div>
  )
}

function ProjectCard({ study, index }: { study: typeof caseStudies[number]; index: number }) {
  const card = useRef<HTMLAnchorElement>(null)
  const onMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const element = card.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width - 0.5) * 18}px`)
    element.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height - 0.5) * 18}px`)
  }
  const onLeave = () => {
    card.current?.style.setProperty('--mx', '0px')
    card.current?.style.setProperty('--my', '0px')
  }

  return (
    <a ref={card} className={`project project-${study.visual}`} href={study.href} target="_blank" rel="noreferrer" onPointerMove={onMove} onPointerLeave={onLeave} style={{ '--project-index': index } as CSSProperties}>
      <div className="project-copy">
        <div className="project-meta"><span>{study.kind}</span><b>↗</b></div>
        <h3>{study.name}</h3>
        <p>{study.copy}</p>
        <small>{study.stack}</small>
      </div>
      <ProjectVisual kind={study.visual} />
    </a>
  )
}

function TicketFlow() {
  const [step, setStep] = useState(2)
  const steps = [
    { name: 'Booking', value: '42 seats', note: 'A real order enters the system.' },
    { name: 'QR issue', value: 'TK–1842', note: 'A unique code connects payment and entry.' },
    { name: 'Validation', value: 'Valid', note: 'The door gets an immediate, unambiguous answer.' },
    { name: 'Analytics', value: '$ 8,420', note: 'The sale becomes a useful operational signal.' },
  ]
  const current = steps[step]

  return (
    <div className="flow-console">
      <div className="flow-steps" role="tablist" aria-label="Ticketing workflow">
        {steps.map((item, index) => (
          <button key={item.name} role="tab" aria-selected={step === index} onClick={() => setStep(index)}><span>{item.name}</span><i /></button>
        ))}
      </div>
      <div className="flow-output" aria-live="polite">
        <div className={`qr-mark ${step === 2 ? 'is-valid' : ''}`}><span /></div>
        <div>
          <small>System output</small>
          <strong>{current.value}</strong>
          <p>{current.note}</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [active, setActive] = useState<Layer>('control')
  const [time, setTime] = useState('')
  const current = layers[active]

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main>
      <section className="hero" id="top">
        <nav className="topbar" aria-label="Primary navigation">
          <a className="wordmark" href="#top" aria-label="br2nd.tech home">br2nd<span>.</span>tech</a>
          <div className="nav-system"><i /> System online <span>{time}</span></div>
          <a href="#work">Work</a>
          <a href="https://github.com/br2nd-tech" target="_blank" rel="noreferrer">GitHub</a>
        </nav>

        <ProductMachine active={active} onActive={setActive} />

        <div className="hero-copy">
          <p>TypeScript product developer</p>
          <h1>Visible is not<br />the same as<br />finished.</h1>
          <span>I build the interface, the custom admin and the operational logic behind both.</span>
        </div>

        <div className="layer-console">
          <div className="console-head"><span>Inspect the product</span><small>Wheel / 120° steps</small></div>
          <div className="layer-tabs" role="tablist" aria-label="Product layers">
            {layerOrder.map((layer) => (
              <button key={layer} role="tab" aria-selected={active === layer} onClick={() => setActive(layer)}><span>{layers[layer].code}</span>{layers[layer].label}</button>
            ))}
          </div>
          <div className="layer-readout">
            <strong>{current.title}</strong>
            <p>{current.body}</p>
            <small>{current.proof}</small>
          </div>
        </div>

        <a className="scroll-cue" href="#thesis"><i /> Scroll to open the system</a>
      </section>

      <section className="thesis" id="thesis">
        <div className="thesis-index">One product / three realities</div>
        <p className="thesis-large">A polished screen gets attention. A system that can be operated, edited and measured earns its keep.</p>
        <div className="thesis-aside"><span>What ships</span><p>Public UI<br />Custom admin<br />Product workflows<br />Deployment</p></div>
      </section>

      <section className="work" id="work" aria-labelledby="work-title">
        <header className="work-header">
          <p>Selected production work</p>
          <h2 id="work-title">Built for use,<br />not applause.</h2>
          <span>Three live products. Each one includes the less visible work that keeps it useful after launch.</span>
        </header>
        <div className="projects">{caseStudies.map((study, index) => <ProjectCard key={study.name} study={study} index={index} />)}</div>
      </section>

      <section className="ticketing" aria-labelledby="ticketing-title">
        <div className="ticket-copy">
          <p>System in progress</p>
          <h2 id="ticketing-title">From a seat<br />to a signal.</h2>
          <span>One operational product handles booking, ticket generation, QR confirmation at the door and the sales picture behind it.</span>
        </div>
        <TicketFlow />
      </section>

      <section className="contact">
        <div className="contact-status"><i /> Available for one serious build</div>
        <h2>Need the whole product,<br />not just its homepage?</h2>
        <a href="https://github.com/br2nd-tech" target="_blank" rel="noreferrer">Start on GitHub <span>↗</span></a>
      </section>

      <footer>
        <a className="wordmark" href="#top">br2nd<span>.</span>tech</a>
        <p>TypeScript · React · Svelte · Tailwind · WebGL</p>
        <p>Interface / Admin / Operations</p>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
