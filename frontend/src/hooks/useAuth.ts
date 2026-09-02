import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  // Throwing here turns "provider missing" into an immediate, named error
  // instead of a confusing null-property crash deeper in a component.
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
}
