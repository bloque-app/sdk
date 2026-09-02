// Common types — exported from bank-transfer as the canonical source

export { BankTransferClient } from './bank-transfer/bank-transfer-client';
export type {
  BankAccountType,
  BankDepositInformation,
  CreateBankTransferOrderOptions,
  CreateBankTransferOrderParams,
  CreateBankTransferOrderResult,
  ExecutionCallbackArg,
  ExecutionHow,
  ExecutionHowBrebDeposit,
  ExecutionHowCallback,
  ExecutionHowIframe,
  ExecutionHowRedirect,
  ExecutionResult,
  IdentificationType,
  KusamaAccountArgs,
  OrderType,
  SupportedBank,
  SwapOrder,
} from './bank-transfer/types';
export { BrebClient } from './breb/breb-client';
export type {
  BrebDepositInformation,
  BrebDepositOnRampInformation,
  BrebDestinationKey,
  BrebSwapArgs,
  CreateBrebDepositOptions,
  CreateBrebDepositParams,
  CreateBrebDepositResult,
  CreateBrebOrderOptions,
  CreateBrebOrderParams,
  CreateBrebOrderResult,
} from './breb/types';
export { ExternalUsBankSwapClient } from './external-us-bank/external-us-bank-client';
export type {
  CreateExternalUsBankBaseOrderParams,
  CreateExternalUsBankKusamaOrderParams,
  CreateExternalUsBankOrderOptions,
  CreateExternalUsBankOrderParams,
  CreateExternalUsBankOrderResult,
  ExternalUsBankArgs,
  ExternalUsBankBaseDepositInformation,
  ExternalUsBankDepositInformation,
  ExternalUsBankDestination,
} from './external-us-bank/types';
export { PseClient } from './pse/pse-client';
// PSE — only unique types
export type {
  Bank,
  CreatePseOrderOptions,
  CreatePseOrderParams,
  CreatePseOrderResult,
  DepositInformation,
  ListBanksResult,
  PseCustomerData,
  PsePaymentArgs,
} from './pse/types';
export { RtpClient } from './rtp/rtp-client';
export type {
  CreateRtpBaseOrderParams,
  CreateRtpKusamaOrderParams,
  CreateRtpOrderOptions,
  CreateRtpOrderParams,
  CreateRtpOrderResult,
  RtpDepositInformation,
  RtpSourceMedium,
  RtpSwapArgs,
} from './rtp/types';

// Swap client + top-level types
export { SwapClient } from './swap-client';
export type {
  Fee,
  FeeComponent,
  FeeComponentType,
  FindRatesParams,
  FindRatesResult,
  ListOrdersParams,
  ListOrdersResult,
  OrderStatus,
  RateLimits,
  RateTuple,
  SwapRate,
} from './types';
