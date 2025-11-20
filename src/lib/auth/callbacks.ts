import { JWT } from 'next-auth/jwt';
import { Session, User, Account, Profile } from 'next-auth';
import prisma from '@/lib/prisma';
// Assuming constants are in lib/auth/constants/auth.ts
import { USER_ROLES } from '@/lib/auth/constants/auth';

//* Callback-konfiguration för NextAuth

export const configureCallbacks = () => ({
  /**
   ** Körs efter lyckad autentisering men innan session skapas.
   ** Används här för att automatiskt länka OAuth-konton till befintliga
   ** användare baserat på email.
   */
  async signIn({
    user,
    account,
  }: {
    user: User;
    account: Account | null;
    _profile?: Profile;
  }): Promise<boolean | string> {
    // Kör bara länkning för OAuth providers (inte credentials)
    if (account && account.provider !== 'credentials' && user.email) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        // Om användare finns men detta specifika OAuth-konto inte är länkat
        if (
          existingUser &&
          !existingUser.accounts.some(
            (acc) =>
              acc.provider === account.provider &&
              acc.providerAccountId === account.providerAccountId
          )
        ) {
          // Länka kontot
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              refresh_token: account.refresh_token,
              id_token: account.id_token,
              scope: account.scope,
              session_state: account.session_state,
              token_type: account.token_type,
            },
          });

          // Här kan man också uppdatera användarens namn/bild från OAuth-profilen om man vill
          // await prisma.user.update({ where: { id: existingUser.id }, data: { name: user.name, image: user.image } });
        }
      } catch (error) {
        console.error('AUTH: Error linking account in signIn callback:', error);
        // Returnera false eller en felsida vid oväntat fel under länkning?
        // För enkelhetens skull låter vi det gå vidare, men loggar felet.
        // return false;
      }
    }
    // Tillåt alltid inloggning att fortsätta om inga problem uppstod
    return true;
  },

  /**
   * JWT-callback körs varje gång en JWT skapas eller uppdateras
   */
  async jwt({
    token,
    user,
  }: {
    token: JWT;
    user?: User;
    _account?: Account | null;
  }) {
    if (user) {
      // Se till att token får rätt roll, speciellt efter kontolänkning
      // Hämta användaren från DB igen för att vara säker på att få rätt roll
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser) {
        token.role = dbUser.role;
      } else {
        // Fallback om användaren av någon anledning inte hittas
        token.role = USER_ROLES.USER; // Eller någon annan default/hantering
        console.error(
          `AUTH: User with id ${user.id} not found in JWT callback`
        );
      }
    }
    return token;
  },

  /**
   * Session-callback körs varje gång en session används eller uppdateras
   */
  async session({ session, token }: { session: Session; token: JWT }) {
    if (session.user && token.sub) {
      session.user.id = token.sub;
      if (token.role) {
        session.user.role = token.role as string;
      }
    }
    return session;
  },
});
