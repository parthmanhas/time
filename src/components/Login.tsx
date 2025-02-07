import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <button
      onClick={signInWithGoogle}
      className="btn btn-sm w-full sm:w-auto btn-outline">
      sign in with google to save progress
    </button>
  );
};
