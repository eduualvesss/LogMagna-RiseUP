import type { Metadata } from 'next';
import CadastroForm from '../components/CadastroForm';

export const metadata: Metadata = { title: 'Criar cadastro | LogMagna' };

export default function Page() {
  return <CadastroForm />;
}
