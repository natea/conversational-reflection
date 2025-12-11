import ContactDetailClient from './ContactDetailClient'

// Required for static export
export async function generateStaticParams() {
  return [] // Return empty array for now - contacts will be client-side only
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ContactDetailClient params={params} />
}

