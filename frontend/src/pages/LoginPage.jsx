import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const fromPath = location.state?.from?.pathname || location.state?.from || '/discover';
      navigate(fromPath, { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to connect to the server. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  return (
    <div className="page-shell container auth-page">
      <div className="auth-panel">
        <div className="auth-brand" aria-label="Biblioverse home">Biblioverse</div>

        <div className="section-heading narrow auth-heading">
          <p className="eyebrow">Welcome back</p>
          <h2>Log in to Biblioverse</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              placeholder="you@example.com"
            />
            {errors.email && <p id="login-email-error" className="field-error">{errors.email}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              placeholder="Enter your password"
            />
            {errors.password && <p id="login-password-error" className="field-error">{errors.password}</p>}
          </div>

          {submitError && <p className="submit-error" role="alert">{submitError}</p>}

          <button type="submit" className="button button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Join Biblioverse</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
