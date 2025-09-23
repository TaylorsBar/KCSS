
import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, PrivateKey, AccountId, TopicCreateTransaction, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { ethers } from 'ethers';

const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID as string;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY as string;
const POLYGON_RPC = process.env.POLYGON_RPC as string;
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY as string;

// Minimal anchor contract ABI: function anchor(bytes32 hash)
const ANCHOR_CONTRACT = process.env.ANCHOR_CONTRACT as string;
const ANCHOR_ABI = ["function anchor(bytes32 hash) external"];

let topicId: string | null = process.env.HEDERA_TOPIC_ID || null;

async function ensureTopic(client: Client): Promise<string> {
  if (topicId) return topicId;
  const tx = await new TopicCreateTransaction().execute(client);
  const receipt = await tx.getReceipt(client);
  topicId = receipt.topicId?.toString() || '';
  return topicId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { hash, payload } = req.body as { hash: string; payload: string };
  if (!hash) return res.status(400).json({ error: 'Missing hash' });

  // Hedera
  const client = Client.forMainnet().setOperator(AccountId.fromString(HEDERA_OPERATOR_ID), PrivateKey.fromString(HEDERA_OPERATOR_KEY));
  const tid = await ensureTopic(client);
  await new TopicMessageSubmitTransaction({ topicId: tid, message: hash }).execute(client);

  // Polygon anchor
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
  const wallet = new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(ANCHOR_CONTRACT, ANCHOR_ABI, wallet);
  const tx = await contract.anchor(hash);
  const receipt = await tx.wait();

  return res.status(200).json({ hederaTopicId: tid, polygonTx: receipt.transactionHash });
}