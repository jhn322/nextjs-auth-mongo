// Assuming utils and constants are in lib/auth/utils and lib/auth/constants
import { getEnvVar } from '@/lib/utils/env';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AUTH_MESSAGES, USER_ROLES } from '@/lib/auth/constants/auth';

/**
 * Provider-konfiguration för NextAuth
 */
export const configureProviders = () => [
  GoogleProvider({
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: USER_ROLES.USER, // Använd konstant
      };
    },
  }),
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Lösenord', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error(AUTH_MESSAGES.ERROR_MISSING_FIELDS);
      }

      // Convert email to lowercase before database lookup
      const lowerCaseEmail = credentials.email.toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: lowerCaseEmail }, // Use lowercased email for lookup
      });

      if (!user || !user.password) {
        // User not found (or OAuth user trying to login with credentials)
        console.warn(`Login attempt failed for ${lowerCaseEmail}: User not found or no password set.`);
        throw new Error('User not found'); // Keep error generic for security
      }

      // Validera lösenordet först
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        // Använd ett specifikt internt fel för att indikera fel lösenord
        throw new Error('Incorrect password');
      }

      // Kontrollera om användaren har verifierat sin e-post först efter att lösenordet validerats
      if (!user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      return user;
    },
  }),
];
