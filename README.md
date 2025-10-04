# Knowledge Graph Explorer

A conversational knowledge exploration system that helps users build visual knowledge graphs by progressively exploring topics. Each answer branches into deeper layers, creating an interactive, zoomable map of interconnected concepts.

## 🎯 Vision

Transform how people learn and explore knowledge by creating dynamic, visual representations of their curiosity journey. Instead of traditional linear research, users can see connections between concepts and navigate their personalized learning path.

## ✨ Features

### Core Functionality
- **Interactive Search**: Enter natural language questions to start your exploration
- **Dynamic Knowledge Graph**: Infinite, pannable/zoomable canvas displaying concept relationships
- **Progressive Exploration**: Each node offers 3-5 exploration paths leading to deeper understanding
- **Visual Learning**: See connections and relationships between concepts in real-time
- **Smooth Animations**: Engaging transitions as your knowledge graph grows organically

### Knowledge Nodes
- Display concise explanations with exploration options
- Visual states (unexplored, loading, explored)
- Hover previews for full content
- Automatic positioning and edge connections

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom animations
- **Graph Visualization**: XYFlow React
- **State Management**: Zustand
- **UI Components**: Radix UI primitives
- **Database**: Prisma ORM with PostgreSQL
- **AI**: Anthropic Claude API
- **Animations**: Framer Motion

## 🏗️ Architecture

The application follows a modern, component-based architecture:

```
Frontend (Next.js/React)
├── Interactive Canvas (XYFlow)
├── Node Components
└── State Management (Zustand)

Backend (Next.js API Routes)
├── AI Integration (Claude API)
├── Graph Generation Logic
└── Database Layer (Prisma)
```

## 📦 Project Structure

```
knowledge-graph/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   ├── store/           # Zustand state management
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── prisma/              # Database schema and migrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager
- PostgreSQL database

### Installation

1. Navigate to the project directory:
```bash
cd knowledge-graph
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
# Create .env file with:
DATABASE_URL="your-postgresql-connection-string"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

4. Initialize the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎓 How It Works

1. **Ask a Question**: User enters a natural language question in the search bar
2. **Generate Root Node**: AI creates an initial answer with exploration paths
3. **Explore Branches**: Click any exploration option to generate child nodes
4. **Build Your Graph**: Continue exploring to create a personalized knowledge map
5. **Navigate & Learn**: Pan, zoom, and revisit concepts as your understanding deepens

## 🎨 Design Principles

- **Progressive Depth**: Start simple, allow users to go as deep as they want
- **Visual Connections**: Make relationships between concepts explicit
- **Personalized Learning**: Every graph is unique to the user's curiosity
- **Academic Accuracy**: Maintain quality while using accessible language
- **Performance**: Sub-3-second node generation, smooth 60fps interactions

## 🗺️ Roadmap

### Phase 1 (MVP) - ✅ Current
- Core graph exploration functionality
- AI-powered content generation
- Interactive canvas with smooth animations

### Phase 2 (Planned)
- User accounts and authentication
- Save/load knowledge graphs
- Share graphs via URL
- Export as images (PNG/SVG)
- Public graph gallery

### Phase 3 (Future)
- Collaborative graphs (multiplayer)
- Comments and annotations
- Graph templates for common topics
- Search within graphs
- Community remixing

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. Contributions are not currently being accepted.

---

**Built with curiosity and AI** 🧠✨
