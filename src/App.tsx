import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Community } from './pages/Community';
import { Docs } from './pages/Docs';
import { ProjectDetail } from './pages/ProjectDetail';
import { Profile } from './pages/Profile';

import { Auth } from './pages/Auth';
import { UploadProject } from './pages/UploadProject';
import { EditProfile } from './pages/EditProfile';
import { DirectMessageWidget } from './components/features/DirectMessageWidget';
import { useAuthStore } from './store/authStore';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { useEffect } from 'react';

function App() {
    const { initialize, user, profile, loading } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    // Check if we need to show onboarding
    // Only show if: Logged In + Profile Loaded + Not Onboarded + Not Loading
    const showOnboarding = !loading && user && profile && !profile.is_onboarded;

    return (
        <BrowserRouter>
            {showOnboarding && <OnboardingModal />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/upload" element={<UploadProject />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/community" element={<Community />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <DirectMessageWidget />
        </BrowserRouter>
    );
}

export default App;
