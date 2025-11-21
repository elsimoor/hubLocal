import { useGLTF } from "@react-three/drei";

export default function cardGLB() {
  const gltf = useGLTF("/models/card.glb");
  return <primitive object={gltf.scene} />;
}