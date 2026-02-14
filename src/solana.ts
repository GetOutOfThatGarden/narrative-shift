import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

export interface NarrativeRecord {
  score: number;
  platform: string;
  alternative: string;
  timestamp: string;
}

export class SolanaStorage {
  private connection: Connection;
  private keypair: Keypair;
  private programId: PublicKey;

  constructor() {
    // Connect to devnet
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load or create keypair
    const keypairPath = path.join(process.cwd(), 'narrative-shift-keypair.json');
    
    if (fs.existsSync(keypairPath)) {
      const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      this.keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
    } else {
      this.keypair = Keypair.generate();
      fs.writeFileSync(keypairPath, JSON.stringify(Array.from(this.keypair.secretKey)));
      console.log('New keypair created:', this.keypair.publicKey.toBase58());
    }
    
    // For MVP, we'll use a simplified storage approach
    // In production, this would interact with a deployed Anchor program
    this.programId = new PublicKey('11111111111111111111111111111111'); // System program placeholder
  }

  async storeNarrative(record: NarrativeRecord): Promise<string> {
    // In a full implementation, this would:
    // 1. Serialize the record
    // 2. Create a transaction to store it in a PDA
    // 3. Send and confirm the transaction
    
    // For MVP, we'll simulate with a simple memo transaction
    const memo = JSON.stringify({
      type: 'narrative_record',
      ...record
    });
    
    // Create a simple transaction (in real impl, would call program)
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: this.keypair.publicKey,
        lamports: 1000 // Tiny amount for memo
      })
    );
    
    // In real implementation, this would be an actual program call
    // For now, return a mock signature
    const mockSignature = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store locally for demo
    this.storeLocally(record, mockSignature);
    
    return mockSignature;
  }

  private storeLocally(record: NarrativeRecord, signature: string): void {
    const dataPath = path.join(process.cwd(), 'narrative-data.json');
    
    let data: any[] = [];
    if (fs.existsSync(dataPath)) {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    
    data.push({
      ...record,
      signature,
      storedAt: new Date().toISOString()
    });
    
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }

  async getHistory(platform: string, limit: number): Promise<NarrativeRecord[]> {
    const dataPath = path.join(process.cwd(), 'narrative-data.json');
    
    if (!fs.existsSync(dataPath)) {
      // Return mock data for demo
      return this.getMockHistory();
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    let filtered = data;
    if (platform !== 'all') {
      filtered = data.filter((r: any) => 
        r.platform.toLowerCase() === platform.toLowerCase()
      );
    }
    
    return filtered
      .slice(-limit)
      .map((r: any) => ({
        score: r.score,
        platform: r.platform,
        alternative: r.alternative,
        timestamp: r.timestamp
      }));
  }

  private getMockHistory(): NarrativeRecord[] {
    return [
      {
        score: 0.75,
        platform: 'discord',
        alternative: 'telegram',
        timestamp: '2026-02-14T10:00:00Z'
      },
      {
        score: 0.45,
        platform: 'twitter',
        alternative: 'bluesky',
        timestamp: '2026-02-13T15:30:00Z'
      },
      {
        score: 0.82,
        platform: 'discord',
        alternative: 'telegram',
        timestamp: '2026-02-12T08:15:00Z'
      }
    ];
  }

  getPublicKey(): string {
    return this.keypair.publicKey.toBase58();
  }
}
