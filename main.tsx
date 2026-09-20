import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import './style.css'

type Layer = 'public' | 'admin' | 'ops'

const layers: Record<Layer, { index: string; title: string; body: string; signals: string[] }> = {
  public: {
    index: '01 / public',
    title: 'The part people touch.',
    body: 'Interfaces that help someone choose, understand, book, buy, and get on with their day.',
    signals: ['Responsive product UI', 'Catalogs & conversion flows', 'React / Svelte / Tailwind'],
  },
  admin: {
    index: '02 / admin',
    title: 'The part teams control.',
    body: 'Custom back offices that give a client control over content, inventory, and operations — without a developer in the loop.',
    signals: ['Purpose-built CMS', 'Role-aware workflows', 'One deploy, one product'],
  },
  ops: {
    index: '03 / ops',
    title: 'The part that proves it works.',
    body: 'Business rules, data and interfaces meet here: bookings, QR confirmation, sales signals and the decisions behind them.',
    signals: ['Ticketing & QR validation', 'Sales analytics', 'Operational dashboards'],
  },
}

const caseStudies = [
  { name: 'BKS24', type: 'Corporate platform', url: 'https://bks24.by/' },
  { name: 'Fintherm', type: 'Content-managed site', url: 'https://fintherm.com.ru/' },
  { name: 'The One', type: 'Catalog + custom CMS', url: 'https://the-one.ru/' },
]

function SystemCanvas({ active, onActive }: { active: Layer; onActive: (layer: Layer) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#1e2529', 8, 19)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 1.8, 11.5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    element.appendChild(renderer.domElement)

    const clock = new THREE.Clock()
    const pointer = new THREE.Vector2(2, 2)
    const targetRotation = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const nodes: THREE.Group[] = []

    scene.add(new THREE.HemisphereLight('#d9ded8', '#172228', 1.8))
    const key = new THREE.DirectionalLight('#76b9d2', 2.5)
    key.position.set(4, 7, 5)
    scene.add(key)

    const grid = new THREE.GridHelper(24, 24, '#36525e', '#2a3940')
    grid.position.y = -2.1
    grid.material.transparent = true
    grid.material.opacity = 0.38
    scene.add(grid)

    const specs: { layer: Layer; position: [number, number, number]; color: string; dimensions: [number, number, number] }[] = [
      { layer: 'public', position: [-3.35, 0.85, 0], color: '#96d5ec', dimensions: [2.3, 2.95, 0.25] },
      { layer: 'admin', position: [0, -0.1, 0.35], color: '#e4ddd0', dimensions: [2.6, 3.65, 0.3] },
      { layer: 'ops', position: [3.35, 0.6, -0.15], color: '#ef6553', dimensions: [2.25, 2.45, 0.22] },
    ]

    specs.forEach((spec) => {
      const group = new THREE.Group()
      group.name = spec.layer
      group.position.set(...spec.position)
      group.rotation.set(-0.1, spec.position[0] * -0.055, 0.03)

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(...spec.dimensions),
        new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.33, metalness: 0.12 }),
      )
      panel.name = spec.layer
      group.add(panel)

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(...spec.dimensions)),
        new THREE.LineBasicMaterial({ color: '#162328', transparent: true, opacity: 0.65 }),
      )
      group.add(wire)

      const slots = new THREE.Group()
      for (let i = 0; i < 4; i += 1) {
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(spec.dimensions[0] * 0.66, 0.055, 0.045),
          new THREE.MeshBasicMaterial({ color: '#17262c', transparent: true, opacity: 0.63 }),
        )
        slot.position.set(0, 0.72 - i * 0.42, spec.dimensions[2] / 2 + 0.03)
        slots.add(slot)
      }
      group.add(slots)
      nodes.push(group)
      scene.add(group)
    })

    const dust = new THREE.BufferGeometry()
    const dustPoints = Array.from({ length: 220 }, () => [
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 5 - 1,
    ]).flat()
    dust.setAttribute('position', new THREE.Float32BufferAttribute(dustPoints, 3))
    const dustCloud = new THREE.Points(dust, new THREE.PointsMaterial({ color: '#a2c7ce', size: 0.025, transparent: true, opacity: 0.75 }))
    scene.add(dustCloud)

    const resize = () => {
      const { width, height } = element.getBoundingClientRect()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)

    const onMove = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      targetRotation.set(pointer.y * 0.08, pointer.x * 0.16)
    }
    const onLeave = () => targetRotation.set(0, 0)
    const onClick = () => {
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(nodes, true)[0]
      let target: THREE.Object3D | undefined = hit?.object
      while (target && !target.name) target = target.parent ?? undefined
      const layer = target?.name as Layer | undefined
      if (layer && layer in layers) onActive(layer)
    }
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerleave', onLeave)
    renderer.domElement.addEventListener('click', onClick)

    let frame = 0
    const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animate = () => {
      const elapsed = clock.getElapsedTime()
      scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, targetRotation.x, 0.04)
      scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, targetRotation.y, 0.04)
      nodes.forEach((node, index) => {
        const isActive = node.name === activeRef.current
        node.position.y += ((isActive ? 0.11 : 0) - node.position.y + specs[index].position[1]) * 0.07
        if (!motionReduced) node.rotation.z = Math.sin(elapsed * 0.55 + index) * 0.018
      })
      if (!motionReduced) dustCloud.rotation.y = elapsed * 0.015
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.dispose()
      element.removeChild(renderer.domElement)
    }
  }, [onActive])

  return <div className="system-canvas" ref={host} aria-hidden="true" />
}

