import { PrismaClient, ContactType } from '@/generated/prisma';
import { faker } from '@faker-js/faker';
import { parseArgs } from 'node:util'; // Re-import argument parser

const prisma = new PrismaClient();
// Remove readline interface creation
// const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Define a list of example country codes
const countryCodes = ['+46', '+47', '+45', '+358', '+49', '+44', '+1'];

// * ==========================================================================
// *                            DATABASE SEED SCRIPT
// * ==========================================================================

async function main() {
  // ** Parse Command Line Arguments ** //
  const options = {
    email: { type: 'string' },
  } as const; // Define expected argument

  const { values: args } = parseArgs({ options, allowPositionals: false });

  if (!args.email) {
    console.error('❌ Missing required argument: --email=<user_email>');
    console.error('   Example: npm run db:seed -- --email=test@example.com');
    process.exit(1);
  }

  const targetUserEmail = args.email.toLowerCase();
  console.log(`🌱 Starting seed process for user: ${targetUserEmail}...`);

  // ** Find Existing User ** //
  console.log(`🔍 Looking for user ${targetUserEmail}...`);
  const user = await prisma.user.findUnique({
    where: { email: targetUserEmail },
    select: { id: true }, // Only need the ID
  });

  if (!user) {
    console.error(
      `❌ User with email ${targetUserEmail} not found. Please create the user first.`
    );
    process.exit(1);
  }
  console.log(`   Found user with ID: ${user.id}`);

  // ** Configuration ** //
  const numberOfContacts = 50;
  const seedDomain = '@seed.faker'; // Define the domain for seeded emails

  // ** Cleanup Old Seeded Data ** //
  console.log(
    `🧹 Cleaning up old seeded contacts (ending with ${seedDomain}) for user ${targetUserEmail}...`
  );
  await prisma.contact.deleteMany({
    where: {
      userId: user.id,
      email: {
        endsWith: seedDomain, // Only delete contacts with the seed domain
      },
    },
  });
  console.log(`   Deleted old seeded contacts for user ID: ${user.id}`);

  // ** Generate Mock Contact Data ** //
  console.log(
    `📝 Generating ${numberOfContacts} mock contacts with domain ${seedDomain}...`
  );
  const contactsData = [];
  for (let i = 0; i < numberOfContacts; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Construct email with the specific seed domain
    const email = `${faker.lorem
      .word()
      .toLowerCase()}_${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${seedDomain}`;

    contactsData.push({
      userId: user.id, // Use the found user ID
      firstName: firstName,
      lastName: lastName,
      email: email,
      // Generate phone number with a random country code from the list
      phone: faker.helpers.maybe(() => {
        const countryCode = faker.helpers.arrayElement(countryCodes);
        // Adjust length slightly based on typical number lengths, or keep fixed
        const numberPart = faker.string.numeric({ length: 9, allowLeadingZeros: false });
        return `${countryCode}${numberPart}`;
      }, { probability: 0.5 }), // 50% chance
      type: faker.helpers.arrayElement([
        ContactType.LEAD,
        ContactType.CUSTOMER,
        ContactType.AMBASSADOR,
      ]),
      // Add a createdAt date from the past year
      createdAt: faker.date.past({ years: 1 }),
      // updatedAt will be set automatically by Prisma
    });
  }

  // ** Create Contacts in Bulk ** //
  console.log(`🚀 Creating ${contactsData.length} contacts in database...`);
  const result = await prisma.contact.createMany({
    data: contactsData,
  });

  console.log(`   Successfully created ${result.count} contacts.`);
  console.log(`✅ Seed process finished.`);
}

// ** Execute Seed Script ** //
main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma Client connection
    await prisma.$disconnect();
    console.log('🔌 Prisma Client disconnected.');
  }); 