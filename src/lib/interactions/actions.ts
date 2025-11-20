'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/utils/session';
import { revalidatePath } from 'next/cache';
import { PROTECTED_PATHS } from '@/lib/constants/routes';

// **  Mark Contact as Viewed  ** //
export async function markContactAsViewed(contactId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      console.error(
        '[InteractionAction] User not authenticated to mark contact as viewed.'
      );
      return { success: false, message: 'Användaren är inte autentiserad.' };
    }
    const userId = session.user.id;

    if (!contactId) {
      console.warn(
        '[InteractionAction] contactId is required to mark as viewed.'
      );
      return { success: false, message: 'Kontakt-ID saknas.' };
    }

    await prisma.contactInteraction.upsert({
      where: {
        userId_contactId: {
          userId: userId,
          contactId: contactId,
        },
      },
      create: {
        userId: userId,
        contactId: contactId,
      },
      update: {},
    });

    revalidatePath(PROTECTED_PATHS.SETTINGS_BASE);

    return { success: true };
  } catch (error) {
    console.error(
      '[InteractionAction] Error marking contact as viewed:',
      error
    );
    return {
      success: false,
      message: 'Kunde inte markera kontakten som sedd. Försök igen.',
    };
  }
}
