import React, { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider,
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges, 
  MarkerType 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toJpeg } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useNavigate } from 'react-router-dom';
import CustomNode from './CustomNode';

export default function Home() {
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isTreeCreated, setIsTreeCreated] = useState(false);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({ name: '', nominee: '', idNumber: '' });

  const defaultEdgeOptions = useMemo(() => ({
    style: { stroke: '#cbd5e1', strokeWidth: 2 },
    type: 'smoothstep', 
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#cbd5e1',
    },
  }), []);

  const handleCreateTree = () => {
    const defaultData = { name: '', nominee: '', idNumber: '' };
    
    const initialNodes = [
      { id: '1', type: 'custom', position: { x: 1000, y: 50 }, data: { ...defaultData, name: 'Root Node' } },
      { id: '2', type: 'custom', position: { x: 560, y: 250 }, data: { ...defaultData } },
      { id: '3', type: 'custom', position: { x: 1440, y: 250 }, data: { ...defaultData } },
      { id: '4', type: 'custom', position: { x: 340, y: 450 }, data: { ...defaultData } },
      { id: '5', type: 'custom', position: { x: 780, y: 450 }, data: { ...defaultData } },
      { id: '6', type: 'custom', position: { x: 1220, y: 450 }, data: { ...defaultData } },
      { id: '7', type: 'custom', position: { x: 1660, y: 450 }, data: { ...defaultData } },
      { id: '8', type: 'custom', position: { x: 230, y: 650 }, data: { ...defaultData } },
      { id: '9', type: 'custom', position: { x: 450, y: 650 }, data: { ...defaultData } },
      { id: '10', type: 'custom', position: { x: 670, y: 650 }, data: { ...defaultData } },
      { id: '11', type: 'custom', position: { x: 890, y: 650 }, data: { ...defaultData } },
      { id: '12', type: 'custom', position: { x: 1110, y: 650 }, data: { ...defaultData } },
      { id: '13', type: 'custom', position: { x: 1330, y: 650 }, data: { ...defaultData } },
      { id: '14', type: 'custom', position: { x: 1550, y: 650 }, data: { ...defaultData } },
      { id: '15', type: 'custom', position: { x: 1770, y: 650 }, data: { ...defaultData } },
    ];

    const initialEdges = [
      { id: 'e1-2', source: '1', target: '2' }, { id: 'e1-3', source: '1', target: '3' },
      { id: 'e2-4', source: '2', target: '4' }, { id: 'e2-5', source: '2', target: '5' },
      { id: 'e3-6', source: '3', target: '6' }, { id: 'e3-7', source: '3', target: '7' },
      { id: 'e4-8', source: '4', target: '8' }, { id: 'e4-9', source: '4', target: '9' },
      { id: 'e5-10', source: '5', target: '10' }, { id: 'e5-11', source: '5', target: '11' },
      { id: 'e6-12', source: '6', target: '12' }, { id: 'e6-13', source: '6', target: '13' },
      { id: 'e7-14', source: '7', target: '14' }, { id: 'e7-15', source: '7', target: '15' },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsTreeCreated(true);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setFormData({ 
      name: node.data.name || '', 
      nominee: node.data.nominee || '', 
      idNumber: node.data.idNumber || '' 
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (formData.idNumber !== '' && !/^\d{10}$/.test(formData.idNumber)) {
      alert("Error: ID Number must be exactly 10 digits!");
      return;
    }

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...formData } };
        }
        return n;
      })
    );
    setIsModalOpen(false);
  };

  const handleAddChild = () => {
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: { x: selectedNode.position.x, y: selectedNode.position.y + 120 },
      data: { name: '', nominee: '', idNumber: '' },
    };

    const newEdge = {
      id: `e${selectedNode.id}-${newNodeId}`,
      source: selectedNode.id,
      target: newNodeId,
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    setIsModalOpen(false);
  };

  const handleDeleteNode = () => {
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setIsModalOpen(false);
  };

  // Production-Ready Native Export Flow with Error Handling
  const downloadTree = useCallback(async () => {
    const element = document.querySelector('.react-flow');
    if (!element) return;

    const controls = document.querySelector('.react-flow__controls');
    if (controls) controls.style.display = 'none';

    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#0f172a', pixelRatio: 2 });
      if (controls) controls.style.display = 'flex';

      if (!dataUrl || !dataUrl.includes(',')) {
        throw new Error("Image generation failed to produce valid data.");
      }

      const base64Data = dataUrl.split(',')[1];
      const fileName = `GrowthOS_Tree_${Date.now()}.jpg`;

      try {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        try {
          await Share.share({
            title: 'GrowthOS Tree',
            text: 'Here is your GrowthOS tree structure!',
            url: savedFile.uri,
            dialogTitle: 'Save or Share your Tree',
          });
        } catch (shareErr) {
          alert(`Image saved successfully to Documents folder!`);
        }
      } catch (nativeErr) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }

    } catch (err) {
      console.error('Export error:', err);
      if (controls) controls.style.display = 'flex';
      alert('Export failed da: ' + (err.message || 'Unknown error'));
    }
  }, []);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  return (
    <ReactFlowProvider>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {!isTreeCreated ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Ready to Build Tree (GrowthOS)</h2>
            <button 
              onClick={handleCreateTree}
              style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Generate 15-Node Tree
            </button>
          </div>
        ) : (
          <>
            <div style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: '#1e293b',
              gap: '8px',
              flexShrink: 0
            }}>
              <button 
                onClick={() => navigate('/')} 
                style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                ⬅ Back
              </button>

              <h2 style={{ color: 'white', margin: 0, fontSize: '15px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                GrowthOS
              </h2>

              <button 
                onClick={downloadTree} 
                style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                Download / Share
              </button>
            </div>

            <div style={{ flexGrow: 1, width: '100%', height: '100%' }}>
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                minZoom={0.1}
                maxZoom={2}
                panOnScroll={true}
                selectionOnDrag={false}
                panOnDrag={[1, 2]}
                className="react-flow"
              >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </>
        )}

        {isModalOpen && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' 
          }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ margin: 0, textAlign: 'center' }}>Edit Node</h3>
              
              <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '10px' }} />
              <input type="text" placeholder="Nominee" value={formData.nominee} onChange={(e) => setFormData({...formData, nominee: e.target.value})} style={{ padding: '10px' }} />
              <input type="text" placeholder="ID Number (10 Digits)" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} maxLength={10} style={{ padding: '10px' }} />
              
              <button onClick={handleSave} style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                Save Details
              </button>
              
              <hr style={{ width: '100%' }}/>
              
              <button onClick={handleAddChild} style={{ padding: '10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                + Add Child Node Below
              </button>

              <button onClick={handleDeleteNode} style={{ padding: '10px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                🗑️ Delete Node
              </button>

              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}