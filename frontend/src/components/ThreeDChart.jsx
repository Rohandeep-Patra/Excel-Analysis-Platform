import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeDChart = ({ data, chartType, xAxis, yAxis, zAxis, width = 600, height = 400 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!data || !data.datasets || data.datasets.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b); // Dark blue background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(10, 10, 10);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Process data based on chart type
    const dataset = data.datasets[0];
    const labels = data.labels || [];
    const values = dataset.data || [];

    if (chartType === '3d-scatter') {
      create3DScatterPlot(scene, values, labels, xAxis, yAxis, zAxis);
    } else if (chartType === '3d-bar') {
      create3DBarChart(scene, values, labels, xAxis, yAxis, zAxis);
    } else if (chartType === '3d-surface') {
      create3DSurfacePlot(scene, values, labels, xAxis, yAxis, zAxis);
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Mount
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data, chartType, xAxis, yAxis, zAxis, width, height]);

  const create3DScatterPlot = (scene, values, labels, xAxis, yAxis, zAxis) => {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8
    });

    values.forEach((value, index) => {
      if (Array.isArray(value) && value.length >= 3) {
        const [x, y, z] = value;
        const sphere = new THREE.Mesh(geometry, material.clone());
        sphere.position.set(x, y, z);
        scene.add(sphere);

        // Add label
        if (labels[index]) {
          addTextLabel(scene, labels[index], x, y, z);
        }
      }
    });
  };

  const create3DBarChart = (scene, values, labels, xAxis, yAxis, zAxis) => {
    const barWidth = 0.8;
    const barDepth = 0.8;
    const spacing = 1.2;

    values.forEach((value, index) => {
      if (typeof value === 'number' && value > 0) {
        const barHeight = Math.max(value * 0.1, 0.1); // Scale height
        const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        const material = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(index / values.length, 0.7, 0.5)
        });

        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(
          (index - values.length / 2) * spacing,
          barHeight / 2,
          0
        );
        bar.castShadow = true;
        bar.receiveShadow = true;
        scene.add(bar);

        // Add label
        if (labels[index]) {
          addTextLabel(scene, labels[index], bar.position.x, 0, bar.position.z - 1);
        }
      }
    });
  };

  const create3DSurfacePlot = (scene, values, labels, xAxis, yAxis, zAxis) => {
    // Create a surface from the data points
    const size = Math.ceil(Math.sqrt(values.length));
    const geometry = new THREE.PlaneGeometry(10, 10, size - 1, size - 1);
    
    // Set vertex positions based on data
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < Math.min(values.length, positions.length / 3); i++) {
      const value = values[i];
      if (typeof value === 'number') {
        const x = (i % size) / size * 10 - 5;
        const z = Math.floor(i / size) / size * 10 - 5;
        const y = value * 0.1; // Scale height
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ 
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
      wireframe: false
    });

    const surface = new THREE.Mesh(geometry, material);
    surface.rotation.x = -Math.PI / 2;
    scene.add(surface);
  };

  const addTextLabel = (scene, text, x, y, z) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y + 1, z);
    sprite.scale.set(2, 0.5, 1);
    scene.add(sprite);
  };

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: width, 
        height: height, 
        border: '1px solid #374151',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

export default ThreeDChart; 