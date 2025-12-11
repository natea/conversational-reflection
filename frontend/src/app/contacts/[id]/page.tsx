import ContactDetailClient from './ContactDetailClient'

export const runtime = 'edge'

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ContactDetailClient params={params} />
}

