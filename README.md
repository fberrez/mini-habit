# minihabits.

A minimalist habit tracking app built with React Native and Expo, designed to help users build and maintain daily habits with a clean, intuitive interface.

## Features

- 🌓 Dark/Light mode support
- 📱 Clean, modern UI with smooth animations
- 📊 5-day habit tracking view
- 🔥 Streak counting
- 💾 Persistent storage using AsyncStorage
- 📲 Haptic feedback for interactions
- 🔍 Detailed habit view
- ➕ Easy habit creation with modal interface

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- Expo Haptics
- Expo BlurView
- Moment.js

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS testing)
- Android Studio (for Android testing)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/fberrez/minihabits.git
```

2. Install dependencies:

```bash
cd minihabits
npm install
```

3. Start the development server:

```bash
npm run ios
```

## Project Structure

```bash
├── app/
│ ├── (tabs)/
│ │ ├── index.tsx # Main habits screen
│ │ ├── layout.tsx # Tab navigation layout
│ │ └── HabitDetailsScreen.tsx
│ └── layout.tsx # Root layout with theme provider
├── components/
│ ├── CustomSplash.tsx # Splash screen component
│ ├── ThemedText.tsx
│ └── ThemedView.tsx
├── constants/
│ └── StorageKey.tsx
└── hooks/
└── useColorScheme.ts
```