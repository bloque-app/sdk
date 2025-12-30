import type {
  BusinessRegisterParams,
  IndividualRegisterParams,
} from './origins/types';

export type CreateIdentityParams = (
  | Pick<IndividualRegisterParams, 'extraContext' | 'type' | 'profile'>
  | Pick<BusinessRegisterParams, 'extraContext' | 'type' | 'profile'>
) & {
  alias: string;
};
