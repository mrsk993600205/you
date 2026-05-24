<template>
  <div class="splash-container">
    <div ref="containerRef" class="webgl-canvas"></div>
    <button v-if="showSkip" class="skip-btn" @click="skipToHome">跳过</button>
    <div class="version-info">v{{ version }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { initPlayback } from '@renderer/utils/audio/globaPlayList'
import * as THREE from 'three'

const router = useRouter()
const containerRef = ref<HTMLDivElement>()
const version = ref('1.0.0')
const showSkip = ref(false)

interface SceneProfile {
  isMobile: boolean
  textScale: number
  textParticleStep: number
  bgParticleCount: number
  bgSpread: number
  bokehCount: number
  bokehSpread: number
  bokehMinScale: number
  bokehMaxScale: number
  startCameraZ: number
  targetCameraZ: number
  pixelRatioLimit: number
  textParticleSize: number
  bgParticleSize: number
}

let renderer: THREE.WebGLRenderer | null = null
let particleTexture: THREE.CanvasTexture | null = null
let animationId = 0
let clock: THREE.Clock
let convergeProgress = 0
let textData: { targetPos: Float32Array; startPos: Float32Array; pColors: Float32Array }
let textParticles: THREE.Points
let bgParticles: THREE.Points
let bokehGroup: THREE.Group
let camera: THREE.PerspectiveCamera
let sceneProfile: SceneProfile
let textGeometryScale = 1

let convergeCheckTimer: ReturnType<typeof setInterval> | null = null

function getSceneProfile(width: number, height: number): SceneProfile {
  const shortSide = Math.min(width, height)
  const isMobile = width <= 768
  const narrowScale = Math.min(1, Math.max(0.72, shortSide / 430))

  if (!isMobile) {
    return {
      isMobile,
      textScale: 0.06,
      textParticleStep: 2,
      bgParticleCount: 800,
      bgSpread: 80,
      bokehCount: 15,
      bokehSpread: 60,
      bokehMinScale: 5,
      bokehMaxScale: 20,
      startCameraZ: 45,
      targetCameraZ: 22,
      pixelRatioLimit: 2,
      textParticleSize: 0.18,
      bgParticleSize: 0.4
    }
  }

  return {
    isMobile,
    textScale: 0.04 * narrowScale,
    textParticleStep: shortSide <= 360 ? 3 : 2,
    bgParticleCount: shortSide <= 360 ? 360 : 480,
    bgSpread: 58,
    bokehCount: 9,
    bokehSpread: 42,
    bokehMinScale: 4,
    bokehMaxScale: 12,
    startCameraZ: 52,
    targetCameraZ: 30,
    pixelRatioLimit: 1.5,
    textParticleSize: shortSide <= 360 ? 0.18 : 0.19,
    bgParticleSize: 0.34
  }
}

function getTextObjectScale(profile: SceneProfile): number {
  return profile.isMobile ? profile.textScale / textGeometryScale : 1
}

function skipToHome() {
  router.replace('/home')
}

function createCircleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function getTextParticleData(text: string, profile: SceneProfile) {
  const tCanvas = document.createElement('canvas')
  const tWidth = 600
  const tHeight = 300
  tCanvas.width = tWidth
  tCanvas.height = tHeight
  const ctx = tCanvas.getContext('2d', { willReadFrequently: true })!

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 160px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, tWidth / 2, tHeight / 2)

  const imgData = ctx.getImageData(0, 0, tWidth, tHeight).data
  const targetPos: number[] = []
  const startPos: number[] = []
  const pColors: number[] = []

  const textColorCore = new THREE.Color('#1a1a1a')
  const textColorHighlight = new THREE.Color('#e8455c')
  const step = profile.textParticleStep

  for (let y = 0; y < tHeight; y += step) {
    for (let x = 0; x < tWidth; x += step) {
      const index = (y * tWidth + x) * 4
      if (imgData[index + 3] > 128) {
        const px = (x - tWidth / 2) * profile.textScale
        const py = -(y - tHeight / 2) * profile.textScale
        const pz = (Math.random() - 0.5) * 2

        targetPos.push(px, py, pz)

        startPos.push(
          px + (Math.random() - 0.5) * profile.bgSpread,
          py + (Math.random() - 0.5) * profile.bgSpread,
          pz + (Math.random() - 0.5) * profile.bgSpread
        )

        const c = Math.random() > 0.4 ? textColorHighlight : textColorCore
        pColors.push(c.r, c.g, c.b)
      }
    }
  }

  return {
    targetPos: new Float32Array(targetPos),
    startPos: new Float32Array(startPos),
    pColors: new Float32Array(pColors)
  }
}

