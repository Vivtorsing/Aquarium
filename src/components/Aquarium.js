import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

//import all the fishes
import Fish from '../models/Fish.glb';
import BlueFish from '../models/BlueFish.glb';
import SalmonFish from '../models/SalmonFish.glb';
import Dolphin from '../models/Dolphin.glb';
import MantaRay from '../models/Manta ray.glb';
import Shark from '../models/Shark.glb';
import Whale from '../models/Whale.glb';

function SteeringFish({ modelPath, position = [0,0,0], scale = 0.5, speed = 0.02, fishesRef }) {
  const group = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);

  //fish state
  const velocity = useMemo(() => new THREE.Vector3(
    (Math.random()-0.5) * 0.1,
    (Math.random()-0.5) * 0.1,
    (Math.random()-0.5) * 0.1
  ), []);

  const home = useMemo(() => new THREE.Vector3(...position), [position]);
  const maxDistance = 10; //how far the fish can go from home

  useEffect(() => {
    if(names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]];
      action.reset().fadeIn(0.5).play();

      return () => {
        action.fadeOut(0.5).stop();
      };
    }
  }, [actions, names]);
  

  useEffect(() => {
    if(group.current) fishesRef.current.push(group.current);
    return () => {
      fishesRef.current = fishesRef.current.filter(f => f !== group.current);
    };
  }, [fishesRef]);

  useFrame(() => {
    if(!group.current) return;
    const pos = group.current.position;

    //wander around the ocean
    velocity.x += (Math.random() - 0.5) * 0.002;
    velocity.y += (Math.random() - 0.5) * 0.002;
    velocity.z += (Math.random() - 0.5) * 0.002;

    //stay close to home aka spawn position
    const toHome = new THREE.Vector3().subVectors(home, pos);
    if(toHome.length() > maxDistance) {
      toHome.normalize().multiplyScalar(0.005);
      velocity.add(toHome);
    }

    //avoid other fish nearby
    if(fishesRef.current) {
      fishesRef.current.forEach(other => {
        if(other !== group.current) {
          const diff = new THREE.Vector3().subVectors(pos, other.position);
          const dist = diff.length();
          if(dist < 1.0) { //too close to different fish
            diff.normalize().multiplyScalar(0.01 / dist);
            velocity.add(diff);
          }
        }
      });
    }

    //limit the fish speed
    velocity.clampLength(0, speed);

    //move fish
    pos.add(velocity);

    //face direction of movement
    if(velocity.lengthSq() > 0.0001) {
      const dir = velocity.clone().normalize();
      const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        dir
      );
      group.current.quaternion.slerp(targetQuaternion, 0.1);
    }
  });

  return <primitive ref={group} object={scene} scale={scale} position={position} />;
}


export default function Aquarium() {
  const fishesRef = useRef([]);

  useEffect(() => {
    fishesRef.current = [];
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-200 to-blue-500">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        {/*lighting*/}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {/*aquarium floor*/}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#87ceeb" />
        </mesh>

        {/*fish*/}
        <SteeringFish modelPath={Fish} position={[0,0,0]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={SalmonFish} position={[1,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={BlueFish} position={[2,2,2]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={Dolphin} position={[5,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={MantaRay} position={[1,1,5]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={Shark} position={[1,1,-10]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
        <SteeringFish modelPath={Whale} position={[10,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} />
       
        {/*allow user to look around*/}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
