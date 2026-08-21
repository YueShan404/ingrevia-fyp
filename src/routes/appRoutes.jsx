import { lazy } from 'react';

const Home = lazy(() => import('@/pages/Home'));
const Scanner = lazy(() => import('@/pages/Scanner'));
const Encyclopedia = lazy(() => import('@/pages/Encyclopedia'));
const IngredientDetail = lazy(() => import('@/pages/IngredientDetail'));
const LittleKitchen = lazy(() => import('@/pages/LittleKitchen'));
const RecipeDetail = lazy(() => import('@/pages/RecipeDetail'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const ScanHistory = lazy(() => import('@/pages/ScanHistory'));
const Community = lazy(() => import('@/pages/Community'));
const SubmitRecipe = lazy(() => import('@/pages/SubmitRecipe'));
const CommunityRecipeDetail = lazy(() => import('@/pages/CommunityRecipeDetail'));
const MealPlanner = lazy(() => import('@/pages/MealPlanner'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Admin = lazy(() => import('@/pages/Admin'));

export const appRoutes = [
  { path: '/', element: <Home /> },
  { path: '/scan', element: <Scanner /> },
  { path: '/encyclopedia', element: <Encyclopedia /> },
  { path: '/ingredient/:id', element: <IngredientDetail /> },
  { path: '/kitchen', element: <LittleKitchen /> },
  { path: '/recipe/:id', element: <RecipeDetail /> },
  { path: '/favorites', element: <Favorites /> },
  { path: '/history', element: <ScanHistory /> },
  { path: '/community', element: <Community /> },
  { path: '/submit', element: <SubmitRecipe /> },
  { path: '/community/:id', element: <CommunityRecipeDetail /> },
  { path: '/planner', element: <MealPlanner /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/admin', element: <Admin /> },
];