function createScene(width: number, height: number) {
  sceneProfile = getSceneProfile(width, height)
  const scene = new THREE.Scene()

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneProfile.pixelRatioLimit))

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.z = sceneProfile.startCameraZ

  particleTexture = createCircleTexture()

  // 背景粒子
  const bgParticleCount = sceneProfile.bgParticleCount
  const bgGeometry = new THREE.BufferGeometry()
  const bgPositions = new Float32Array(bgParticleCount * 3)
  const bgColors = new Float32Array(bgParticleCount * 3)

  const colorBrand = new THREE.Color('#e8455c')
  const colorLight = new THREE.Color('#f8b0ba')
  const colorGray = new THREE.Color('#f2e6e6')

  for (let i = 0; i < bgParticleCount; i++) {
    bgPositions[i * 3] = (Math.random() - 0.5) * sceneProfile.bgSpread
    bgPositions[i * 3 + 1] = (Math.random() - 0.5) * sceneProfile.bgSpread
    bgPositions[i * 3 + 2] = (Math.random() - 0.5) * sceneProfile.bgSpread

    const randColor = Math.random()
    let c = colorGray
    if (randColor > 0.7) c = colorLight
    if (randColor > 0.9) c = colorBrand

    bgColors[i * 3] = c.r
    bgColors[i * 3 + 1] = c.g
    bgColors[i * 3 + 2] = c.b
  }

  bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3))
  bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3))

  const bgMaterial = new THREE.PointsMaterial({
    size: sceneProfile.bgParticleSize,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: sceneProfile.isMobile ? 0.42 : 0.5,
    blending: THREE.NormalBlending,
    depthWrite: false
  })
  bgParticles = new THREE.Points(bgGeometry, bgMaterial)
  scene.add(bgParticles)

  // 散景光斑
  bokehGroup = new THREE.Group()
  for (let i = 0; i < sceneProfile.bokehCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: particleTexture,
      transparent: true,
      opacity: Math.random() * 0.2 + 0.05,
      blending: THREE.NormalBlending,
      color: Math.random() > 0.5 ? 0xe8455c : 0xf06376
    })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(
      (Math.random() - 0.5) * sceneProfile.bokehSpread,
      (Math.random() - 0.5) * sceneProfile.bokehSpread,
      15 + Math.random() * 20
    )
    const scale =
      Math.random() * (sceneProfile.bokehMaxScale - sceneProfile.bokehMinScale) +
      sceneProfile.bokehMinScale
    sprite.scale.set(scale, scale, 1)
    sprite.userData = { vy: Math.random() * 0.03 + 0.01, rx: Math.random() * 0.02 }
    bokehGroup.add(sprite)
  }
  scene.add(bokehGroup)

  // 文字粒子
  textData = getTextParticleData('Ikun', sceneProfile)
  textGeometryScale = sceneProfile.textScale
  const textGeometry = new THREE.BufferGeometry()
  textGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(textData.startPos, 3)
  )
  textGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(textData.pColors, 3)
  )

  const textMaterial = new THREE.PointsMaterial({
    size: sceneProfile.textParticleSize,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.NormalBlending,
    depthWrite: false
  })

  textParticles = new THREE.Points(textGeometry, textMaterial)
  textParticles.scale.setScalar(getTextObjectScale(sceneProfile))
  textParticles.position.y = 0
  scene.add(textParticles)

  clock = new THREE.Clock()
  convergeProgress = 0

  function animate() {
    animationId = requestAnimationFrame(animate)
    const delta = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    bgParticles.rotation.y = elapsedTime * 0.05
    bokehGroup.children.forEach((sprite) => {
      const ud = sprite.userData
      sprite.position.y += ud.vy
      sprite.position.x += Math.sin(elapsedTime + sprite.position.y) * ud.rx
      if (sprite.position.y > 40) sprite.position.y = -40
    })

    convergeProgress += (1 - convergeProgress) * delta * 1.5

    const textPosArray = textParticles.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < textData.targetPos.length / 3; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      textPosArray[ix] += (textData.targetPos[ix] - textPosArray[ix]) * convergeProgress * 0.03
      textPosArray[iy] += (textData.targetPos[iy] - textPosArray[iy]) * convergeProgress * 0.03
      textPosArray[iz] += (textData.targetPos[iz] - textPosArray[iz]) * convergeProgress * 0.03

      if (convergeProgress > 0.9) {
        textPosArray[ix] += Math.sin(elapsedTime * 1.5 + iy) * 0.001
        textPosArray[iy] += Math.cos(elapsedTime * 1.5 + ix) * 0.001
      }
    }
    textParticles.geometry.attributes.position.needsUpdate = true

    textParticles.scale.setScalar(getTextObjectScale(sceneProfile))

    camera.position.z +=
      (sceneProfile.targetCameraZ + Math.sin(elapsedTime * 0.3) * 1.0 - camera.position.z) * 0.02
    camera.lookAt(0, 0, 0)

    renderer!.render(scene, camera)

    if (!showSkip.value && convergeProgress > 0.95) {
      showSkip.value = true
      setTimeout(() => {
        if (showSkip.value) router.replace('/home')
      }, 2000)
    }
  }

  animate()
}

