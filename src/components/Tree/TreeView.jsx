import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import NodeCard from "./NodeCard";
import { buildTreeLayout } from "../../utils/treeLayout";

const nodeTypes = {
  member: NodeCard,
};

const isMobile = window.innerWidth <= 768;

function TreeView({ tree, onEdit }) {

  const { nodes, edges } = useMemo(() => {

    if (!tree) {
      return {
        nodes: [],
        edges: [],
      };
    }

    const layout = buildTreeLayout(tree);

    return {
      nodes: layout.nodes.map((node) => ({
        ...node,
        data: {
          member: node.data.member,
          onEdit,
        },
      })),
      edges: layout.edges.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          stroke: "#ffffff",
          strokeWidth: isMobile ? 2 : 3,
        },
      })),
    };

  }, [tree, onEdit]);

  return (
    <div
      id="tree-area"
      style={{
        width: "100%",
        height: "calc(100vh - 130px)",
        background: "#0F172A",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}

        fitView
        fitViewOptions={{
          padding: isMobile ? 0.08 : 0.35,
        }}

        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={true}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        zoomOnScroll={!isMobile}
        zoomOnPinch={isMobile}
        panOnDrag={true}
        panOnScroll={false}
        selectionOnDrag={false}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background
          color="#334155"
          gap={18}
          size={1}
        />

        <Controls />
      </ReactFlow>
    </div>
  );
}

export default TreeView;