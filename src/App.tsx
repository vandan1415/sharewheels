import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LocationProvider } from '@/context/LocationContext';
import { Navbar } from '@/components/layout/Navbar';
import { LocationModal } from '@/components/layout/LocationModal';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { OffRoadPage } from '@/pages/OffRoadPage';
import { LuxuryCollectionPage } from '@/pages/LuxuryCollectionPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { VehicleDetailsPage } from '@/pages/VehicleDetailsPage';
import { VehiclePassportPage } from '@/pages/VehiclePassportPage';
import { ComparePage } from '@/pages/ComparePage';
import { CustomerPortalPage } from '@/pages/CustomerPortalPage';
import { WheelmatePage } from '@/pages/WheelmatePage';
import {
  AboutPage,
  AuthPage,
  ContactPage,
  HowItWorksPage,
  TrustSafetyPage,
} from '@/pages/InfoPages';
import { OwnerLandingPage } from '@/pages/owner/OwnerLandingPage';
import { OwnerRegisterPage } from '@/pages/owner/OwnerRegisterPage';
import { OwnerLoginPage } from '@/pages/owner/OwnerLoginPage';
import { OwnerVerificationPage } from '@/pages/owner/OwnerVerificationPage';
import { OwnerDashboardPage } from '@/pages/owner/OwnerDashboardPage';
import { OwnerVehiclesPage } from '@/pages/owner/OwnerVehiclesPage';
import { OwnerAddVehiclePage } from '@/pages/owner/OwnerAddVehiclePage';
import { OwnerBookingsPage } from '@/pages/owner/OwnerBookingsPage';
import { OwnerEarningsPage } from '@/pages/owner/OwnerEarningsPage';
import { OwnerProfilePage } from '@/pages/owner/OwnerProfilePage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminOwnersPage } from '@/pages/admin/AdminOwnersPage';
import { AdminVehiclesPage } from '@/pages/admin/AdminVehiclesPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { AdminFinancePage } from '@/pages/admin/AdminFinancePage';
import { AdminIncidentsPage } from '@/pages/admin/AdminIncidentsPage';
import { AdminCitiesPage } from '@/pages/admin/AdminCitiesPage';
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { RoutePlannerPage } from '@/pages/routecraft/RoutePlannerPage';
import { JourneysPage } from '@/pages/routecraft/JourneysPage';
import { JourneyDetailPage } from '@/pages/routecraft/JourneyDetailPage';
import { TripBudgetPage } from '@/pages/routecraft/TripBudgetPage';
import { FuelCalculatorPage } from '@/pages/routecraft/FuelCalculatorPage';
import { SavedJourneysPage } from '@/pages/routecraft/SavedJourneysPage';

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const isSeparatePortal =
    pathname === '/owner' ||
    pathname.startsWith('/owner/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');
  const isLuxuryShowroom =
    pathname === '/luxury' || pathname === '/luxury-collection';

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex flex-col">
      {!isSeparatePortal && (
        <>
          {!isLuxuryShowroom && <Navbar />}
          <LocationModal />
        </>
      )}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/luxury" element={<LuxuryCollectionPage />} />
          <Route path="/luxury-collection" element={<Navigate to="/luxury" replace />} />
          <Route path="/off-road" element={<OffRoadPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/passport" element={<VehiclePassportPage />} />
          <Route path="/passport/:vehicleId" element={<VehiclePassportPage />} />
          <Route path="/wheelmate" element={<WheelmatePage />} />
          <Route path="/ai-assistant" element={<WheelmatePage />} />
          <Route path="/route-planner" element={<RoutePlannerPage />} />
          <Route path="/journeys" element={<JourneysPage />} />
          <Route path="/journey/:id" element={<JourneyDetailPage />} />
          <Route path="/trip-budget" element={<TripBudgetPage />} />
          <Route path="/fuel-calculator" element={<FuelCalculatorPage />} />
          <Route path="/saved-journeys" element={<SavedJourneysPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/list-your-vehicle" element={<Navigate to="/owner" replace />} />
          <Route path="/trust-and-safety" element={<TrustSafetyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />

          {/* Customer Portal Protected Routes */}
          <Route path="/dashboard" element={<CustomerPortalPage initialTab="overview" />} />
          <Route path="/bookings" element={<CustomerPortalPage initialTab="bookings" />} />
          <Route path="/saved" element={<CustomerPortalPage initialTab="saved" />} />
          <Route path="/profile" element={<CustomerPortalPage initialTab="profile" />} />

          {/* Dedicated Owner Portal Routes */}
          <Route path="/owner" element={<OwnerLandingPage />} />
          <Route path="/owner/register" element={<OwnerRegisterPage />} />
          <Route path="/owner/login" element={<OwnerLoginPage />} />
          <Route path="/owner/verification" element={<OwnerVerificationPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
          <Route path="/owner/vehicles" element={<OwnerVehiclesPage />} />
          <Route path="/owner/vehicles/add" element={<OwnerAddVehiclePage />} />
          <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
          <Route path="/owner/earnings" element={<OwnerEarningsPage />} />
          <Route path="/owner/profile" element={<OwnerProfilePage />} />

          {/* Dedicated Admin Portal Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/owners" element={<AdminOwnersPage />} />
          <Route path="/admin/owners/pending" element={<AdminOwnersPage defaultPending />} />
          <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
          <Route path="/admin/vehicles/pending" element={<AdminVehiclesPage defaultPending />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/payments" element={<AdminFinancePage defaultTab="transactions" />} />
          <Route path="/admin/payouts" element={<AdminFinancePage defaultTab="payouts" />} />
          <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
          <Route path="/admin/disputes" element={<AdminIncidentsPage defaultDisputes />} />
          <Route path="/admin/cities" element={<AdminCitiesPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      {!isSeparatePortal && !isLuxuryShowroom && <Footer />}
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <LocationProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppShell />
            </BrowserRouter>
          </LocationProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
