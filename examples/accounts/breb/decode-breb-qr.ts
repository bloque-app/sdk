import { SDK } from '../../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect(process.env.USER_HANDLE ?? 'demo-user');

const qrCodeData =
  process.env.BREB_QR_CODE_DATA ??
  '00020101021226330015CO.COM.VISI.LLA0210301334848649270015CO.COM.VISI.RED0104VISI520404125303170540810000.005802CO5914Merchant QYSRF6004Cali610610101062970103123021035035034560308sasc0193040412340503abc060400010702010802020905EMAIL1009205633311110340080290017CO.COM.VISI.CANAL0104MPOS81260016CO.COM.VISI.CIVA01020282290015CO.COM.VISI.IVA0106100.0083290016CO.COM.VISI.BASE0105100.084260016CO.COM.VISI.CINC01020285280015CO.COM.VISI.INC010510.0090350017CO.COM.VISI.TRXID0110P78569478491870015CO.COM.VISI.SEC0164474ba16e2433a928a69b7a6eb54efbabecba7c0aef862d39fca7b379d057ba1b63045B8F';

const decoded = await user.accounts.breb.decodeQr({
  qrCodeData,
});

console.log('BRE-B QR decode response:', { data: decoded.data, error: decoded.error });

if (decoded.error || !decoded.data) {
  throw new Error(decoded.error?.message ?? 'Failed to decode BRE-B QR');
}

console.log('BRE-B QR decoded:', {
  type: decoded.data.type,
  status: decoded.data.status,
  amount: decoded.data.amount,
  key: decoded.data.key,
  merchant: decoded.data.merchant,
  channel: decoded.data.channel,
  qrCodeReference: decoded.data.qrCodeReference,
  resolutionId: decoded.data.resolutionId,
  resolution: decoded.data.resolution,
});
