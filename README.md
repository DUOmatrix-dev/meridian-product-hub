[README-meridian-product-hub.md](https://github.com/user-attachments/files/35007799/README-meridian-product-hub.md)
Meridian Product Hub

A collaborative product management workspace for feature prioritization, roadmaps, customer feedback, and decision tracking.

Features

- Backlog management: Capture feature requests, define problem statements, and track delivery status.
- RICE prioritization: Calculate and compare feature scores using reach, impact, confidence, and effort.
- Roadmap planning: Organize initiatives across Now, Next, Later, and Not Building horizons.
- Feedback intake: Record customer feedback from interviews, support, analytics, sales, and competitive research.
- Decision log: Document product decisions, rationale, trade-offs, confidence, and approval status.
- Workspace collaboration: Create workspaces, manage members, and switch between product areas.
- Sprint insights: Review sprint velocity and story-point information.
- Google sign-in and cloud sync: Authenticate with Firebase and synchronize workspace data through Cloud Firestore.

 Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Firebase Authentication
- Cloud Firestore
- Lucide React
- Motion

 Getting Started

 Prerequisites

- Node.js
- npm
- A Firebase project with Google Authentication and Cloud Firestore configured

 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/meridian-product-hub.git
cd meridian-product-hub
```

 2. Install dependencies

```bash
npm install
```

 3. Configure Firebase

Review `firebase-applet-config.json` and configure it with the Firebase web app settings for your own project.

Enable Google as a sign-in provider in Firebase Authentication, create a Cloud Firestore database, and deploy the security rules in `firestore.rules`.

The repository includes `firebase-blueprint.json` and `security_spec.md` as supporting data-model and security documentation.

Do not commit private credentials or service-account keys. Firebase web configuration values, including the Firebase web API key, are normally used by browser applications; protect the project with appropriate API restrictions, Firebase Authentication, and Firestore Security Rules.

 4. Start the development server

```bash
npm run dev
```

Open the local URL shown by Vite. The development server is configured to use port `3000`:

```text
http://localhost:3000
```

 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates the production build in `dist/`. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs TypeScript checks without emitting files. |
| `npm run clean` | Removes generated build output. |

 Project Structure

```text
meridian-product-hub/
├── src/
│   ├── assets/
│   │   └── images/                 # Team avatar images
│   ├── components/
│   │   ├── ActionModals.tsx        # Forms and action dialogs
│   │   ├── Avatar.tsx              # Team member avatar component
│   │   ├── BacklogView.tsx         # Feature backlog and prioritization
│   │   ├── DecisionsView.tsx       # Product decision log
│   │   ├── FeedbackView.tsx        # Customer feedback management
│   │   ├── RequestDetailDrawer.tsx # Feature request details
│   │   ├── RoadmapView.tsx         # Now/Next/Later roadmap
│   │   ├── RiceCalculator.tsx      # RICE scoring interface
│   │   ├── SignInScreen.tsx        # Google sign-in screen
│   │   └── SprintVelocity.tsx      # Sprint velocity view
│   ├── hooks/
│   │   └── useWorkspaceData.ts     # Authentication and Firestore workspace data
│   ├── lib/
│   │   ├── firebase.ts             # Firebase initialization and error handling
│   │   └── seedData.ts             # Initial workspace data
│   ├── types/
│   │   └── product.ts              # Product, workspace, feedback and decision types
│   ├── App.tsx                     # Main application and navigation
│   ├── index.css                   # Global styles
│   └── main.tsx                    # React entry point
├── .env.example
├── .gitignore
├── firebase-applet-config.json     # Firebase web app configuration
├── firebase-blueprint.json         # Data model blueprint
├── firestore.rules                 # Firestore security rules
├── security_spec.md                # Security requirements
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

 RICE Prioritization

Meridian calculates a RICE score using:

```text
RICE Score = (Reach × Impact × Confidence) ÷ Effort
```

The score helps product teams compare feature opportunities using a consistent prioritization framework. It is a decision-support measure, not a substitute for product judgment.

 Data and Security

Workspace information is stored in Cloud Firestore. The application uses Firebase Authentication with Google sign-in and listens for workspace, feature request, feedback, and decision updates.

Before deploying:

- Review and deploy `firestore.rules` to your Firebase project.
- Confirm that only authenticated, authorized workspace members can access workspace data.
- Configure appropriate API key restrictions.
- Never commit Firebase service-account files, private keys, or other server credentials.
- Test access controls with accounts that are and are not workspace members.

 License

No separate project license is specified in the supplied source files. Confirm that you have the rights to distribute the code and assets before adding a license.
