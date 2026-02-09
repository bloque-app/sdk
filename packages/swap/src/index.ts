// Common types — exported from bank-transfer as the canonical source

export { BankTransferClient } from './bank-transfer/bank-transfer-client';
export type {
  BankAccountType,
  BankDepositInformation,
  CreateBankTransferOrderParams,
  CreateBankTransferOrderResult,
  ExecutionHow,
  ExecutionResult,
  IdentificationType,
  KusamaAccountArgs,
  OrderType,
  SupportedBank,
  SwapOrder,
} from './bank-transfer/types';
export { PseClient } from './pse/pse-client';
// PSE — only unique types
export type {
  Bank,
  CreatePseOrderParams,
  CreatePseOrderResult,
  DepositInformation,
  ListBanksResult,
  PseCustomerData,
  PsePaymentArgs,
} from './pse/types';

// Swap client + top-level types
export { SwapClient } from './swap-client';
export type {
  Fee,
  FeeComponent,
  FeeComponentType,
  FindRatesParams,
  FindRatesResult,
  RateLimits,
  RateTuple,
  SwapRate,
} from './types';