function handleResize() {
  if (!renderer || !camera || !containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  sceneProfile = getSceneProfile(width, height)
  camera.aspect = width / height
  camera.position.z = Math.max(camera.position.z, sceneProfile.targetCameraZ)
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneProfile.pixelRatioLimit))
  renderer.setSize(width, height)
  if (textParticles) {
    textParticles.scale.setScalar(getTextObjectScale(sceneProfile))
    ;(textParticles.material as THREE.PointsMaterial).size = sceneProfile.textParticleSize
  }
  if (bgParticles) {
    ;(bgParticles.material as THREE.PointsMaterial).size = sceneProfile.bgParticleSize
  }
}

function cleanup() {
  if (convergeCheckTimer) { clearInterval(convergeCheckTimer); convergeCheckTimer = null }
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = 0
  }
  if (renderer) {
    renderer.domElement.remove()
    renderer.dispose()
    renderer = null
  }
  if (particleTexture) {
    particleTexture.dispose()
    particleTexture = null
  }
  if (bgParticles) {
    bgParticles.geometry.dispose()
    ;(bgParticles.material as THREE.Material).dispose()
  }
  if (textParticles) {
    textParticles.geometry.dispose()
    ;(textParticles.material as THREE.Material).dispose()
  }
  if (bokehGroup) {
    bokehGroup.children.forEach((child) => {
      if (child instanceof THREE.Sprite) {
        child.material.dispose()
      }
    })
  }
  window.removeEventListener('resize', handleResize)
}

onMounted(async () => {
  if (!containerRef.value) return

  try {
    const v = await window.electron.ipcRenderer.invoke('get-app-version')
    if (v) version.value = v
  } catch { /* ignore */ }

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  createScene(width, height)
  containerRef.value.appendChild(renderer!.domElement)
  window.addEventListener('resize', handleResize)

  // 后台加载插件 & 初始化播放
  try {
    await window.electron.ipcRenderer.invoke('service-plugin-initialize-system')
  } catch { /* ignore */ }

  initPlayback().catch(() => {})
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.splash-container {
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, #ffffff 0%, #eef3f0 100%);
  box-sizing: border-box;
  overscroll-behavior: none;
}

.webgl-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  touch-action: none;
}

.webgl-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.skip-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 3;
  padding: 0.5rem 1.4rem;
  border: 1px solid rgba(232, 69, 92, 0.25);
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #e8455c;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.skip-btn:hover {
  background: rgba(232, 69, 92, 0.1);
  border-color: rgba(232, 69, 92, 0.45);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(232, 69, 92, 0.15);
}

.version-info {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: 3;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.15);
  font-family: monospace;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .splash-container {
    background: radial-gradient(circle at center, #1a1a1a 0%, #0d0d0d 100%);
  }

  .skip-btn {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(232, 69, 92, 0.3);
    color: #f06376;
  }

  .skip-btn:hover {
    background: rgba(232, 69, 92, 0.15);
    border-color: rgba(232, 69, 92, 0.5);
  }

  .version-info {
    color: rgba(255, 255, 255, 0.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
  }
}
</style>
