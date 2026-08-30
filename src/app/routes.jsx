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
const Profile = lazy(() => import('@/features/profile/Profile'));
const Admin = lazy(() => import('@/features/admin/Admin'));
const Login = lazy(() => import('@/features/auth/Login'));
const Register = lazy(() => import('@/features/auth/Register'));
const ForgotPassword = lazy(() => import('@/features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/features/auth/ResetPassword'));

export const appRoutes = [
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/scan', element: <Scanner />, protected: true },
  { path: '/encyclopedia', element: <Encyclopedia /> },
  { path: '/ingredient/:id', element: <IngredientDetail /> },
  { path: '/kitchen', element: <LittleKitchen /> },
  { path: '/recipe/:id', element: <RecipeDetail /> },
  { path: '/favorites', element: <Favorites />, protected: true },
  { path: '/history', element: <ScanHistory />, protected: true },
  { path: '/community', element: <Community /> },
  { path: '/submit', element: <SubmitRecipe />, protected: true },
  { path: '/community/:id', element: <CommunityRecipeDetail /> },
  { path: '/planner', element: <MealPlanner />, protected: true },
  { path: '/dashboard', element: <Dashboard />, protected: true },
  { path: '/profile', element: <Profile />, protected: true },
  { path: '/admin', element: <Admin />, protected: true },
];
