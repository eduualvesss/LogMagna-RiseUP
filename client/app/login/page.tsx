import type { Metadata } from 'next';
import LoginForm from '../components/LoginForm';

export const metadata: Metadata = { title: 'Entrar | LogMagna' };

export default function Page() {
  return <LoginForm />;
}
