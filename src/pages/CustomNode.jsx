import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CustomNode({ data }) {
  // Safe extraction to prevent undefined crash
  const name = data?.name || 'Enter Name';
  const nominee = data?.nominee || '-';
  const idNumber = data?.idNumber || '----------';

  return (
    <div style={{ 
      padding: '10px 14px', 
      border: '2px solid #3b82f6', 
      borderRadius: '10px', 
      background: '#1e293b', 
      color: 'white', 
      width: '180px',
      boxShadow: '0 6px 15px rgba(0,0,0,0.4)',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'transform 0.2s ease'
    }}>
      {/* Top Handle for incoming connection */}
      <Handle type="target" position={Position.Top} style={{ background: '#60a5fa', width: '8px', height: '8px' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#60a5fa', borderBottom: '1px solid #475569', paddingBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Nominee: {nominee}
        </div>
        <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>
          ID: {idNumber}
        </div>
      </div>

      {/* Bottom Handle for outgoing connections to child nodes */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#60a5fa', width: '8px', height: '8px' }} />
    </div>
  );
}