import { Navigate } from 'react-router-dom';
import CandidateProfileEditor from '../../components/CandidateProfileEditor';
import { useAuth } from '../../contexts/useAuth';

export default function CandidateProfileCompletePage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;
  if (user.profile_completed || user.profile_completion_skipped) {
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return <CandidateProfileEditor mode="complete" />;
}
