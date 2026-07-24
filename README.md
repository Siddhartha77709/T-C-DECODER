# T&C Decoder — Legal AI Assistant & Contract Breakdown

**T&C Decoder** is a professional Legal AI application designed to translate complex Terms & Conditions, Privacy Policies, and legal contracts into clear, plain-English evaluations with full line extraction and clause traceability.

---

## 🌟 Key Features

- **Full Clause Line Extraction**: Extracts complete, contiguous body sentences directly from contract body text (ignoring isolated header fragments).
- **Accurate Trigger Identification**: Highlights exact trigger words and key phrases (e.g., `binding arbitration`, `perpetual license`, `no refunds`).
- **Balanced Plain-English Summaries**: Provides clear, 1-2 sentence translations without overstating restrictions.
- **Smart Suggestions Before You Agree**: Placed directly below the main evaluation button with actionable user steps and explicit reasoning.
- **AI Traceability & Validation Engine**: Side-by-side comparison of original legal wording against AI summaries, rationales, user impacts, and descriptive assessments.
- **Zero Percentage Scores**: Uses curated, descriptive ratings (`High Risk`, `Be Careful`, `Needs Attention`, `Low Risk`, `User Friendly`).
- **Global Clause Controls**: `Expand All` and `Collapse All` controls for instant card toggle.
- **Privacy-First Storage**: Local document archiving with zero persistent cloud tracking.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons
- **AI Engine**: Google Gemini API (Gemini 2.5 Flash) + Local Legal Rule Engine Fallback
- **Build & Deploy**: Vite, Cloudflare Pages

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Siddhartha77709/T-C-DECODER.git

# Navigate to project directory
cd T-C-DECODER

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## ☁️ Deployment to Cloudflare Pages

### Option 1: Automatic Cloudflare Pages Git Integration (Recommended)

1. Push your repository to GitHub: `https://github.com/Siddhartha77709/T-C-DECODER`.
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create Application** → **Pages**.
3. Select **Connect to Git** and pick the `Siddhartha77709/T-C-DECODER` repository.
4. Configure Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Click **Save and Deploy**. Cloudflare will automatically build and publish your site with free SSL and global CDN.

### Option 2: Wrangler CLI Deployment

```bash
# Build production dist
npm run build

# Deploy via Wrangler CLI
npx wrangler pages deploy dist --project-name=t-c-decoder
```

---

## 📄 License

MIT License.