function App() {
  const [active, setActive] = useState<Layer>('admin')
  const current = layers[active]

  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="wordmark" href="#top" aria-label="br2nd.tech home">br2nd<span>.</span>tech</a>
        <a href="#systems">Systems</a>
        <a href="#work">Work</a>
        <a className="github-link" href="https://github.com/br2nd-tech" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">TypeScript product developer</p>
          <h1>Interfaces are only<br />half the product.</h1>
          <p className="intro">I build the public surface, the back office behind it, and the operational workflows that make both useful.</p>
          <a className="quiet-link" href="#systems">Explore the system <span>↓</span></a>
        </div>
        <div className="hero-index" aria-label="Available for freelance product work">
          <span className="pulse" /> Available for selected builds
        </div>
      </section>

      <section className="systems" id="systems" aria-labelledby="systems-heading">
        <div className="scene-wrap">
          <SystemCanvas active={active} onActive={setActive} />
          <p className="scene-note">Move through the system. Click a module.</p>
        </div>
        <div className="system-detail">
          <p className="kicker" id="systems-heading">Product system / three layers</p>
          <div className="switcher" role="tablist" aria-label="Product layers">
            {(Object.keys(layers) as Layer[]).map((layer) => (
              <button key={layer} role="tab" aria-selected={active === layer} onClick={() => setActive(layer)}>{layers[layer].index}</button>
            ))}
          </div>
          <p className="system-number">{current.index}</p>
          <h2>{current.title}</h2>
          <p className="detail-copy">{current.body}</p>
          <ul>
            {current.signals.map((signal) => <li key={signal}>{signal}</li>)}
          </ul>
        </div>
      </section>

      <section className="work" id="work" aria-labelledby="work-heading">
        <div className="section-lede">
          <p className="kicker">Selected work</p>
          <h2 id="work-heading">Production work, not concept screens.</h2>
          <p>Each project includes the parts a client needs to actually run it — not just a nice first page.</p>
        </div>
        <div className="case-list">
          {caseStudies.map((study, index) => (
            <a className="case" key={study.name} href={study.url} target="_blank" rel="noreferrer">
              <span>0{index + 1}</span>
              <strong>{study.name}</strong>
              <em>{study.type}</em>
              <b>↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className="ticketing" aria-labelledby="ticketing-heading">
        <p className="kicker">In build / ticketing platform</p>
        <h2 id="ticketing-heading">One booking.<br />One code.<br />A traceable sale.</h2>
        <div className="ticket-layout">
          <p>An anonymised product case: booking, QR confirmation at entry, and sales analytics in a shared operational dashboard.</p>
          <div className="qr-card" aria-label="Stylised QR ticket preview">
            <div className="qr-grid" />
            <span>VALID / 18:42</span>
            <small>Entry confirmed</small>
          </div>
        </div>
      </section>

      <footer>
        <p>br2nd.tech / TypeScript, React, Svelte, Tailwind</p>
        <a href="https://github.com/br2nd-tech" target="_blank" rel="noreferrer">github.com/br2nd-tech ↗</a>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
