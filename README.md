`# 🏋️‍♂️ BurpeeBet

**BurpeeBet** is a social nutrition tracking app that turns dieting into a challenge of accountability, pain, and partnership.

## 💡 Concept

BurpeeBet is like _MyFitnessPal_ meets _friendly punishment_.

You and a friend (or stranger) challenge each other to stick to personal calorie goals over a set period:  
**2, 4, or 8 weeks** — or a custom duration.

Each user sets their **own daily calorie goal**. If either of you fails to stick to it, there are **penalties**.

### 🔥 Example:

- You exceed your weekly goal by **500 calories**.
- Your friend exceeds theirs by **300 calories**.
- The penalty is shared: you both must burn 800 calories — through running, walking, or doing **burpees**.
- The pain you cause your partner keeps you accountable — and vice versa.

It’s dieting with social pressure and real consequences.

## 🧩 Core Features

### 1. 👯 Challenge System

- Create or join a **challenge** (2/4/8+ weeks).
- Invite a friend via **shareable link**.
- Set **personal calorie goals**.
- Track challenge progress together.
- See each other's compliance and penalty stats.

### 2. 🍗 Nutrition Tracker

- Log **calories and macros** (like MyFitnessPal).
- Search food database and scan barcodes.
- View daily and weekly totals.
- Log meals with ease.

### 3. ⚖️ Penalty Engine

- Auto-calculate overages.
- Convert excess calories to:
  - 💪 Burpees (e.g. 1 burpee per 10 calories)
  - 🏃 Distance or time-based cardio
- Add total challenge penalties together.

### 4. 📱 Friendly & Competitive UI

- Simple challenge **dashboard**.
- Show visual progress (e.g. “25 burpees owed this week”).
- Keep it fun, but motivating.

## 🧪 MVP Goals

- Launch as a **free app** using Expo + React Native.
- iOS support via Expo Go.
- Focus on:
  - Basic food logging
  - Challenge setup/invite
  - Weekly penalty calculation

Future versions may include:

- Push notifications
- Paid tiers (e.g., customized penalties, advanced stats)
- Integration with wearables (Apple Health, Fitbit, etc.)

---

## 🚀 Tech Stack

- React Native via **Expo**
- Supabase (Auth & DB)
- USDA FoodData Central API (Food Database)
- Local Notifications
- Barcode Scanner (future)
- iOS-first

## 🔧 Setup

### Prerequisites

- macOS with Node.js installed
- Xcode installed
- iOS Simulator available

### Environment Variables

Create a `.env.local` file in the root directory with:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_USDA_API_KEY=your_usda_api_key
```

#### Getting USDA API Key

1. Sign up for a free API key at [data.gov](https://api.data.gov/signup/)
2. Add the key to your `.env.local` file as `EXPO_PUBLIC_USDA_API_KEY`
3. The app will use `DEMO_KEY` as fallback (limited to 1,000 requests/hour)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on iOS simulator:
   ```bash
   npm run ios
   ```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

## Project Structure

```
pair-diet/
├── App.js              # Main app component
├── screens/            # Screen components
│   └── HomeScreen.js   # Example home screen
├── assets/             # Static assets
└── package.json        # Dependencies and scripts
```

## Development

The app includes a simple HomeScreen with a button that tracks tap count. This serves as a starting point for building your nutrition tracking features.

## Code Quality

The project is configured with:

- ESLint for code linting with React and React Native specific rules
- Prettier for consistent code formatting
- Pre-commit hooks can be added later if needed

## iOS Simulator

To run the app on iOS simulator:

1. Make sure Xcode is installed
2. Open iOS Simulator
3. Run `npm run ios`

The app will automatically open in the iOS Simulator.

## Latest Expo Guidance

This project follows the latest [Expo tutorial guidance](https://docs.expo.dev/tutorial/create-your-first-app/) for:

- Using the latest stable Expo CLI
- JavaScript-based development (not TypeScript)
- Proper project structure and component organization
- Modern React Native patterns and best practices
