
import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT, jwtVerify, generateKeyPair } from 'jose';

let keypairPromise: Promise<{ publicJwk: JsonWebKey; privateJwk: JsonWebKey }> | null = null;

async function getKeys() {
  if (!keypairPromise) {
    keypairPromise = (async () => {
      const { publicKey, privateKey } = await generateKeyPair('ES256');
      const publicJwk = await crypto.subtle.exportKey('jwk', publicKey);
      const privateJwk = await crypto.subtle.exportKey('jwk', privateKey);
      return { publicJwk, privateJwk };
    })();
  }
  return keypairPromise;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { vin, serviceHash, technicianDid } = req.body as { vin: string; serviceHash: string; technicianDid: string };
  const { privateJwk, publicJwk } = await getKeys();

  const now = Math.floor(Date.now() / 1000);
  const vcPayload = {
    iss: 'did:web:cartelworx.example',
    sub: `did:vehicle:${vin}`,
    nbf: now,
    iat: now,
    vc: {
      type: ['VerifiableCredential', 'ServiceEventCredential'],
      credentialSubject: {
        id: `did:vehicle:${vin}`,
        serviceHash,
        technician: technicianDid,
      }
    }
  };

  const token = await new SignJWT(vcPayload)
    .setProtectedHeader({ alg: 'ES256', kid: 'cartelworx-service-key-1' })
    .sign(await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']));

  return res.status(200).json({ vcJwt: token, publicJwk });
}
