import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
// Assuming your constants file is correctly located relative to this script
// Adjust the import path as necessary if this script is moved or the constants file is elsewhere.
// For this example, I'm assuming a relative path. If your project setup allows for aliases like '@/',
// that would be preferable, but direct relative paths are more common in standalone scripts.
// This path assumes 'Postman' directory is at the root, and 'src' is also at the root.
import { API_AUTH_PATHS, API_APP_PATHS } from '../src/lib/constants/routes.js';
import { APP_NAME } from '../src/lib/constants/site.js'; // Import APP_NAME

// ---------- Konfiguration ----------
const BASE_URL_PLACEHOLDER = '{{baseUrl}}';
// Sanitize APP_NAME for filenames (e.g., remove spaces)
const APP_NAME_SANITIZED = APP_NAME.replace(/\s+/g, '');

const COLLECTION_NAME = `${APP_NAME} API`; // Use APP_NAME
const ENVIRONMENT_NAME = `${APP_NAME} Environment`; // Use APP_NAME

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const OUTPUT_DIR = dirname(__filename);

const OUTPUT_COLLECTION_FILENAME = path.join(
  OUTPUT_DIR,
  `${APP_NAME_SANITIZED}-API.postman_collection.json` // Use sanitized name
);
const OUTPUT_ENVIRONMENT_FILENAME = path.join(
  OUTPUT_DIR,
  `${APP_NAME_SANITIZED}-API.postman_environment.json` // Use sanitized name
);

// API struktur för Auth
const apiRoutes = [
  {
    name: 'NextAuth Core',
    description: 'Standard NextAuth.js endpoints',
    endpoints: [
      {
        name: 'Get CSRF Token',
        method: 'GET',
        path: '/api/auth/csrf',
        description:
          'Hämtar en CSRF-token som behövs för POST-förfrågningar (t.ex. inloggning, utloggning, registrering).\nKopiera värdet för `csrfToken` från svaret och klistra in det i Postman-miljövariabeln `csrfToken`.',
      },
      {
        name: 'Sign In (Credentials)',
        method: 'POST',
        path: '/api/auth/signin/credentials',
        description:
          'Loggar in en användare med e-post och lösenord. Kräver en giltig `csrfToken`. Sätter automatiskt cookies vid lyckad inloggning.',
        body: {
          email: '{{testUserEmail}}',
          password: '{{testUserPassword}}',
          csrfToken: '{{csrfToken}}',
          redirect: false, // Förhindra omdirigering, returnera JSON istället
          json: true, // Be om JSON-svar
        },
      },
      {
        name: 'Get Session',
        method: 'GET',
        path: '/api/auth/session',
        description:
          'Hämtar information om den aktuella användarsessionen (om inloggad via cookie).',
      },
      {
        name: 'Sign Out',
        method: 'POST',
        path: '/api/auth/signout',
        description:
          'Loggar ut den aktuella användaren. Kräver en giltig `csrfToken`. Tar bort sessionscookies.',
        body: {
          csrfToken: '{{csrfToken}}',
        },
      },
      {
        name: 'Initiate Google Sign In (Browser Only)',
        method: 'GET',
        path: '/api/auth/signin/google',
        description:
          'Denna URL används normalt i en webbläsare för att starta Google OAuth-flödet. Den kommer att omdirigera till Google. Kan inte testas fullt ut i Postman utan manuella steg.',
      },
    ],
  },
  {
    name: 'Custom Auth',
    description: 'Anpassade autentiserings-endpoints',
    endpoints: [
      {
        name: 'Register User',
        method: 'POST',
        path: API_AUTH_PATHS.REGISTER,
        description:
          'Registrerar en ny användare via din anpassade `/api/auth/register` slutpunkt. Kräver troligen `csrfToken`.',
        body: {
          // Anpassa fälten efter din registreringslogik
          name: 'Test User',
          email: 'new-test-user@example.com',
          password: 'password1234',
          csrfToken: '{{csrfToken}}', // Antagande: CSRF behövs
        },
      },
      {
        name: 'Verify User',
        method: 'POST', // Eller GET? Anpassa efter din implementation
        path: API_AUTH_PATHS.VERIFY_EMAIL,
        description:
          'Verifierar en användare via din anpassade `/api/auth/verify` slutpunkt. Anpassa body och metod efter behov. Kräver troligen `csrfToken`.',
        body: {
          token: 'VERIFICATION_TOKEN_FROM_EMAIL_OR_LINK', // Anpassa detta fält
          csrfToken: '{{csrfToken}}', // Antagande: CSRF behövs
        },
      },
    ],
  },
  {
    name: 'Contacts API',
    description: 'Endpoints for managing user contacts',
    endpoints: [
      {
        name: 'List Contacts',
        method: 'GET',
        path: API_APP_PATHS.CONTACTS_BASE,
        description:
          'Hämtar alla kontakter för den inloggade användaren. Kräver giltig session (cookie).',
      },
      {
        name: 'Create Contact',
        method: 'POST',
        path: API_APP_PATHS.CONTACTS_BASE,
        description:
          'Skapar en ny kontakt för den inloggade användaren. Kräver giltig session (cookie). CSRF-token behövs troligen ej här då det inte är en traditionell formulärpost mot /api/auth, men skadar inte att ha med om servern kräver det för alla POST.',
        body: {
          firstName: 'Test',
          lastName: 'Contactsson',
          email: 'test.contact@example.com',
          phone: '123-456789', // Optional
        },
      },
      {
        name: 'Get Contact by ID',
        method: 'GET',
        path: `${API_APP_PATHS.CONTACTS_BASE}/{{testContactId}}`,
        description:
          'Hämtar en specifik kontakt med ID. Kräver giltig session (cookie). Ange ett giltigt kontakt-ID i miljövariabeln `testContactId`.',
      },
      {
        name: 'Update Contact',
        method: 'PUT',
        path: `${API_APP_PATHS.CONTACTS_BASE}/{{testContactId}}`,
        description:
          'Uppdaterar en specifik kontakt med ID. Kräver giltig session (cookie). Ange ett giltigt kontakt-ID i `testContactId`. Skickar endast med de fält som ska uppdateras.',
        body: {
          // Exempel: Uppdatera endast telefon och typ
          phone: '987-654321',
          type: 'CUSTOMER', // LEAD, CUSTOMER, AMBASSADOR
        },
      },
      {
        name: 'Delete Contact',
        method: 'DELETE',
        path: `${API_APP_PATHS.CONTACTS_BASE}/{{testContactId}}`,
        description:
          'Tar bort en specifik kontakt med ID. Kräver giltig session (cookie). Ange ett giltigt kontakt-ID i `testContactId`.',
      },
    ],
  },
];

