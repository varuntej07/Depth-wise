/** Fixture data for mocking API responses in E2E tests */

export const SESSION_ID = '00000000-0000-0000-0000-000000000001';

export const createSessionResponse = {
  sessionId: SESSION_ID,
  isAnonymous: true,
  createdAt: new Date().toISOString(),
  classification: {
    intent: 'conceptual' as const,
    complexity: 'moderate' as const,
    suggestedBranchCount: 3,
  },
  rootNode: {
    id: 'root-001',
    title: 'Quantum Computing',
    content:
      'Quantum computing leverages quantum mechanical phenomena like superposition and entanglement to process information in fundamentally new ways.',
    exploreTerms: [
      { label: 'Superposition', query: 'What is quantum superposition?' },
      { label: 'Entanglement', query: 'How does quantum entanglement work?' },
    ],
    depth: 1,
    position: { x: 0, y: 0 },
  },
  branches: [
    {
      id: 'child-001',
      title: 'Qubits vs Classical Bits',
      summary: 'How quantum bits differ from classical binary digits.',
      content: 'Qubits can exist in superposition of 0 and 1 simultaneously.',
      depth: 2,
      position: { x: -300, y: 300 },
      followUpType: 'what',
    },
    {
      id: 'child-002',
      title: 'Quantum Entanglement',
      summary: 'Correlated quantum states across distance.',
      content: 'Entangled particles share quantum states regardless of distance.',
      depth: 2,
      position: { x: 0, y: 300 },
      followUpType: 'how',
    },
    {
      id: 'child-003',
      title: 'Practical Applications',
      summary: 'Real-world uses of quantum computing.',
      content: 'Quantum computing can revolutionize cryptography and drug discovery.',
      depth: 2,
      position: { x: 300, y: 300 },
      followUpType: 'example',
    },
  ],
};

/** Response when exploring child-001 */
export const exploreChild001Response = {
  parentId: 'child-001',
  parentContent: 'Qubits leverage superposition to represent both 0 and 1 simultaneously.',
  parentTerms: ['superposition', 'quantum state', 'measurement'],
  branches: [
    {
      id: 'grandchild-001',
      title: 'Bloch Sphere Representation',
      summary: 'Visualizing qubit states on a sphere.',
      content: 'The Bloch sphere provides a geometric representation of qubit states.',
      depth: 3,
      position: { x: -450, y: 600 },
      followUpType: 'how',
    },
    {
      id: 'grandchild-002',
      title: 'Quantum Measurement',
      summary: 'How observing a qubit collapses its state.',
      content: 'Measurement collapses superposition into a definite classical state.',
      depth: 3,
      position: { x: -300, y: 600 },
      followUpType: 'what',
    },
    {
      id: 'grandchild-003',
      title: 'Quantum Error Correction',
      summary: 'Protecting quantum information from decoherence.',
      content: 'Error correction codes protect fragile quantum states from noise.',
      depth: 3,
      position: { x: -150, y: 600 },
      followUpType: 'how',
    },
  ],
  edges: [
    { id: 'e-c1-gc1', source: 'child-001', target: 'grandchild-001' },
    { id: 'e-c1-gc2', source: 'child-001', target: 'grandchild-002' },
    { id: 'e-c1-gc3', source: 'child-001', target: 'grandchild-003' },
  ],
};

/** Response when exploring grandchild-001 (depth 4) */
export const exploreGrandchild001Response = {
  parentId: 'grandchild-001',
  parentContent: 'The Bloch sphere maps qubit states to points on a unit sphere.',
  parentTerms: ['rotation', 'polar angle', 'azimuthal angle'],
  branches: [
    {
      id: 'great-gc-001',
      title: 'Single-Qubit Gates',
      summary: 'Rotations on the Bloch sphere.',
      content: 'Quantum gates rotate qubit states on the Bloch sphere.',
      depth: 4,
      position: { x: -550, y: 900 },
      followUpType: 'how',
    },
    {
      id: 'great-gc-002',
      title: 'Pauli Matrices',
      summary: 'The mathematical operators behind qubit manipulation.',
      content: 'Pauli X, Y, Z matrices correspond to rotations around Bloch sphere axes.',
      depth: 4,
      position: { x: -400, y: 900 },
      followUpType: 'what',
    },
    {
      id: 'great-gc-003',
      title: 'Quantum State Tomography',
      summary: 'Reconstructing quantum states from measurements.',
      content: 'Tomography reconstructs the full quantum state from repeated measurements.',
      depth: 4,
      position: { x: -250, y: 900 },
      followUpType: 'example',
    },
  ],
  edges: [
    { id: 'e-gc1-ggc1', source: 'grandchild-001', target: 'great-gc-001' },
    { id: 'e-gc1-ggc2', source: 'grandchild-001', target: 'great-gc-002' },
    { id: 'e-gc1-ggc3', source: 'grandchild-001', target: 'great-gc-003' },
  ],
};
