import { SDK } from '../packages/sdk/src/index.ts';

const bloque = new SDK({
  origin: 'bloque-root',
  auth: {
    type: 'apiKey',
    apiKey:
      '{api-key-here}',
  },
  mode: 'sandbox',
});

async function setup() {
  const session = await bloque.register('@david', {
    type: 'individual',
    profile: {
      firstName: 'David',
      lastName: 'Barinas',
      email: 'david@bloque.team',
      phone: '+573124581131',
      addressLine1: 'AV 1 # 33 - 40',
      city: 'Tunja',
      state: 'Boyaca',
      postalCode: '150001',
      countryOfResidenceCode: 'COL',
      countryOfBirthCode: 'COL',
      birthdate: '1990-01-30',
      personalIdType: 'CC',
      personalIdNumber: '1055228746',
    },
  });

  const bancolombia_escrow = await session.accounts.bancolombia.create(
    {},
    { waitLedger: true },
  );

  console.log('bancolombia_pocket', bancolombia_escrow.referenceCode);
  console.log('Bancolombia pocket ledger_id', bancolombia_escrow.ledgerId);
  console.timeEnd('setup');
  // console.log('card', card.urn);
  // console.log('card_url_details', card.detailsUrl);
  // console.log('ledger_account_id', card.ledgerId);
}

setup();

Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6YmxvcXVlOmJsb3F1ZS1yb290OkBkYXZpZCIsImlzcyI6Imp3dC1wcm92aWRlciIsImtpbmQiOiJ1c2VyIiwic2NvcGVzIjpbImlkZW50aXR5LnJlYWQuc2VsZiIsImlkZW50aXR5LndyaXRlLnNlbGYiLCJpZGVudGl0eS51cGRhdGUuc2VsZiIsImFsaWFzLnJlYWQuc2VsZiIsImFsaWFzLndyaXRlLnNlbGYiLCJvcmdzLndyaXRlLnNlbGYiLCJvcmdzLmNyZWF0ZSIsIm9yZ3MucmVhZC5zZWxmIiwiaW52aXRlLmFjY2VwdCIsIm1lZGl1bXMucmVhZCIsIm1lZGl1bXMud3JpdGUuc2VsZiIsImFjY291bnRzLnJlYWQuc2VsZiIsImFjY291bnRzLnRva2VuaXplLnNlbGYiLCJhY2NvdW50cy50cmFuc2Zlci5zZWxmIiwiY2hhdC53cml0ZSIsImNoYXQucmVhZCIsImFnZW50LnJlYWQiLCJhZ2VudC53cml0ZSIsImZpbGUud3JpdGUiLCJmaWxlLnJlYWQiLCJzaWduZXIuZ2V0LnNlbGYiLCJzaWduZXIucmVnaXN0ZXIuc2VsZiIsInNpZ25lci5saXN0LnNlbGYiLCJjb21wbGlhbmNlLnJlYWQiLCJjb21wbGlhbmNlLndyaXRlIiwiY29tcGxpYW5jZS5zdGFydF92ZXJpZmljYXRpb24iLCJhY2NvdW50cy5saXN0X3RyYW5zYWN0aW9ucyIsImFjY291bnRzLmJhbGFuY2UiLCJhY2NvdW50cy5iYXRjaCIsInBheW1lbnRzLndyaXRlLnNlbGYiLCJwYXltZW50cy53cml0ZSIsInBheW1lbnRzLnJlYWQuc2VsZiIsInBheW1lbnRzLnJlYWQiLCJzd2FwLnRha2UiLCJzd2FwLmZpbmRfcmF0ZSIsInN3YXAucmVhZCIsInN3YXAud3JpdGUiLCJncmFwaC50ZW1wbGF0ZS5nZW5lcmF0ZSIsImFwaS1rZXkuY3JlYXRlIiwiYXBpLWtleS5saXN0Il0sInJvbGVzIjpbInVzZXIiXSwiaWF0IjoxNzY5NzgzMTk3LCJleHAiOjE3Njk4MjYzOTd9.UMYZn-wbDmT0Kaka5ez2ptB03AN-NCNNEAOEH7fRqWQ

{
  "taker_urn": "did:bloque:bloque-root:@david",
  "type": "src",
  "rate_sig": "6fd236d0edf3b78ad5352b3d94b9bbd4f7631d6acff0d3a3fa63f3178ce6eee3",
  "from_medium": "pse",
  "to_medium": "kusama",
  "amount_src": "100000000",
  "args": {
    "bank_code": "1",
    "user_type": 0,
    "customer_email": "david@bloque.team",
    "user_legal_id_type": "CC",
    "user_legal_id": "1055228746",
    "customer_data": {
      "full_name": "david barinas"
    }
  },
  "deposit_information": {
    "urn": "did:bloque:account:virtual:634a49ee-3fa0-46c4-acee-089fe902c9b2"
  }
}

