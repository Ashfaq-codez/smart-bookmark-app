'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// A real 3D bird (public/models/bird.glb, made by an artist, with its own wing animation) flying over the picture.
// The flight is worked out every frame, like a real bird's:
//   - it follows a smooth looping route, with depth, so it passes nearer and further away
//   - its speed rises and falls, faster when diving, slower when climbing
//   - it banks (rolls) into every turn, and pitches up to climb and down to descend
//   - it flaps faster when climbing, normally when level, and stops flapping to glide on the way down
// The route is in % of the box (so it fits any screen) and keeps clear of the sign-in card.
// Only drawn while the page is visible. Calls onFail if 3D can't be shown, so the page can use the painted bird.

export type Pt = [number, number]

const MODEL_URL = '/models/bird.glb'

type Props = {
  route: Pt[]          // waypoints, in % of the box (x across, y down)
  size: number         // the bird's wingspan, as a share of the box width (0.06 = 6%)
  speed: number        // average speed, in box widths per second
  onFail: () => void
}

export default function Bird3D({ route, size, speed, onFail }: Props) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = box.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      onFail()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    host.appendChild(renderer.domElement)
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })

    const scene = new THREE.Scene()
    // warm daylight, like the painting: soft sky and ground light plus a low sun from the upper left
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb89a72, 1.6))
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.2)
    sun.position.set(-3, 5, 6)
    scene.add(sun)

    // camera looking straight at the wall; the box is 10 units wide at depth 0
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200)
    camera.position.set(0, 0, 30)
    let worldW = 10, worldH = 10
    const fit = () => {
      const w = host.clientWidth || 1, h = host.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
      worldW = worldH * camera.aspect
    }
    fit()
    const resize = new ResizeObserver(fit)
    resize.observe(host)

    // the route as a smooth closed curve; depth swings gently so the bird comes nearer and goes away
    const toWorld = (p: Pt, i: number) => new THREE.Vector3((p[0] / 100 - 0.5) * worldW, (0.5 - p[1] / 100) * worldH, Math.sin(i * 1.7) * 2.2)
    let curve = new THREE.CatmullRomCurve3(route.map(toWorld), true, 'centripetal')
    const rebuild = () => { curve = new THREE.CatmullRomCurve3(route.map(toWorld), true, 'centripetal') }
    const resizeCurve = new ResizeObserver(rebuild)
    resizeCurve.observe(host)

    const holder = new THREE.Group()     // moved and turned along the route
    scene.add(holder)
    let mixer: THREE.AnimationMixer | null = null
    let flap: THREE.AnimationAction | null = null
    let disposed = false

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        // scale it so its wingspan is `size` of the box width, and centre it
        const b = new THREE.Box3().setFromObject(model)
        const dims = b.getSize(new THREE.Vector3())
        const span = Math.max(dims.x, dims.z) || 1
        model.scale.setScalar((size * worldW) / span)
        const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
        model.position.sub(c)
        // the model's nose points along +Z; the holder's "forward" is +Z too, so lookAt() works directly
        holder.add(model)
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model)
          const clip = gltf.animations.find((a) => /fly|flap|wing/i.test(a.name)) || gltf.animations[0]
          flap = mixer.clipAction(clip)
          flap.play()
        }
      },
      undefined,
      () => { if (!disposed) onFail() },
    )

    // flight state
    let u = 0                       // where on the route (0..1)
    let v = speed                   // current speed
    let roll = 0, flapRate = 1, gliding = 0
    const pos = new THREE.Vector3(), ahead = new THREE.Vector3(), tan = new THREE.Vector3(), tan2 = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf = 0, visible = !document.hidden

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!visible) return
      const len = curve.getLength() || 1
      curve.getTangentAt(u, tan)
      // gravity: faster when heading down, slower when climbing; eased so it never jumps
      const target = speed * worldW * (1 - tan.y * 0.55)
      v += (target - v) * Math.min(1, dt * 1.5)
      u = (u + (v * dt) / len) % 1
      curve.getPointAt(u, pos)
      curve.getPointAt((u + 0.01) % 1, ahead)
      curve.getTangentAt((u + 0.02) % 1, tan2)
      holder.position.copy(pos)
      holder.lookAt(ahead)
      // bank into the turn: how fast the heading is changing sideways
      const turn = tan.x * tan2.y - tan.y * tan2.x + (tan.x * tan2.z - tan.z * tan2.x) * 0.6
      roll += (THREE.MathUtils.clamp(-turn * 14, -0.9, 0.9) - roll) * Math.min(1, dt * 3)
      holder.rotateZ(roll)
      // wings: harder when climbing, gliding (wings held) on a long way down
      gliding = tan.y < -0.28 ? Math.min(1, gliding + dt * 1.2) : Math.max(0, gliding - dt * 2.5)
      const wantRate = (tan.y > 0.15 ? 1.45 : 1) * (1 - gliding * 0.95)
      flapRate += (wantRate - flapRate) * Math.min(1, dt * 4)
      if (flap) flap.timeScale = flapRate
      mixer?.update(dt)
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)
    const onVis = () => { visible = !document.hidden; clock.getDelta() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      resize.disconnect()
      resizeCurve.disconnect()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    // the route and size are fixed for the page's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={box} aria-hidden="true" className="absolute inset-0 pointer-events-none" />
}
