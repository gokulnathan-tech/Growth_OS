import dagre from "dagre";

const isMobile = window.innerWidth <= 768;

// Responsive Card Size
const NODE_WIDTH = isMobile ? 170 : 280;
const NODE_HEIGHT = isMobile ? 110 : 170;

export function buildTreeLayout(tree) {
  const nodes = [];
  const edges = [];

  if (!tree) {
    return {
      nodes: [],
      edges: [],
    };
  }

  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: "TB",

    // Vertical gap
    ranksep: isMobile ? 65 : 120,

    // Horizontal gap
    nodesep: isMobile ? 20 : 60,

    marginx: isMobile ? 15 : 40,
    marginy: isMobile ? 15 : 40,
  });

  function traverse(node) {
    if (!node) return;

    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    nodes.push({
      id: node.id,
      type: "member",
      data: {
        member: node,
      },
      position: {
        x: 0,
        y: 0,
      },
    });

    // Left Child
    if (node.left) {
      graph.setEdge(node.id, node.left.id);

      edges.push({
        id: `${node.id}-${node.left.id}`,
        source: node.id,
        target: node.left.id,
        type: "smoothstep",
      });

      traverse(node.left);
    }

    // Right Child
    if (node.right) {
      graph.setEdge(node.id, node.right.id);

      edges.push({
        id: `${node.id}-${node.right.id}`,
        source: node.id,
        target: node.right.id,
        type: "smoothstep",
      });

      traverse(node.right);
    }
  }

  traverse(tree);

  dagre.layout(graph);

  const layoutNodes = nodes.map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });

  return {
    nodes: layoutNodes,
    edges,
  };
}