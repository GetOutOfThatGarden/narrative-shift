export interface SentimentResult {
  score: number;        // -1 to 1
  magnitude: number;    // 0 to 1
  migrationIntent: boolean;
  targetPlatform?: string;
}

export interface BatchAnalysis {
  score: number;           // 0 to 1 (normalized migration sentiment)
  volume: number;
  velocity: number;        // tweets per hour
  topAlternative: string | null;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export class SentimentAnalyzer {
  private positiveWords = [
    'moving', 'migrated', 'switching', 'better', 'best', 'love', 'prefer',
    'join', 'coming', 'excited', 'recommend', 'upgrade', 'improved'
  ];
  
  private negativeWords = [
    'hate', 'terrible', 'awful', 'quit', 'leaving', 'done', 'never',
    'worst', 'horrible', 'disgusting', 'privacy', 'kyc', 'biometric'
  ];
  
  private migrationWords = [
    'moving', 'migrate', 'migration', 'switch', 'switching', 'quit',
    'leaving', 'left', 'exodus', 'alternative', 'instead'
  ];
  
  private platforms = ['telegram', 'bluesky', 'mastodon', 'signal', 'matrix', 'guilded'];

  analyze(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    
    // Check for migration intent
    const hasMigrationIntent = this.migrationWords.some(word => 
      lowerText.includes(word)
    );
    
    // Count positive/negative words
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of this.positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }
    
    for (const word of this.negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }
    
    // Calculate sentiment score
    const totalWords = text.split(' ').length;
    const sentimentScore = (positiveCount - negativeCount) / Math.max(totalWords * 0.1, 1);
    
    // Detect target platform
    let targetPlatform: string | undefined;
    for (const platform of this.platforms) {
      if (lowerText.includes(platform)) {
        targetPlatform = platform;
        break;
      }
    }
    
    return {
      score: Math.max(-1, Math.min(1, sentimentScore)),
      magnitude: Math.min(1, (positiveCount + negativeCount) / 5),
      migrationIntent: hasMigrationIntent,
      targetPlatform
    };
  }

  analyzeBatch(tweets: any[], sourcePlatform: string): BatchAnalysis {
    const results = tweets.map(t => this.analyze(t.text));
    
    // Calculate metrics
    const migrationTweets = results.filter(r => r.migrationIntent);
    const avgSentiment = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Count sentiment breakdown
    const sentimentBreakdown = {
      positive: results.filter(r => r.score > 0.2).length,
      negative: results.filter(r => r.score < -0.2).length,
      neutral: results.filter(r => r.score >= -0.2 && r.score <= 0.2).length
    };
    
    // Find top alternative platform
    const platformCounts: Record<string, number> = {};
    for (const result of results) {
      if (result.targetPlatform) {
        platformCounts[result.targetPlatform] = (platformCounts[result.targetPlatform] || 0) + 1;
      }
    }
    
    const topAlternative = Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Calculate velocity (tweets per hour)
    const timestamps = tweets
      .map(t => new Date(t.createdAt).getTime())
      .filter(t => !isNaN(t));
    
    let velocity = 0;
    if (timestamps.length >= 2) {
      const timeRange = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60);
      velocity = timeRange > 0 ? tweets.length / timeRange : tweets.length;
    }
    
    // Calculate final migration score
    const migrationScore = Math.min(1, Math.max(0, 
      (migrationTweets.length / tweets.length) * 0.4 +
      (Math.abs(avgSentiment) * 0.3) +
      (Math.min(velocity / 10, 1) * 0.3)
    ));
    
    return {
      score: migrationScore,
      volume: tweets.length,
      velocity: Math.round(velocity * 10) / 10,
      topAlternative,
      sentimentBreakdown
    };
  }
}
