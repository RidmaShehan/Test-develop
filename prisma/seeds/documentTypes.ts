import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DOCUMENT_TYPES = [
  // IDENTITY
  { name: 'National Identity Card', code: 'NIC', category: 'IDENTITY', description: 'Front and back of NIC', isRequired: true, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: false },
  { name: 'Passport', code: 'PASSPORT', category: 'IDENTITY', description: 'Bio-data page of valid passport', isRequired: false, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: true },
  { name: 'Birth Certificate', code: 'BIRTH_CERT', category: 'IDENTITY', isRequired: true, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: false },
  // ACADEMIC
  { name: 'O/L Certificate', code: 'OL_CERT', category: 'ACADEMIC', description: 'Ordinary Level examination results', isRequired: true, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 10, hasExpiry: false },
  { name: 'A/L Certificate', code: 'AL_CERT', category: 'ACADEMIC', description: 'Advanced Level examination results', isRequired: false, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 10, hasExpiry: false },
  { name: 'Degree Certificate', code: 'DEGREE', category: 'ACADEMIC', description: "Bachelor's degree or equivalent", isRequired: false, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 10, hasExpiry: false },
  { name: 'Academic Transcript', code: 'TRANSCRIPT', category: 'ACADEMIC', isRequired: false, acceptedFormats: 'pdf', maxSizeMb: 10, hasExpiry: false },
  // FINANCIAL
  { name: 'Registration Payment Receipt', code: 'REG_RECEIPT', category: 'FINANCIAL', isRequired: true, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: false },
  { name: 'Bank Deposit Slip', code: 'BANK_SLIP', category: 'FINANCIAL', isRequired: false, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: false },
  // PROGRAM
  { name: 'Offer Letter', code: 'OFFER_LETTER', category: 'PROGRAM', description: 'Offer letter issued by the institution', isRequired: false, acceptedFormats: 'pdf', maxSizeMb: 5, hasExpiry: false },
  { name: 'Acceptance Letter', code: 'ACCEPT_LETTER', category: 'PROGRAM', description: "Student's signed acceptance", isRequired: false, acceptedFormats: 'pdf,jpg,jpeg,png', maxSizeMb: 5, hasExpiry: false },
  // OTHER
  { name: 'Recommendation Letter', code: 'RECOMMENDATION', category: 'OTHER', isRequired: false, acceptedFormats: 'pdf', maxSizeMb: 5, hasExpiry: false },
] as const

export async function seedDocumentTypes() {
  console.log('🌱 Seeding document types...')
  for (const dt of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: dt.code },
      update: { name: dt.name, description: (dt as any).description },
      create: {
        name: dt.name,
        code: dt.code,
        category: dt.category as any,
        description: (dt as any).description,
        isRequired: dt.isRequired,
        acceptedFormats: dt.acceptedFormats,
        maxSizeMb: dt.maxSizeMb,
        hasExpiry: dt.hasExpiry,
      },
    })
  }
  console.log(`✅ ${DOCUMENT_TYPES.length} document types seeded`)
}

// Run directly
seedDocumentTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
