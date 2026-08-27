import { lazy } from 'react';

const Home = lazy(() => import('@/features/home/Home'));
const Scanner = lazy(() => import('@/features/scanner/Scanner'));
const Encyclopedia = lazy(() => import('@/features/ingredients/Encyclopedia'));
const IngredientDetail = lazy(() => import('@/features/ingredients/IngredientDetail'));
const LittleKitchen = lazy(() => import('@/features/recipes/LittleKitchen'));
const RecipeDetail = lazy(() => import('@/features/recipes/RecipeDetail'));
const Favorites = lazy(() => import('@/features/recipes/Favorites'));
const ScanHistory = lazy(() => import('@/features/history/ScanHistory'));
const Community = lazy(() => import('@/features/community/Community'));
const SubmitRecipe = lazy(() => import('@/features/community/SubmitRecipe'));
const CommunityRecipeDetail = lazy(() => import('@/features/community/CommunityRecipeDetail'));
const MealPlanner = lazy(() => import('@/features/planner/MealPlanner'));
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Admin = lazy(() => import('@/features/admin/Admin'));

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
