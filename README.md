# 🛡️ Ambassadors Assembly | **AA-ADMIN**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

> **A high-performance administrative engine for Ambassadors Assembly.**  
> Purpose-built for church leadership, AA-ADMIN orchestrates departmental workflows, financial oversight, and ministry logistics with a premium, cinematic user experience.

---

## 🏛️ Architecture & Infrastructure

AA-ADMIN is architected as a **Reactive Data Hub**, leveraging a real-time bridge between a headless PostgreSQL database and a motion-driven frontend.

### The Core Stack

- **Compute**: Specialized React 18+ runtime with selective hydration.
- **State Orchestration**: Real-time Supabase hooks for multi-user synchronization.
- **Visual Engine**: `motion/react` (Framer Motion) delivering cinematic staggered transitions and hardware-accelerated animations.
- **Design System**: A curated dark-mode aesthetic built on Radix UI primitives and Tailwind CSS, optimized for high-contrast readability.

---

## 🚀 Key Modules

| Module | Capability | Tech Highlight |
| :--- | :--- | :--- |
| **Operational Tasks** | Kanban-based departmental task orchestration. | JSONB-based subtask & comment threading. |
| **Giving Goals** | Financial transparency and progress tracking. | Real-time aggregate calculation logic. |
| **Member Matrix** | Categorized worker and leader profiles. | Optimized PostgreSQL relational joins. |
| **AI Lab** | Experimental utility for administrative insights. | LLM-integrated processing (Phase 3). |
| **Resource Vault** | Centralized brand assets and handbooks. | Secure edge storage integration. |

---

## 🛠️ Developer Onboarding

### Prerequisites

- **Node.js** v18.0+
- **Supabase CLI** (for local migrations)
- **Git**

### Installation logic

```bash
# 1. Clone the repository
git clone https://github.com/ambassadors-assembly/aa-admin.git

# 2. Synchronize dependencies
npm install

# 3. Configure Environmental Variables
# Create a .env.local with the following keys:
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Local Development

```bash
npm run dev
```

---

## 📂 Project Hierarchy

```text
AA-ADMIN/
├── components/          # Core atomic UI primitives (Radix-powerered)
├── src/
│   ├── components/      # Higher-order admin modules (Dashboard, Tasks, etc.)
│   ├── lib/             # API clients, hooks, and utility functions
│   ├── types/           # Rigid database.types.ts (Supabase Generated)
│   └── App.tsx          # Root orchestration & cinematic splash screen
└── supabase/            # Edge functions and migration history
```

---

## 🔒 Security & Performance

- **Zero-Trust**: Every call is protected by Row Level Security (RLS) on the Postgres layer.
- **High IQ Load States**: Utilizing skeletal loading and a cinematic "Initialization" reveal to eliminate layout shift.
- **Type-Safe Ecosystem**: End-to-end TypeScript integration from the SQL schema to the UI props.

---

<div align="center">
  <sub>Built with ❤️ by the Carix Studio.</sub>
</div>