// Skapa Postman collection
const collection = {
  info: {
    name: COLLECTION_NAME,
    description: `Postman collection för ${APP_NAME} API`, // Use APP_NAME
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [],
};

// Skapa miljövariabler
const environment = {
  name: ENVIRONMENT_NAME,
  values: [
    {
      key: 'baseUrl',
      value: 'http://localhost:3000', // Standard för utveckling
      type: 'default',
      enabled: true,
    },
    {
      key: 'csrfToken',
      value: '', // Fylls i manuellt efter anrop till /api/auth/csrf
      type: 'secret', // Markera som secret för säkerhet
      enabled: true,
    },
    {
      key: 'testUserEmail',
      value: 'test@example.com', // Byt till en giltig testanvändare
      type: 'default',
      enabled: true,
    },
    {
      key: 'testUserPassword',
      value: 'password123', // Byt till lösenordet för testanvändaren
      type: 'secret',
      enabled: true,
    },
    {
      key: 'testContactId',
      value: '', // Fyll i manuellt med ID för en befintlig kontakt för GET/PUT/DELETE tester
      type: 'default',
      enabled: true,
    },
  ],
};

// Funktion för att skapa en request-struktur (förenklad)
function createRequestItem(endpoint) {
  const urlPath = endpoint.path;
  const rawUrl = `${BASE_URL_PLACEHOLDER}${urlPath}`;
  const pathSegments = urlPath.replace(/^\/|\/$/g, '').split('/');

  const item = {
    name: endpoint.name,
    request: {
      method: endpoint.method,
      header: [],
      description: endpoint.description || '',
      url: {
        raw: rawUrl,
        host: [BASE_URL_PLACEHOLDER],
        path: pathSegments,
      },
    },
    response: [], // Tom array för svar
  };

  // Lägg till request body om det finns
  if (endpoint.body) {
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
    });
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(endpoint.body, null, 2), // Formattera JSON
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  // Lägg till event för CSRF-token hämtning
  if (endpoint.path === '/api/auth/csrf') {
    item.event = [
      {
        listen: 'test',
        script: {
          exec: [
            'try {',
            '    const jsonData = pm.response.json();',
            '    if (jsonData.csrfToken) {',
            '        pm.environment.set("csrfToken", jsonData.csrfToken);',
            '        console.log("CSRF Token set in environment:", jsonData.csrfToken);',
            '    } else {',
            '        console.warn("CSRF token not found in response JSON.");',
            '    }',
            '} catch (e) {',
            '    console.error("Failed to parse JSON or set CSRF token:", e);',
            '}',
            '',
          ],
          type: 'text/javascript',
        },
      },
    ];
  }

  return item;
}

