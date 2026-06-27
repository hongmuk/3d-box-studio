import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Text, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';

export type FaceName = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';

export interface TextElement {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
  positionX: number;
  positionY: number;
}

export interface ImageElement {
  id: string;
  url: string;
  scale: number;
  rotation: number;
  positionX: number;
  positionY: number;
}

export interface FaceCustomization {
  side: 'outside' | 'inside';
  texts: TextElement[];
  images: ImageElement[];
}

interface Box3DProps {
  width: number;
  height: number;
  depth: number;
  unfold: number;
  selectedFace: FaceName | null;
  onSelectFace: (face: FaceName) => void;
  customizations: Record<string, FaceCustomization>;
}

const FONT_URLS: Record<string, string> = {
  'Inter': 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
  'Playfair Display': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2',
  'Roboto Mono': 'https://fonts.gstatic.com/s/robotomono/v22/L0xuDF4xlVMF-BfR8bXMIhJHg45bgbGrQ8pG_Z0.woff2',
  'Dancing Script': 'https://fonts.gstatic.com/s/dancingscript/v24/If2cXTr6YS-zF4S-kcSWSVi_slH2r_kR.woff2'
};

export default function Box3D({ width, height, depth, unfold, selectedFace, onSelectFace, customizations }: Box3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const scale = 0.01;
  const w = width * scale;
  const h = height * scale;
  const d = depth * scale;

  useFrame((state) => {
    if (groupRef.current && unfold === 0 && !selectedFace) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    } else if (groupRef.current && (unfold > 0 || selectedFace)) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({ 
      color: '#e2b385', // Slightly brighter, premium kraft paper color
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }, []);

  const edgeColor = "#8b5a2b";
  const highlightColor = "#a855f7";

  const renderFaceContent = (faceName: FaceName) => {
    const custom = customizations[faceName];
    if (!custom) return null;
    
    const isInside = custom.side === 'inside';
    const zOffset = isInside ? -0.005 : 0.005;
    const ry = isInside ? Math.PI : 0; 

    const getLocalCoords = (px: number, py: number) => {
      let localX = px * scale;
      let localY = py * scale;
      if (faceName === 'front') {
        localY = -localY;
      } else if (faceName === 'back' || faceName === 'top' || faceName === 'bottom') {
        // localY is naturally py
      } else if (faceName === 'left') {
        localX = -localY;
        localY = px * scale;
      } else if (faceName === 'right') {
        localX = localY;
        localY = -px * scale;
      }
      return [localX, localY];
    };

    return (
      <group>
        {custom.images?.map((img, idx) => {
          const [imgLocalX, imgLocalY] = getLocalCoords(img.positionX || 0, img.positionY || 0);
          const imgRz = THREE.MathUtils.degToRad(-(img.rotation || 0));
          return (
            <group key={img.id} position={[imgLocalX, imgLocalY, zOffset]} rotation={[0, ry, imgRz]}>
              <Suspense fallback={null}>
                <DreiImage 
                  url={img.url} 
                  transparent 
                  scale={(img.scale || 100) * scale} 
                  position={[0, 0, idx * 0.0001]} // Slight z-offset to prevent z-fighting
                />
              </Suspense>
            </group>
          );
        })}
        {custom.texts?.map((txt, idx) => {
          const [txtLocalX, txtLocalY] = getLocalCoords(txt.positionX || 0, txt.positionY || 0);
          const txtRz = THREE.MathUtils.degToRad(-(txt.rotation || 0));
          return (
            <group key={txt.id} position={[txtLocalX, txtLocalY, zOffset]} rotation={[0, ry, txtRz]}>
              <Text
                font={FONT_URLS[txt.fontFamily] || FONT_URLS['Inter']}
                position={[0, 0, 0.001 + (custom.images?.length || 0) * 0.0001 + idx * 0.0001]}
                fontSize={(txt.fontSize || 32) * scale}
                color={txt.color || '#000000'}
                anchorX="center"
                anchorY="middle"
              >
                {txt.text}
              </Text>
            </group>
          );
        })}
      </group>
    );
  };

  const handleClick = (e: any, faceName: FaceName) => {
    e.stopPropagation();
    onSelectFace(faceName);
  };

  const getEdgeColor = (faceName: FaceName) => selectedFace === faceName ? highlightColor : edgeColor;
  const getLineWidth = (faceName: FaceName) => selectedFace === faceName ? 4 : 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Bottom Panel */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        material={material} 
        castShadow 
        receiveShadow
        onClick={(e) => handleClick(e, 'bottom')}
      >
        <planeGeometry args={[w, d]} />
        <Edges linewidth={getLineWidth('bottom')} color={getEdgeColor('bottom')} />
        <group rotation={[Math.PI, 0, 0]}> {/* Flipped to face outside */}
          {renderFaceContent('bottom')}
        </group>
      </mesh>

      {/* Back Panel */}
      <group position={[0, 0, -d / 2]} rotation={[Math.PI / 2 * (1 - unfold), 0, 0]}>
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, -h / 2]} 
          material={material} 
          castShadow 
          receiveShadow
          onClick={(e) => handleClick(e, 'back')}
        >
          <planeGeometry args={[w, h]} />
          <Edges linewidth={getLineWidth('back')} color={getEdgeColor('back')} />
          {/* Back panel needs to flip to be readable from the back side */}
          <group rotation={[Math.PI, 0, Math.PI]}>
            {renderFaceContent('back')}
          </group>
        </mesh>
        
        {/* Top Panel (attached to top edge of back panel) */}
        <group position={[0, 0, -h]} rotation={[Math.PI / 2 * (1 - unfold), 0, 0]}>
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, -d / 2]} 
            material={material} 
            castShadow 
            receiveShadow
            onClick={(e) => handleClick(e, 'top')}
          >
            <planeGeometry args={[w, d]} />
            <Edges linewidth={getLineWidth('top')} color={getEdgeColor('top')} />
            {/* Top panel faces up, orient it correctly relative to front */}
            <group rotation={[Math.PI, 0, 0]}>
              {renderFaceContent('top')}
            </group>
          </mesh>
        </group>
      </group>

      {/* Front Panel */}
      <group position={[0, 0, d / 2]} rotation={[-Math.PI / 2 * (1 - unfold), 0, 0]}>
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, 0, h / 2]} 
          material={material} 
          castShadow 
          receiveShadow
          onClick={(e) => handleClick(e, 'front')}
        >
          <planeGeometry args={[w, h]} />
          <Edges linewidth={getLineWidth('front')} color={getEdgeColor('front')} />
          <group rotation={[Math.PI, 0, 0]}>
            {renderFaceContent('front')}
          </group>
        </mesh>
      </group>

      {/* Left Panel */}
      <group position={[-w / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2 * (1 - unfold)]}>
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-h / 2, 0, 0]} 
          material={material} 
          castShadow 
          receiveShadow
          onClick={(e) => handleClick(e, 'left')}
        >
          <planeGeometry args={[h, d]} />
          <Edges linewidth={getLineWidth('left')} color={getEdgeColor('left')} />
          <group rotation={[Math.PI, 0, -Math.PI / 2]}>
            {renderFaceContent('left')}
          </group>
        </mesh>
      </group>

      {/* Right Panel */}
      <group position={[w / 2, 0, 0]} rotation={[0, 0, Math.PI / 2 * (1 - unfold)]}>
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[h / 2, 0, 0]} 
          material={material} 
          castShadow 
          receiveShadow
          onClick={(e) => handleClick(e, 'right')}
        >
          <planeGeometry args={[h, d]} />
          <Edges linewidth={getLineWidth('right')} color={getEdgeColor('right')} />
          <group rotation={[Math.PI, 0, Math.PI / 2]}>
            {renderFaceContent('right')}
          </group>
        </mesh>
      </group>
    </group>
  );
}
