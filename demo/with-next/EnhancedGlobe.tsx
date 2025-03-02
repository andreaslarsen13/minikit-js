"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { OrbitControls, Sphere } from "@react-three/drei"
import * as THREE from "three"
import { TextureLoader } from "three/src/loaders/TextureLoader"

const vertexShader = `
  uniform float u_time;
  uniform float u_maxExtrusion;

  void main() {
    vec3 newPosition = position;
    newPosition.xyz = newPosition.xyz * (1.0 + u_maxExtrusion * 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 u_color;
  uniform float u_opacity;

  void main() {
    gl_FragColor = vec4(u_color, u_opacity);
  }
`

function Dots() {
  const { scene } = useThree()
  const dotsRef = useRef<THREE.Group>(new THREE.Group())
  const emojisRef = useRef<THREE.Group>(new THREE.Group())

  const [worldTexture] = useLoader(TextureLoader, [
    "https://raw.githubusercontent.com/jessehhydee/threejs-globe/main/img/world_alpha_mini.jpg",
  ])

  const dotMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: new THREE.Color(0x1a1a2e) },
        u_opacity: { value: 1.0 },
        u_maxExtrusion: { value: 0.0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  // Create emoji texture
  const emojiCanvas = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")!
    ctx.font = "48px serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("📱", canvas.width / 2, canvas.height / 2)
    return canvas
  }, [])

  const emojiTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(emojiCanvas)
    texture.needsUpdate = true
    return texture
  }, [emojiCanvas])

  const emojiMaterial = useMemo(() => {
    return new THREE.SpriteMaterial({
      map: emojiTexture,
      transparent: true,
    })
  }, [emojiTexture])

  useEffect(() => {
    if (!worldTexture || !dotsRef.current) return

    const dotGroup = dotsRef.current
    const dotDensity = 2.5
    const dotSphereRadius = 20

    const canvas = document.createElement("canvas")
    canvas.width = worldTexture.image.width
    canvas.height = worldTexture.image.height
    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(worldTexture.image, 0, 0)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    for (let lat = 90, latIndex = 0; lat > -90; lat--, latIndex++) {
      const radius = Math.cos(Math.abs(lat) * (Math.PI / 180)) * dotSphereRadius
      const circumference = radius * Math.PI * 2
      const dotsForLat = circumference * dotDensity

      for (let i = 0; i < dotsForLat; i++) {
        const long = -180 + (i * 360) / dotsForLat

        const x = Math.floor(((long + 180) / 360) * canvas.width)
        const y = Math.floor(((90 - lat) / 180) * canvas.height)
        const index = (y * canvas.width + x) * 4

        const red = imageData.data[index]
        const green = imageData.data[index + 1]
        const blue = imageData.data[index + 2]

        if (red < 80 && green < 80 && blue < 80) {
          const phi = (90 - lat) * (Math.PI / 180)
          const theta = (long + 180) * (Math.PI / 180)

          const dotX = -(dotSphereRadius * Math.sin(phi) * Math.cos(theta))
          const dotZ = dotSphereRadius * Math.sin(phi) * Math.sin(theta)
          const dotY = dotSphereRadius * Math.cos(phi)

          const vector = new THREE.Vector3(dotX, dotY, dotZ)

          const dotGeometry = new THREE.CircleGeometry(0.1, 5)
          dotGeometry.lookAt(vector)
          dotGeometry.translate(vector.x, vector.y, vector.z)

          const mesh = new THREE.Mesh(dotGeometry, dotMaterial.clone())
          mesh.userData.isHighlighted = false
          mesh.userData.highlightDuration = 0
          mesh.userData.originalPosition = vector.clone()
          dotGroup.add(mesh)
        }
      }
    }

    scene.add(dotGroup)
    scene.add(emojisRef.current)

    return () => {
      scene.remove(dotGroup)
      scene.remove(emojisRef.current)
    }
  }, [scene, worldTexture, dotMaterial])

  useFrame(() => {
    const dotGroup = dotsRef.current
    const emojiGroup = emojisRef.current
    if (!dotGroup || !emojiGroup) return

    // Update existing emojis
    emojiGroup.children.forEach((emoji: THREE.Sprite) => {
      if (!emoji.userData.startTime) return

      const age = (Date.now() - emoji.userData.startTime) / 1500 // 1.5 seconds total duration
      if (age > 1.5) {
        emojiGroup.remove(emoji)
        const dot = emoji.userData.originalDot
        if (dot) dot.userData.isHighlighted = false
        return
      }

      // Custom easing function for more realistic arc
      const progress =
        age < 0.4
          ? Math.pow(age / 0.4, 0.5) // Quick initial pop
          : 1 - Math.pow((age - 0.4) / 1.1, 1.5) // Slower descent with gravity

      const direction = emoji.position.clone().normalize()

      // Base distance with more pronounced arc
      const baseDistance = 21
      const rangeMultiplier = emoji.userData.rangeFactor
      const distance = baseDistance + progress * rangeMultiplier * 2

      emoji.position.copy(direction.multiplyScalar(distance))

      // Add slight rotation based on distance using rotation.z
      emoji.rotation.z = distance * 0.2
    })

    // Add new emojis
    dotGroup.children.forEach((dot: THREE.Mesh) => {
      if (!dot.userData.isHighlighted && Math.random() < 0.00004 && emojiGroup.children.length < 5) {
        dot.userData.isHighlighted = true

        const sprite = new THREE.Sprite(emojiMaterial)
        sprite.scale.set(2, 2, 2)
        sprite.position.copy(dot.userData.originalPosition)
        sprite.userData.startTime = Date.now()
        sprite.userData.originalDot = dot
        sprite.userData.rangeFactor = 2.5 + Math.random() * 2 // Range from 2.5 to 4.5
        sprite.rotation.z = 0 // Initialize rotation

        emojiGroup.add(sprite)
      }
    })
  })

  return null
}

function BaseSphere() {
  return (
    <Sphere args={[19.5, 35, 35]}>
      <meshBasicMaterial color="#f5f5f5" transparent opacity={0.99} />
    </Sphere>
  )
}

function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 100], fov: 30 }}>
      <BaseSphere />
      <Dots />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.5}
        maxPolarAngle={Math.PI / 2 + 0.5}
        autoRotate
        autoRotateSpeed={1.875}
      />
    </Canvas>
  )
}

export default function EnhancedGlobe() {
  return (
    <div className="w-full h-[400px] my-12">
      <style jsx>{`
        .globe-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      `}</style>
      <div className="globe-container">
        <Globe />
      </div>
    </div>
  )
}

