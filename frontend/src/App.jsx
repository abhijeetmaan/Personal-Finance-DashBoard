import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import AddTransactionPage from "./pages/AddTransactionPage";
import AccountsPage from "./pages/AccountsPage";
import CardsPage from "./pages/CardsPage";
import BudgetPage from "./pages/BudgetPage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import TransactionsPage from "./pages/TransactionsPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/add" element={<AddTransactionPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
