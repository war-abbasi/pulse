import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { useAuth } from '../hooks/useAuth';
import { hasErrors, validateRegister, type Errors, type RegisterForm } from '../lib/validation';
import { getErrorMessage } from '../services/api';
import { AuthCard } from './AuthCard';

const EMPTY: RegisterForm = { fullName: '', username: '', password: '', confirmPassword: '' };

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<Errors<RegisterForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const setField = (key: keyof RegisterForm, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateRegister(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // confirmPassword is a client-side concern only — the API never sees it.
      await register({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        password: values.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not create your account.'));
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start tracking what matters in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <Alert message={submitError} />}

        <TextField
          label="Full name"
          autoComplete="name"
          value={values.fullName}
          onChange={(event) => setField('fullName', event.target.value)}
          error={errors.fullName}
          placeholder="Ada Lovelace"
        />

        <TextField
          label="Username"
          autoComplete="username"
          value={values.username}
          onChange={(event) => setField('username', event.target.value)}
          error={errors.username}
          hint="At least 3 characters, no spaces."
          placeholder="ada"
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          error={errors.password}
          hint="At least 6 characters."
          placeholder="••••••••"
        />

        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
          placeholder="••••••••"
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
