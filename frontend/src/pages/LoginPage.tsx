import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useAuth } from '../hooks/useAuth';
import { hasErrors, validateLogin, type Errors, type LoginForm } from '../lib/validation';
import { getErrorMessage } from '../services/api';
import { AuthCard } from './AuthCard';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginForm>({ username: '', password: '' });
  const [errors, setErrors] = useState<Errors<LoginForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Somebody already signed in has no business on the login screen.
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const setField = (key: keyof LoginForm, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateLogin(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await login({ username: values.username.trim(), password: values.password });
      // Send the user back where they were headed before the redirect.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/dashboard', { replace: true });
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not sign you in.'));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to see what needs your attention."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <Alert message={submitError} />}

        <TextField
          label="Username"
          autoComplete="username"
          value={values.username}
          onChange={(event) => setField('username', event.target.value)}
          error={errors.username}
          placeholder="ada"
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
