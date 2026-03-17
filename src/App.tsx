import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Feed } from './pages/Feed';
import { Community } from './pages/Community';
import { Docs } from './pages/Docs';
import { ProjectDetail } from './pages/ProjectDetail';
import { Profile } from './pages/Profile';

import { Auth } from './pages/Auth';
import { UploadProject } from './pages/UploadProject';
import { EditProfile } from './pages/EditProfile';
import { EditProject } from './pages/EditProject';
import { PostDetail } from './pages/PostDetail';
import { DirectMessageWidget } from './components/features/DirectMessageWidget';
import { useAuthStore } from './store/authStore';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { useEffect } from 'react';

import { Leaderboard } from './pages/Leaderboard';
import { Voice } from './pages/Voice';
import { Shop } from './pages/Shop';

function App() {
    const { initialize, user, profile, loading } = useAuthStore();

    useEffect(() => {
        initialize();
    }, []);

    // Check if we need to show onboarding
    // Only show if: Logged In + Profile Loaded + Not Onboarded + Not Loading
    const showOnboarding = !loading && user && profile && !profile.is_onboarded;

    return (
        <>
            {showOnboarding && <OnboardingModal />}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/upload" element={<UploadProject />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/post/:id" element={<PostDetail />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/project/edit/:id" element={<EditProject />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/voice" element={<Voice />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <DirectMessageWidget />
        </>
    );
}

export default App;
