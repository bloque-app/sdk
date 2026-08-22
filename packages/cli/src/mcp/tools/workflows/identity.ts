import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';

export function registerIdentityWorkflows(server: McpServer, clients: BloqueClients) {
  server.registerTool(
    'get_profile',
    {
      description:
        "Get the authenticated user's identity profile and verification status. Returns name, email, phone, legal ID, address, and KYC status (approved/awaiting/rejected). Use this as the first call to understand who the user is, check if they can create cards (requires KYC approval), and to auto-fill forms like PSE top-ups. If KYC is not approved, tell the user to run verify_identity first.",
    },
    async () => {
      const me = await clients.identity.me();
      let kyc: any = {};
      try {
        kyc = await clients.compliance.kyc.getVerification({ urn: me.urn });
      } catch {
        kyc = { status: 'unknown' };
      }
      // Fields below are only present on individual profiles — business/dao/
      // proxy/other identities carry a differently shaped profile.
      const meProfile = me.profile as Record<string, unknown>;
      const profile = {
        urn: me.urn,
        firstName: meProfile.first_name,
        lastName: meProfile.last_name,
        email: meProfile.email,
        phone: meProfile.phone,
        legalIdType: meProfile.personal_id_type,
        legalIdNumber: meProfile.personal_id_number,
        address: {
          line1: meProfile.address_line1,
          line2: meProfile.address_line2,
          city: meProfile.city,
          state: meProfile.state,
          postalCode: meProfile.postal_code,
          country: meProfile.country_of_residence_code,
        },
        birthdate: meProfile.birthdate,
        kycStatus: kyc.status ?? 'unknown',
        canCreateCards: kyc.status === 'approved',
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
      };
    },
  );

  server.registerTool(
    'verify_identity',
    {
      description:
        'Start or check identity verification (KYC). If the user has not started verification, initiates it and returns a URL to complete the process. The user MUST complete KYC before they can create cards. Call get_profile to check status afterward.',
    },
    async () => {
      const me = await clients.identity.me();
      let kyc: any = {};
      try {
        kyc = await clients.compliance.kyc.getVerification({ urn: me.urn });
      } catch {
        // No existing verification record — will attempt startVerification below
      }

      if (kyc.status === 'approved') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'approved', completedAt: kyc.completedAt }, null, 2),
            },
          ],
        };
      }

      let result: any = kyc;
      try {
        result = await clients.compliance.kyc.startVerification({ urn: me.urn });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Unknown error starting verification';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'error',
                  error: message,
                  hint: 'Ensure your profile has a complete address, valid ID, and birthdate. Use get_profile to check.',
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { status: result.status, verificationUrl: result.url, completedAt: result.completedAt },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
