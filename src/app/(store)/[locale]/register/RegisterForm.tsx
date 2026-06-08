'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCustomer } from '@/lib/useCustomer';
import styles from './register.module.css';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register } = useCustomer();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError(t('errorNameRequired'));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errorInvalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('errorPasswordShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);
    const result = await register({ email: email.trim(), name: name.trim(), phone: phone.trim() || undefined, password });
    setSubmitting(false);

    if (result.ok) {
      router.push('/');
    } else {
      if (result.error?.includes('already registered')) {
        setError(t('errorEmailTaken'));
      } else {
        setError(result.error ?? 'Registration failed');
      }
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </svg>
        </div>

        <h1 className={styles.title}>{t('register')}</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            <span className={styles.labelText}>{t('name')}</span>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>{t('email')}</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>{t('phone')}</span>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 170 1234567"
              autoComplete="tel"
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>{t('password')}</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>{t('confirmPassword')}</span>
            <input
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? '...' : t('register')}
          </button>
        </form>

        <p className={styles.switchLink}>
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className={styles.link}>
            {t('loginHere')}
          </Link>
        </p>
      </div>
    </main>
  );
}