// Instruktioner för autentisering
const authInstructions = {
  name: 'Authentication Instructions (Cookie Method)',
  request: {
    method: 'GET', // Ingen faktisk request, bara information
    url: { raw: '' }, // Tom URL
    description: `# NextAuth.js Autentisering i Postman

NextAuth.js använder **cookie-baserad autentisering**. För att testa endpoints som kräver inloggning i Postman:

1.  **Hämta CSRF Token:** Kör \`GET /api/auth/csrf\` först. Detta sätter \`csrfToken\` i din miljö automatiskt (via Test-skriptet).
2.  **Logga in:** Kör \`POST /api/auth/signin/credentials\` med dina testanvändaruppgifter (från miljön). Om lyckat, kommer NextAuth.js att returnera sessionscookies som Postman **automatiskt sparar och skickar med** i framtida requests till samma domän (\`{{baseUrl}}\`).
3.  **Verifiera Session:** Kör \`GET /api/auth/session\` för att se om du är inloggad och se sessionsdata.
4.  **Testa skyddade endpoints:** Nu kan du anropa andra API-endpoints som kräver inloggning. Postman skickar med cookien automatiskt.
5.  **Logga ut:** Kör \`POST /api/auth/signout\` (med giltig \`csrfToken\`) för att ta bort cookien.

**Viktigt:**
* Se till att din \`{{baseUrl}}\` i Postman-miljön matchar den URL din Next.js-app körs på.
* Postman hanterar cookies per domän.
* Google Sign-In kan inte slutföras helt inom Postman på grund av webbläsaromdirigeringar.
`,
  },
};

// Lägg till instruktioner först
collection.item.push({
  name: 'README - Authentication',
  item: [authInstructions],
  description:
    'Viktig information om hur autentisering fungerar i Postman med detta API.',
});

// Lägg till alla API-grupper och endpoints
apiRoutes.forEach((group) => {
  const folderItem = {
    name: group.name,
    description: group.description,
    item: [],
  };

  group.endpoints.forEach((endpoint) => {
    folderItem.item.push(createRequestItem(endpoint));
  });

  collection.item.push(folderItem);
});

// Spara collection och environment som JSON-filer
try {
  fs.writeFileSync(
    OUTPUT_COLLECTION_FILENAME,
    JSON.stringify(collection, null, 2) // Indentera för läsbarhet
  );
  console.log(
    `✅ Postman collection saved to ${path.basename(OUTPUT_COLLECTION_FILENAME)}`
  ); // Use dynamic filename

  fs.writeFileSync(
    OUTPUT_ENVIRONMENT_FILENAME,
    JSON.stringify(environment, null, 2) // Indentera för läsbarhet
  );
  console.log(
    `✅ Postman environment saved to ${path.basename(OUTPUT_ENVIRONMENT_FILENAME)}`
  ); // Use dynamic filename

  console.log('\nNästa steg:');
  console.log(
    `1. Importera ${path.basename(OUTPUT_COLLECTION_FILENAME)} och ${path.basename(OUTPUT_ENVIRONMENT_FILENAME)} i Postman.`
  );
  console.log('2. Välj den importerade miljön (uppe till höger).');
  console.log(
    '3. Följ instruktionerna i "README - Authentication" för att logga in och testa.'
  );
} catch (error) {
  console.error('❌ Error writing Postman files:', error);
}
