import { redirect } from 'next/navigation';

export default function TaxesIndexPage() {
  redirect('/taxes/overview');
}
