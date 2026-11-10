// ================================
// Default 15 Member Binary Tree
// ================================

function createNode(id, level) {
  return {
    id: id.toString(),
    name: "",
    nominee: "",
    idNumber: "",
    level,
    left: null,
    right: null,
  };
}

export function createDefaultTree() {
  const nodes = [];

  for (let i = 1; i <= 15; i++) {

    let level = 1;

    if (i >= 2 && i <= 3) level = 2;
    else if (i >= 4 && i <= 7) level = 3;
    else if (i >= 8) level = 4;

    nodes[i] = createNode(i, level);

  }

  nodes[1].left = nodes[2];
  nodes[1].right = nodes[3];

  nodes[2].left = nodes[4];
  nodes[2].right = nodes[5];

  nodes[3].left = nodes[6];
  nodes[3].right = nodes[7];

  nodes[4].left = nodes[8];
  nodes[4].right = nodes[9];

  nodes[5].left = nodes[10];
  nodes[5].right = nodes[11];

  nodes[6].left = nodes[12];
  nodes[6].right = nodes[13];

  nodes[7].left = nodes[14];
  nodes[7].right = nodes[15];

  return nodes[1];
}