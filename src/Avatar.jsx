import React, { useEffect, useRef, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';

export default function Avatar({ audioUrl, modelPath, isGreeting }) {
  const [vrm, setVrm] = useState(null);
  const audioRef = useRef(new Audio());
  const [speaking, setSpeaking] = useState(false);

  const gltf = useLoader(GLTFLoader, modelPath, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  useEffect(() => {
    const scene = gltf.scene;
    VRMUtils.removeUnnecessaryVertices(scene);
    VRMUtils.removeUnnecessaryJoints(scene);
    scene.rotation.y = 0; 

    if (gltf.userData.vrm) {
      const vrmInstance = gltf.userData.vrm;
      setVrm(vrmInstance);
    }
  }, [gltf]);

  useEffect(() => {
    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play()
        .then(() => setSpeaking(true))
        .catch(e => console.error("Audio error:", e));
      audioRef.current.onended = () => setSpeaking(false);
    }
  }, [audioUrl]);

  useFrame((state, delta) => {
    if (vrm) {
      // --- BLINK & TALK ---
      const blinkValue = Math.sin(state.clock.elapsedTime * 0.5) > 0.9 ? 1 : 0;
      vrm.expressionManager.setValue('blink', blinkValue);

      if (speaking) {
        const talkRhythm = Math.sin(state.clock.elapsedTime * 20);
        vrm.expressionManager.setValue('aa', talkRhythm > 0 ? 0.6 : 0);
      } else {
        vrm.expressionManager.setValue('aa', 0);
      }

      // --- FINAL CORRECTED NAMASTE PHYSICS ---
      const speed = 5 * delta; 

      const lUpper = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
      const lLower = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
      const lHand  = vrm.humanoid.getNormalizedBoneNode('leftHand');
      
      const rUpper = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
      const rLower = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
      const rHand  = vrm.humanoid.getNormalizedBoneNode('rightHand');

      if (lUpper && rUpper && lLower && rLower && lHand && rHand) {
        if (isGreeting) {
          // =======================
          //    NAMASTE POSE (FINAL)
          // =======================
          
          // --- UPPER ARMS (Tucked & Neutral) ---
          // Z: -1.3 (Arms down, 75 degrees)
          // Y: 0.0 (NO FORWARD SWING - Fixes "Hands at front")
          // X: 0.3 (Slight internal roll to bring hands to center)
          lUpper.rotation.z = THREE.MathUtils.lerp(lUpper.rotation.z, -1.3, speed);
          lUpper.rotation.y = THREE.MathUtils.lerp(lUpper.rotation.y, 0.0, speed);
          lUpper.rotation.x = THREE.MathUtils.lerp(lUpper.rotation.x, 0.3, speed);
          
          rUpper.rotation.z = THREE.MathUtils.lerp(rUpper.rotation.z, 1.3, speed);
          rUpper.rotation.y = THREE.MathUtils.lerp(rUpper.rotation.y, 0.0, speed);
          rUpper.rotation.x = THREE.MathUtils.lerp(rUpper.rotation.x, 0.3, speed);

          // --- LOWER ARMS (Deep Bend + Mid Twist) ---
          // Z: -2.6 (Max Bend - brings hands to Heart/Chin height)
          // Y: 0.5 (Slight Positive Twist - Palms face Center)
          lLower.rotation.z = THREE.MathUtils.lerp(lLower.rotation.z, -2.6, speed);
          lLower.rotation.y = THREE.MathUtils.lerp(lLower.rotation.y, 0.5, speed);
          
          rLower.rotation.z = THREE.MathUtils.lerp(rLower.rotation.z, 2.6, speed);
          rLower.rotation.y = THREE.MathUtils.lerp(rLower.rotation.y, -0.5, speed);

          // --- HANDS (Prayer alignment) ---
          // X: -1.0 (Bend wrist back to point fingers UP)
          // Z: -0.2 (Align thumbs)
          lHand.rotation.x = THREE.MathUtils.lerp(lHand.rotation.x, -1.0, speed);
          lHand.rotation.z = THREE.MathUtils.lerp(lHand.rotation.z, -0.2, speed);
          
          rHand.rotation.x = THREE.MathUtils.lerp(rHand.rotation.x, -1.0, speed);
          rHand.rotation.z = THREE.MathUtils.lerp(rHand.rotation.z, 0.2, speed);

        } else {
          // =======================
          //    IDLE / SOLDIER POSE
          // =======================
          
          // Reset Upper
          lUpper.rotation.z = THREE.MathUtils.lerp(lUpper.rotation.z, -1.4, speed);
          lUpper.rotation.y = THREE.MathUtils.lerp(lUpper.rotation.y, 0.0, speed);
          lUpper.rotation.x = THREE.MathUtils.lerp(lUpper.rotation.x, 0.0, speed);
          
          rUpper.rotation.z = THREE.MathUtils.lerp(rUpper.rotation.z, 1.4, speed);
          rUpper.rotation.y = THREE.MathUtils.lerp(rUpper.rotation.y, 0.0, speed);
          rUpper.rotation.x = THREE.MathUtils.lerp(rUpper.rotation.x, 0.0, speed);

          // Reset Lower
          lLower.rotation.z = THREE.MathUtils.lerp(lLower.rotation.z, 0.0, speed);
          lLower.rotation.y = THREE.MathUtils.lerp(lLower.rotation.y, 0.0, speed);
          
          rLower.rotation.z = THREE.MathUtils.lerp(rLower.rotation.z, 0.0, speed);
          rLower.rotation.y = THREE.MathUtils.lerp(rLower.rotation.y, 0.0, speed);

          // Reset Hands
          lHand.rotation.x = THREE.MathUtils.lerp(lHand.rotation.x, 0.0, speed);
          lHand.rotation.z = THREE.MathUtils.lerp(lHand.rotation.z, 0.0, speed);
          rHand.rotation.x = THREE.MathUtils.lerp(rHand.rotation.x, 0.0, speed);
          rHand.rotation.z = THREE.MathUtils.lerp(rHand.rotation.z, 0.0, speed);
        }
      }

      vrm.update(delta);
    }
  });

  return vrm ? <primitive object={vrm.scene} /> : null;
}