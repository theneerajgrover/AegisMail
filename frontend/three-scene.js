/**
 * AegisMail 3D - Interactive Holographic 3D Mail Node & Shield Visualizer
 * Uses Three.js for rendering responsive 3D cyber-envelope and particle orbit.
 */

class MailScene3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container || typeof THREE === 'undefined') {
      console.warn("Three.js not loaded or container not found.");
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mainGroup = null;
    this.envelopeMesh = null;
    this.flapMesh = null;
    this.orbitRing1 = null;
    this.orbitRing2 = null;
    this.particles = null;

    this.targetRotationX = 0;
    this.targetRotationY = 0;
    this.currentRotationX = 0;
    this.currentRotationY = 0;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.state = 'Idle'; // Idle, Safe, Spam, Scanning

    this.colors = {
      idle: 0x06b6d4,      // Cyan
      safe: 0x10b981,      // Emerald
      spam: 0xf43f5e,      // Crimson
      scanning: 0x6366f1   // Indigo
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 220;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);

    // 2. Renderer with antialias and alpha
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    this.pointLight = new THREE.PointLight(this.colors.idle, 3.5, 12);
    this.pointLight.position.set(2, 2, 3);
    this.scene.add(this.pointLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(-3, -2, -2);
    this.scene.add(backLight);

    // 4. Main Group
    this.mainGroup = new THREE.Group();
    this.scene.add(this.mainGroup);

    // 5. Build 3D Mail Envelope
    this.buildEnvelope();

    // 6. Build Cyber Orbit Rings
    this.buildOrbitRings();

    // 7. Build Particle Dust
    this.buildParticles();

    // 8. Event Listeners
    this.setupEvents();

    // 9. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildEnvelope() {
    const envelopeGroup = new THREE.Group();

    // Main envelope body (Chamfered look using box)
    const bodyGeo = new THREE.BoxGeometry(2.0, 1.25, 0.22);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: this.colors.idle,
      emissiveIntensity: 0.15
    });
    this.envelopeMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    envelopeGroup.add(this.envelopeMesh);

    // Wireframe edges overlay for tech cyber look
    const wireGeo = new THREE.EdgesGeometry(bodyGeo);
    this.wireMat = new THREE.LineBasicMaterial({
      color: this.colors.idle,
      transparent: true,
      opacity: 0.85,
      linewidth: 1.5
    });
    const wireLines = new THREE.LineSegments(wireGeo, this.wireMat);
    envelopeGroup.add(wireLines);

    // Flap lines / Triangles
    const flapGeo = new THREE.ConeGeometry(0.9, 0.5, 3);
    flapGeo.rotateX(Math.PI / 2);
    flapGeo.rotateZ(Math.PI);
    this.flapMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.3,
      emissive: this.colors.idle,
      emissiveIntensity: 0.2
    });
    this.flapMesh = new THREE.Mesh(flapGeo, this.flapMat);
    this.flapMesh.position.set(0, 0.05, 0.12);
    envelopeGroup.add(this.flapMesh);

    // Holographic shield crest in center
    const crestGeo = new THREE.OctahedronGeometry(0.24, 0);
    this.crestMat = new THREE.MeshStandardMaterial({
      color: this.colors.idle,
      emissive: this.colors.idle,
      emissiveIntensity: 0.8,
      wireframe: true
    });
    this.crestMesh = new THREE.Mesh(crestGeo, this.crestMat);
    this.crestMesh.position.set(0, 0, 0.16);
    envelopeGroup.add(this.crestMesh);

    this.mainGroup.add(envelopeGroup);
  }

  buildOrbitRings() {
    // Inner Ring
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 16, 64);
    this.ringMat1 = new THREE.MeshBasicMaterial({
      color: this.colors.idle,
      transparent: true,
      opacity: 0.6
    });
    this.orbitRing1 = new THREE.Mesh(ringGeo1, this.ringMat1);
    this.orbitRing1.rotation.x = Math.PI / 3;
    this.mainGroup.add(this.orbitRing1);

    // Outer Elliptical Ring
    const ringGeo2 = new THREE.TorusGeometry(1.85, 0.012, 16, 64);
    this.ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.4
    });
    this.orbitRing2 = new THREE.Mesh(ringGeo2, this.ringMat2);
    this.orbitRing2.rotation.x = -Math.PI / 4;
    this.orbitRing2.rotation.y = Math.PI / 6;
    this.mainGroup.add(this.orbitRing2);
  }

  buildParticles() {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = (Math.random() - 0.5) * 5;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: this.colors.idle,
      size: 0.04,
      transparent: true,
      opacity: 0.5
    });

    this.particles = new THREE.Points(geometry, this.particleMat);
    this.scene.add(this.particles);
  }

  setupEvents() {
    const onResize = () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width === 0 || height === 0) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    // Drag / Touch rotation
    const dom = this.renderer.domElement;

    const onPointerDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) {
        // Subtle parallax when hovering
        const rect = dom.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        this.targetRotationY = x * 0.8;
        this.targetRotationX = y * 0.6;
        return;
      }

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetRotationY += deltaX * 0.01;
      this.targetRotationX += deltaY * 0.01;

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  updateState(state) {
    this.state = state;
    let targetColor = this.colors.idle;

    if (state === 'Spam') {
      targetColor = this.colors.spam;
    } else if (state === 'Safe') {
      targetColor = this.colors.safe;
    } else if (state === 'Scanning') {
      targetColor = this.colors.scanning;
    }

    // Update 3D materials
    if (this.bodyMat) {
      this.bodyMat.emissive.setHex(targetColor);
      this.bodyMat.emissiveIntensity = state === 'Spam' ? 0.35 : 0.2;
    }
    if (this.wireMat) this.wireMat.color.setHex(targetColor);
    if (this.crestMat) {
      this.crestMat.color.setHex(targetColor);
      this.crestMat.emissive.setHex(targetColor);
    }
    if (this.ringMat1) this.ringMat1.color.setHex(targetColor);
    if (this.pointLight) this.pointLight.color.setHex(targetColor);
    if (this.particleMat) this.particleMat.color.setHex(targetColor);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // Smooth inertia interpolation
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.08;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;

    // Idle floating bobbing
    const floatOffset = Math.sin(time * 1.8) * 0.1;
    this.mainGroup.position.y = floatOffset;

    // Apply rotation
    this.mainGroup.rotation.x = this.currentRotationX;
    this.mainGroup.rotation.y = this.currentRotationY + Math.sin(time * 0.8) * 0.15;

    // Orbit rings spin
    if (this.orbitRing1) {
      this.orbitRing1.rotation.z += 0.008;
    }
    if (this.orbitRing2) {
      this.orbitRing2.rotation.y -= 0.006;
      this.orbitRing2.rotation.z += 0.004;
    }

    // Shield crest pulse & rotate
    if (this.crestMesh) {
      this.crestMesh.rotation.y += 0.02;
      this.crestMesh.rotation.x += 0.01;
      const pulseScale = 1 + Math.sin(time * 3) * 0.12;
      this.crestMesh.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // Background particle drift
    if (this.particles) {
      this.particles.rotation.y = time * 0.03;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.MailScene3D = MailScene3D;
