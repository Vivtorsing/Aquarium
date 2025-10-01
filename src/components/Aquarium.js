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

//import all the corals
import Coral from '../models/Coral.glb';
import EnviroCoral from '../models/EnviroCoral.glb';
import OrangeCoral from '../models/OrangeCoral.glb';
import SeaweedThree from '../models/SeaweedThree.glb';
import Seaweed from '../models/Seaweed.glb';
import Anemone from '../models/Anemone.glb';
import WhiteAnemone from '../models/WhiteAnemone.glb';

function SteeringFish({ modelPath, position = [0,0,0], scale = 0.5, speed = 0.02, fishesRef, obstaclesRef }) {
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

    //avoid the seaflooor
    if(obstaclesRef.current) {
      obstaclesRef.current.forEach(obstacle => {
        const diff = new THREE.Vector3().subVectors(pos, obstacle.position);
        const dist = diff.length();
        if(dist < 2.0) { //the distance to the sea floor items
          diff.normalize().multiplyScalar(0.02 / dist);
          velocity.add(diff);
        }
      });
    }
  });

  return <primitive ref={group} object={scene} scale={scale} position={position} />;
}

//place coral on sea floor
function Obstacle({ modelPath, position, scale, obstaclesRef }) {
  const group = useRef();
  const { scene } = useGLTF(modelPath);

  //clone the item to easily reuse it again
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if(group.current) obstaclesRef.current.push(group.current);
    return () => {
      obstaclesRef.current = obstaclesRef.current.filter(o => o !== group.current);
    };
  }, [obstaclesRef]);

  return <primitive ref={group} object={clonedScene} position={position} scale={scale} />;
}


export default function Aquarium({ showCorals }) {
  const fishesRef = useRef([]);
  const obstaclesRef = useRef([]);

  useEffect(() => {
    fishesRef.current = [];
    obstaclesRef.current = [];
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-200 to-blue-500">
      <Canvas camera={{ position: [0, 2, 50], fov: 60}}>
        {/*lighting*/}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        {/*aquarium floor*/}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#87ceeb" />
        </mesh>

        {/*Add coral with some randomness as I am too lazy to do this*/}
        {showCorals && (
            [
            { model: Coral, scale: [0.1, 0.15] },
            { model: EnviroCoral, scale: [5, 10] },
            { model: OrangeCoral, scale: [5, 10] },
            { model: SeaweedThree, scale: [5, 10] },
            { model: Seaweed, scale: [5, 10] },
            { model: Anemone, scale: [.5, 1] },
            { model: WhiteAnemone, scale: [0.05, 0.1] },
          ].flatMap((item, index) =>
            Array.from({ length: 6 }).map((_, i) => {
              //random x and z
              const x = (Math.random() - 0.5) * 90; //stay inside 100 x 100 area
              const z = (Math.random() - 0.5) * 90;
              const scale = Math.random() * (item.scale[1] - item.scale[0]) + item.scale[0];

              return (
                <Obstacle
                  key={`${index}-${i}`}
                  modelPath={item.model}
                  position={[x, -10, z]}
                  scale={scale}
                  obstaclesRef={obstaclesRef}
                />
              );
            })
          )
        )}

        {/*fish*/}
        <SteeringFish modelPath={Fish} position={[0,0,0]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={SalmonFish} position={[1,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={BlueFish} position={[2,2,2]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={Dolphin} position={[5,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={MantaRay} position={[1,1,5]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={Shark} position={[1,1,-10]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
        <SteeringFish modelPath={Whale} position={[10,1,1]} scale={0.5} speed={0.03} fishesRef={fishesRef} obstaclesRef={obstaclesRef} />
       
        {/*allow user to look around*/}
        <OrbitControls />
      </Canvas>
    </div>
  );
}