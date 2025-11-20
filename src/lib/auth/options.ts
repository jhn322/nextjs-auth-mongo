import { NextAuthOptions } from 'next-auth';
import { Adapter } from 'next-auth/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
// Update import paths to reflect the new location
import { configureProviders } from './providers';
import { configureCallbacks } from './callbacks';
// Import USER_ROLES from auth constants and AUTH_PATHS from the new routes constants
import { USER_ROLES } from '@/lib/auth/constants/auth';
import { AUTH_PATHS } from '@/lib/constants/routes';

/**
 * Huvudkonfiguration för NextAuth
 */
export const authOptions: NextAuthOptions = {
  // Adapter för att koppla NextAuth till Prisma
  adapter: PrismaAdapter(prisma) as Adapter,

  // Providers för olika inloggningsmetoder
  providers: configureProviders(),

  // Session-hantering
  session: {
    strategy: 'jwt',
  },

  // Anpassade sidor
  pages: {
    signIn: AUTH_PATHS.LOGIN,
    error: AUTH_PATHS.AUTH_ERROR,
    // signOut: AUTH_PATHS.LOGOUT, // Optional: if you have a custom signout page
    // verifyRequest: AUTH_PATHS.VERIFY_EMAIL_REQUEST, // Optional: for email verification request page
    // newUser: AUTH_PATHS.REGISTER, // Optional: if you want to redirect new users to register or a welcome page
  },

  // Callbacks för att anpassa JWT och session
  callbacks: configureCallbacks(),

  // Händelser för autentisering
  events: {
    /**
     * Hanterar användarinloggning specifikt för Google-autentisering
     * - Om användaren finns: Uppdaterar namn och profilbild
     * - Om ny användare: Skapar konto med USER-roll
     * Detta säkerställer att databasen hålls synkroniserad med Google-profildata
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Uppdatera eller skapa användare med rätt roll
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
          },
          create: {
            email: user.email!,
            name: user.name!,
            image: user.image,
            role: USER_ROLES.USER,
            emailVerified: new Date(),
          },
        });
      }
    },
  },

  // Aktivera debugging i utvecklingsmiljö
  debug: process.env.NODE_ENV === 'development',
};
