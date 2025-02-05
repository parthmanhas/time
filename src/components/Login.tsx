import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="btn btn-sm btn-outline">
      Sign in with Google
    </button>
  );
};
