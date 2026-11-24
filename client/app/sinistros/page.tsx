import { Layout } from '../screens';
import SinistrosPanel from '../components/SinistrosPanel';

export default function Page() {
  return (
    <Layout title="Sinistros e ocorrências">
      <SinistrosPanel />
    </Layout>
  );
}
