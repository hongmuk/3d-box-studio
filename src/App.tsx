import { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Search, Box, Package, Type, Palette, AlignLeft, RotateCcw, Image as ImageIcon, Trash2, Maximize, Layers, Plus, ChevronLeft, Edit2 } from 'lucide-react';
import Box3D from './Box3D';
import type { FaceName, FaceCustomization, TextElement, ImageElement } from './Box3D';
import './App.css';

const BOX_DATABASE = [
  { id: '1', name: 'Standard Delivery Box A1', w: 250, d: 200, h: 150, type: 'Normal' },
  { id: '2', name: 'Pizza Box Medium', w: 300, d: 300, h: 45, type: 'Flat' },
  { id: '3', name: 'Long Poster Tube', w: 100, d: 100, h: 800, type: 'Long' },
  { id: '4', name: 'Cube Box Small', w: 150, d: 150, h: 150, type: 'Normal' },
  { id: '5', name: 'Tape-less Box B2', w: 350, d: 250, h: 100, type: 'Tape-less' },
];

const DEFAULT_CUSTOMIZATION: FaceCustomization = {
  side: 'outside',
  texts: [],
  images: [],
};

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [width, setWidth] = useState<number>(250);
  const [depth, setDepth] = useState<number>(200);
  const [height, setHeight] = useState<number>(150);
  const [searchQuery, setSearchQuery] = useState('');
  const [unfold, setUnfold] = useState<number>(0);

  // Customization State
  const [selectedFace, setSelectedFace] = useState<FaceName | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, FaceCustomization>>({});
  
  // Element Editing State
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementType, setEditingElementType] = useState<'text' | 'image' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBoxes = useMemo(() => {
    return BOX_DATABASE.filter(box => {
      return box.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  const handleSelectBox = (box: typeof BOX_DATABASE[0]) => {
    setWidth(box.w);
    setDepth(box.d);
    setHeight(box.h);
  };

  const currentFace = selectedFace ? (customizations[selectedFace] || { ...DEFAULT_CUSTOMIZATION }) : null;

  const updateFace = (updates: Partial<FaceCustomization>) => {
    if (!selectedFace) return;
    setCustomizations(prev => ({
      ...prev,
      [selectedFace]: {
        ...(prev[selectedFace] || DEFAULT_CUSTOMIZATION),
        ...updates
      }
    }));
  };

  const handleAddText = () => {
    const newText: TextElement = {
      id: generateId(),
      text: 'New Text',
      fontSize: 32,
      color: '#000000',
      fontFamily: 'Inter',
      rotation: 0,
      positionX: 0,
      positionY: 0,
    };
    const currentTexts = currentFace?.texts || [];
    updateFace({ texts: [...currentTexts, newText] });
    setEditingElementId(newText.id);
    setEditingElementType('text');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFace || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        const newImage: ImageElement = {
          id: generateId(),
          url: event.target.result,
          scale: 100,
          rotation: 0,
          positionX: 0,
          positionY: 0,
        };
        const currentImages = currentFace?.images || [];
        updateFace({ images: [...currentImages, newImage] });
        setEditingElementId(newImage.id);
        setEditingElementType('image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const updateElement = (id: string, type: 'text' | 'image', updates: any) => {
    if (!selectedFace || !currentFace) return;
    if (type === 'text') {
      const newTexts = currentFace.texts.map(t => t.id === id ? { ...t, ...updates } : t);
      updateFace({ texts: newTexts });
    } else {
      const newImages = currentFace.images.map(i => i.id === id ? { ...i, ...updates } : i);
      updateFace({ images: newImages });
    }
  };

  const deleteElement = (id: string, type: 'text' | 'image') => {
    if (!selectedFace || !currentFace) return;
    if (type === 'text') {
      updateFace({ texts: currentFace.texts.filter(t => t.id !== id) });
    } else {
      updateFace({ images: currentFace.images.filter(i => i.id !== id) });
    }
    if (editingElementId === id) {
      setEditingElementId(null);
      setEditingElementType(null);
    }
  };

  const handlePointerMissed = () => {
    setSelectedFace(null);
    setEditingElementId(null);
    setEditingElementType(null);
  };
  
  const handleFaceSelect = (face: FaceName) => {
    setSelectedFace(face);
    setEditingElementId(null);
    setEditingElementType(null);
  }

  // Find the currently edited element
  const editingText = editingElementType === 'text' ? currentFace?.texts.find(t => t.id === editingElementId) : null;
  const editingImage = editingElementType === 'image' ? currentFace?.images.find(i => i.id === editingElementId) : null;

  return (
    <div className="app-container">
      {/* Sidebar for Controls */}
      <div className="sidebar" style={{ width: '420px', minWidth: '420px', overflowY: 'auto' }}>
        <div className="brand">
          <div className="brand-icon" style={{ padding: '8px', background: 'transparent', boxShadow: 'none' }}>
            <img src="/logo.png" alt="3D Box Studio Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          </div>
          <div className="brand-title">3D Box Studio</div>
        </div>

        {selectedFace ? (
          <div className="animate-fade-in" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '24px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="section-title" style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingElementId && (
                  <button 
                    onClick={() => { setEditingElementId(null); setEditingElementType(null); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                )}
                {!editingElementId && `${selectedFace.toUpperCase()} PANEL`}
              </div>
              <button 
                onClick={() => setSelectedFace(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', transition: 'all 0.2s' }}
              >
                Done
              </button>
            </div>

            {/* List View */}
            {!editingElementId && (
              <>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Placement (Inside/Outside)</label>
                  <div className="form-input-wrapper">
                    <Layers size={18} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none' }} />
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '40px', appearance: 'none', background: 'var(--bg-input)' }}
                      value={currentFace?.side || 'outside'}
                      onChange={(e) => updateFace({ side: e.target.value as 'outside'|'inside' })}
                    >
                      <option value="outside">Outer Face (Outside)</option>
                      <option value="inside">Inner Face (Inside)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <button 
                    onClick={handleAddText}
                    className="primary-btn"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    <Plus size={16} /> Add Text
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="primary-btn"
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    <Plus size={16} /> Add Image
                  </button>
                </div>

                <div className="elements-list">
                  {currentFace?.images.map(img => (
                    <div key={img.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                        <img src={img.url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem' }}>Image Element</div>
                      <button onClick={() => { setEditingElementId(img.id); setEditingElementType('image'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16}/></button>
                      <button onClick={() => deleteElement(img.id, 'image')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {currentFace?.texts.map(txt => (
                    <div key={txt.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: txt.color }}>
                        <Type size={16} />
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt.text || 'Empty Text'}</div>
                      <button onClick={() => { setEditingElementId(txt.id); setEditingElementType('text'); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16}/></button>
                      <button onClick={() => deleteElement(txt.id, 'text')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {(!currentFace?.texts.length && !currentFace?.images.length) && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No elements added yet. Click above to add.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Editing TEXT */}
            {editingElementId && editingElementType === 'text' && editingText && (
              <div className="animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Text Content</label>
                  <div className="form-input-wrapper">
                    <Type size={18} className="form-input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      value={editingText.text}
                      onChange={(e) => updateElement(editingText.id, 'text', { text: e.target.value })}
                    />
                  </div>
                </div>

                <div className="dimensions-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Font Family</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <AlignLeft size={18} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none' }} />
                      <select 
                        className="form-input" 
                        style={{ paddingLeft: '40px', appearance: 'none' }}
                        value={editingText.fontFamily}
                        onChange={(e) => updateElement(editingText.id, 'text', { fontFamily: e.target.value })}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Playfair Display">Playfair</option>
                        <option value="Roboto Mono">Roboto</option>
                        <option value="Dancing Script">Dancing</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Color</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <Palette size={18} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none' }} />
                      <input
                        type="color"
                        className="form-input"
                        style={{ padding: '0 0 0 40px', height: '44px', cursor: 'pointer' }}
                        value={editingText.color}
                        onChange={(e) => updateElement(editingText.id, 'text', { color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="dimensions-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Size</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <Type size={18} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none' }} />
                      <input
                        type="number"
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        value={editingText.fontSize}
                        onChange={(e) => updateElement(editingText.id, 'text', { fontSize: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Rotation (°)</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <RotateCcw size={18} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none' }} />
                      <input
                        type="number"
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                        value={editingText.rotation}
                        onChange={(e) => updateElement(editingText.id, 'text', { rotation: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Pos X</span>
                    <span style={{ color: 'var(--accent)' }}>{editingText.positionX} mm</span>
                  </label>
                  <input
                    type="range" min="-200" max="200"
                    value={editingText.positionX}
                    onChange={(e) => updateElement(editingText.id, 'text', { positionX: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Pos Y</span>
                    <span style={{ color: 'var(--accent)' }}>{editingText.positionY} mm</span>
                  </label>
                  <input
                    type="range" min="-200" max="200"
                    value={editingText.positionY}
                    onChange={(e) => updateElement(editingText.id, 'text', { positionY: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}

            {/* Editing IMAGE */}
            {editingElementId && editingElementType === 'image' && editingImage && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                    <img src={editingImage.url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Image Element</div>
                  </div>
                </div>
                
                <div className="dimensions-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Scale (%)</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <Maximize size={16} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none', left: '8px' }} />
                      <input
                        type="number"
                        className="form-input"
                        style={{ paddingLeft: '32px' }}
                        value={editingImage.scale}
                        onChange={(e) => updateElement(editingImage.id, 'image', { scale: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Rotation (°)</label>
                    <div className="form-input-wrapper" style={{ paddingLeft: '0' }}>
                      <RotateCcw size={16} className="form-input-icon" style={{ zIndex: 1, pointerEvents: 'none', left: '8px' }} />
                      <input
                        type="number"
                        className="form-input"
                        style={{ paddingLeft: '32px' }}
                        value={editingImage.rotation}
                        onChange={(e) => updateElement(editingImage.id, 'image', { rotation: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Pos X</span>
                    <span style={{ color: 'var(--accent)' }}>{editingImage.positionX} mm</span>
                  </label>
                  <input
                    type="range" min="-200" max="200"
                    value={editingImage.positionX}
                    onChange={(e) => updateElement(editingImage.id, 'image', { positionX: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Pos Y</span>
                    <span style={{ color: 'var(--accent)' }}>{editingImage.positionY} mm</span>
                  </label>
                  <input
                    type="range" min="-200" max="200"
                    value={editingImage.positionY}
                    onChange={(e) => updateElement(editingImage.id, 'image', { positionY: Number(e.target.value) })}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)' }}>
            💡 Click on any side of the 3D box to add text/logos
          </div>
        )}

        {/* Other Sections fade slightly if editing a face */}
        <div style={{ opacity: selectedFace ? 0.4 : 1, transition: 'opacity 0.3s', pointerEvents: selectedFace ? 'none' : 'auto' }}>
          <div className="section-title">Search Product</div>
          <div className="form-group">
            <div className="form-input-wrapper">
              <Search size={18} className="form-input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search by name (e.g. Pizza)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="section-title">Custom Dimensions (mm)</div>
          <div className="dimensions-grid">
            <div>
              <label className="dim-label">Width (W)</label>
              <input
                type="number"
                className="dim-input"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="dim-label">Length (D)</label>
              <input
                type="number"
                className="dim-input"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="dim-label">Height (H)</label>
              <input
                type="number"
                className="dim-input"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '24px' }}>Animation</div>
          <div className="form-group">
            <label className="form-label">Fold / Unfold ({Math.round(unfold * 100)}%)</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={unfold}
              onChange={(e) => setUnfold(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
          </div>

          <div className="section-title" style={{ marginTop: '32px' }}>
            Matched Products ({filteredBoxes.length})
          </div>
          <div className="results-container">
            {filteredBoxes.map((box) => (
              <div 
                key={box.id} 
                className="result-card animate-fade-in"
                onClick={() => handleSelectBox(box)}
              >
                <div className="result-title">
                  <Box size={14} style={{ display: 'inline', marginRight: '6px', color: '#a855f7' }} />
                  {box.name}
                </div>
                <div className="result-desc">
                  {box.w} x {box.d} x {box.h} mm • {box.type}
                </div>
              </div>
            ))}
            {filteredBoxes.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', marginTop: '20px' }}>
                No boxes found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 3D Viewer */}
      <div className="viewer-container">
        <div className="overlay-info">
          <div className="info-row">
            <span className="info-label">Current Size</span>
            <span className="info-val">{width} × {depth} × {height} mm</span>
          </div>
          {selectedFace && (
            <div className="info-row" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span className="info-label" style={{ color: 'var(--accent)' }}>Editing</span>
              <span className="info-val">{selectedFace.toUpperCase()}</span>
            </div>
          )}
        </div>
        
        <Canvas shadows camera={{ position: [6, 6, 8], fov: 45 }} onPointerMissed={handlePointerMissed}>
          <color attach="background" args={['transparent']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            castShadow
            position={[10, 15, 10]}
            intensity={1.8}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          <Environment preset="studio" />
          
          <Box3D 
            width={width} 
            depth={depth} 
            height={height} 
            unfold={unfold}
            selectedFace={selectedFace}
            onSelectFace={handleFaceSelect}
            customizations={customizations}
          />
          
          <ContactShadows
            position={[0, -0.05, 0]}
            opacity={0.6}
            scale={15}
            blur={2}
            far={4}
          />
          
          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 + 0.1}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default App;
