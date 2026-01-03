/**
 * Public types for @bloque/sdk-orgs
 * Re-exports internal wire types for backward compatibility
 */

// Re-export wire types (internal - for SDK use only)
export type {
  CreateOrgParams,
  CreateOrgResponse,
  Organization,
  OrgProfile,
  OrgStatus,
  OrgType,
  Place,
} from './internal/wire-types';
