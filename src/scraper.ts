import { execSync } from 'child_process';

export interface Tweet {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  likes: number;
  retweets: number;
}

export class TwitterScraper {
  private authToken: string;
  private ct0: string;

  constructor() {
    this.authToken = process.env.TWITTER_AUTH_TOKEN || '';
    this.ct0 = process.env.TWITTER_CT0 || '';
    
    if (!this.authToken || !this.ct0) {
      console.warn('Warning: Twitter credentials not set. Using mock data.');
    }
  }

  async searchMigrationNarratives(platform: string, limit: number = 100): Promise<Tweet[]> {
    const queries = [
      `"leaving ${platform}"`,
      `"${platform} alternative"`,
      `"quit ${platform}"`,
      `"${platform} vs"`,
      `"moving from ${platform}"`,
      `"${platform} migration"`,
      `"${platform} exodus"`
    ];
    
    const allTweets: Tweet[] = [];
    
    for (const query of queries.slice(0, 3)) { // Limit queries for speed
      try {
        const tweets = await this.searchWithBird(query, Math.floor(limit / 3));
        allTweets.push(...tweets);
      } catch (error) {
        console.error(`Search failed for "${query}":`, error);
      }
    }
    
    // Remove duplicates
    const unique = Array.from(new Map(allTweets.map(t => [t.id, t])).values());
    return unique.slice(0, limit);
  }

  private async searchWithBird(query: string, limit: number): Promise<Tweet[]> {
    if (!this.authToken || !this.ct0) {
      // Return mock data for demo
      return this.getMockData(query, limit);
    }
    
    try {
      const cmd = `bird --auth-token "${this.authToken}" --ct0 "${this.ct0}" search "${query}"`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
      
      return this.parseBirdOutput(output);
    } catch (error) {
      console.error('Bird search error:', error);
      return this.getMockData(query, limit);
    }
  }

  private parseBirdOutput(output: string): Tweet[] {
    const tweets: Tweet[] = [];
    const lines = output.split('\n');
    
    let currentTweet: Partial<Tweet> = {};
    
    for (const line of lines) {
      if (line.includes('@') && line.includes(':')) {
        // New tweet start
        if (currentTweet.id) {
          tweets.push(currentTweet as Tweet);
        }
        
        const match = line.match(/@(\w+)\s*\(([^)]+)\):/);
        if (match) {
          currentTweet = {
            author: match[1],
            id: `mock_${Date.now()}_${tweets.length}`
          };
        }
      } else if (line.includes('📅')) {
        const dateMatch = line.match(/📅\s+(.+)/);
        if (dateMatch) {
          currentTweet.createdAt = dateMatch[1];
        }
      } else if (line.includes('🔗')) {
        const urlMatch = line.match(/🔗\s+(.+)/);
        if (urlMatch) {
          const urlParts = urlMatch[1].split('/');
          currentTweet.id = urlParts[urlParts.length - 1] || currentTweet.id;
        }
      } else if (line.trim() && !line.startsWith('─') && !line.includes('🔄') && !line.includes('└─')) {
        // Tweet text
        currentTweet.text = line.trim();
      }
    }
    
    if (currentTweet.id) {
      tweets.push(currentTweet as Tweet);
    }
    
    return tweets.map(t => ({
      ...t,
      likes: 0,
      retweets: 0
    }));
  }

  private getMockData(query: string, limit: number): Tweet[] {
    // Mock data for demonstration
    const mockTweets: Tweet[] = [
      {
        id: '1',
        text: 'Discord forcing biometric KYC is insane. Moving my entire community to Telegram tonight.',
        author: 'crypto_whale',
        createdAt: new Date().toISOString(),
        likes: 420,
        retweets: 89
      },
      {
        id: '2',
        text: 'After Discord\'s new policy, I\'m done. Telegram is the only logical choice for privacy.',
        author: 'privacy_advocate',
        createdAt: new Date().toISOString(),
        likes: 234,
        retweets: 56
      },
      {
        id: '3',
        text: 'Discord alternatives thread: Why I\'m migrating to Telegram and you should too.',
        author: 'tech_lead',
        createdAt: new Date().toISOString(),
        likes: 1200,
        retweets: 340
      }
    ];
    
    return mockTweets.slice(0, limit);
  }
}
