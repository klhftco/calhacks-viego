# Viego Wallet

A gamified student-centric wallet application that automates campus payments and nudges healthy financial behaviors.

## Features

### 🦖 Gamified Savings (Main Feature)
- Monster hatching system with Pokemon-style starter creatures
- Streaks and achievements for meeting financial goals
- Island realm where your creatures roam
- Visit friends' islands and share progress
- Unlock new characters by achieving savings goals

### 💰 Smart Budgeting
- Real-time spend tracking and alerts
- MCC-based spending controls by category
- Positive nudges instead of restrictions
- Automated payments for tuition, rent, and transit
- Income-based budget recommendations

### 🗺️ Merchant Map
- Find nearby student-essential merchants
- See where your Viego card is accepted
- Google Maps integration (to be implemented)
- Merchant search and filtering

### 🎁 Automatic Savings
- Merchant offers automatically applied
- Post-purchase savings opportunities
- Track total savings over time

### 👥 Social Features
- Add friends and connect with your university group
- Leaderboard and XP system
- Share achievements (spending remains private)
- Visit friends' islands

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

Make sure you have Node.js installed (version 18 or higher recommended).

### Installation

1. Navigate to the project directory:
```bash
cd viego-wallet
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
viego-wallet/
├── app/
│   ├── budget/          # Budget and spending tracking page
│   ├── friends/         # Social features and leaderboard
│   ├── island/          # Main gamification page with monsters
│   ├── map/             # Merchant locator and map
│   ├── savings/         # Offers and savings page
│   ├── layout.tsx       # Root layout with navigation
│   ├── page.tsx         # Home/dashboard page
│   └── globals.css      # Global styles
├── components/
│   ├── Navigation.tsx        # Bottom navigation bar
│   ├── StreakCard.tsx       # Reusable streak display
│   ├── AchievementBadge.tsx # Achievement/badge component
│   ├── GoalProgress.tsx     # Goal progress indicator
│   └── MonsterCard.tsx      # Monster display card
├── public/              # Static assets
└── package.json
```

## API Integration (To Do)

The following Visa APIs are planned for integration:

- **Visa Transaction Controls API** - Control spending by merchant category
- **Merchant Search/Locator API** - Find nearby merchants and check acceptance
- **Merchant Offers Resource Center API** - Retrieve and apply merchant offers
- **Visa Subscription Manager** - Handle recurring payments

## Design Principles

1. **Positive Reinforcement**: Uses encouraging messages instead of restrictive warnings
2. **Gamification**: Makes saving fun through monster collection and social competition
3. **Student-Centric**: Focuses on common student expenses (tuition, rent, transit, food)
4. **Automated**: Handles recurring payments and offer application automatically
5. **Social but Private**: Share achievements while keeping spending details private

## Next Steps

1. Install Node.js if not already installed
2. Run `npm install` in the viego-wallet directory
3. Integrate Visa APIs for real transaction data
4. Add Google Maps integration for merchant locations
5. Implement user authentication
6. Connect to a backend/database for persistent storage
7. Add payment processing capabilities

## Contributing

This is a hackathon project. Feel free to extend and improve!

## License

MIT
