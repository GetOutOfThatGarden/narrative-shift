#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { TwitterScraper } from './scraper.js';
import { SentimentAnalyzer } from './sentiment.js';
import { SolanaStorage } from './solana.js';
import { SubscriptionManager } from './subscriptions.js';
import { config } from 'dotenv';

config();

const program = new Command();

program
  .name('narrative-shift')
  .description('Detect platform migration narratives and store on Solana')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan Twitter for migration narratives')
  .option('-p, --platforms <platforms>', 'Comma-separated list of platforms to monitor', 'discord,telegram,bluesky,mastodon')
  .option('-t, --timeframe <hours>', 'Timeframe in hours', '24')
  .option('-l, --limit <count>', 'Max tweets to analyze', '100')
  .action(async (options) => {
    console.log(chalk.blue.bold('🔍 NarrativeShift Scanner\n'));
    
    const platforms = options.platforms.split(',');
    const scraper = new TwitterScraper();
    const analyzer = new SentimentAnalyzer();
    
    console.log(chalk.gray(`Monitoring platforms: ${platforms.join(', ')}`));
    console.log(chalk.gray(`Timeframe: ${options.timeframe} hours\n`));
    
    for (const platform of platforms) {
      console.log(chalk.yellow(`\n📱 Scanning for "${platform}" migration narratives...`));
      
      const tweets = await scraper.searchMigrationNarratives(platform, parseInt(options.limit));
      console.log(chalk.gray(`Found ${tweets.length} relevant tweets`));
      
      if (tweets.length > 0) {
        const analysis = analyzer.analyzeBatch(tweets, platform);
        
        console.log(chalk.green(`\n✅ Analysis for ${platform}:`));
        console.log(`  Migration Sentiment Score: ${analysis.score.toFixed(2)}`);
        console.log(`  Volume: ${analysis.volume}`);
        console.log(`  Velocity: ${analysis.velocity} tweets/hour`);
        console.log(`  Top Alternative: ${analysis.topAlternative || 'N/A'}`);
        
        if (analysis.score > 0.6) {
          console.log(chalk.red.bold('  🚨 HIGH MIGRATION NARRATIVE DETECTED!'));
        }
      }
    }
  });

program
  .command('store')
  .description('Store narrative snapshot on Solana')
  .option('-s, --score <score>', 'Narrative score to store', '0.5')
  .option('-p, --platform <platform>', 'Primary platform', 'discord')
  .option('-a, --alternative <alternative>', 'Alternative platform', 'telegram')
  .action(async (options) => {
    console.log(chalk.blue.bold('⛓️  Storing on Solana\n'));
    
    const storage = new SolanaStorage();
    
    try {
      const signature = await storage.storeNarrative({
        score: parseFloat(options.score),
        platform: options.platform,
        alternative: options.alternative,
        timestamp: new Date().toISOString()
      });
      
      console.log(chalk.green('✅ Stored successfully!'));
      console.log(`Transaction: ${signature}`);
      console.log(`Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to store:'), error);
    }
  });

program
  .command('subscribe')
  .description('Subscribe to real-time alerts (pay in SOL)')
  .option('-a, --amount <sol>', 'Subscription amount in SOL', '0.1')
  .option('-d, --duration <days>', 'Subscription duration in days', '30')
  .action(async (options) => {
    console.log(chalk.blue.bold('💳 Subscribe to Alerts\n'));
    
    const subscriptions = new SubscriptionManager();
    
    try {
      const result = await subscriptions.subscribe({
        amount: parseFloat(options.amount),
        duration: parseInt(options.duration)
      });
      
      console.log(chalk.green('✅ Subscription activated!'));
      console.log(`Transaction: ${result.signature}`);
      console.log(`Expires: ${result.expiresAt}`);
    } catch (error) {
      console.error(chalk.red('❌ Subscription failed:'), error);
    }
  });

program
  .command('history')
  .description('View stored narrative history')
  .option('-p, --platform <platform>', 'Filter by platform', 'all')
  .option('-l, --limit <count>', 'Number of records', '10')
  .action(async (options) => {
    console.log(chalk.blue.bold('📊 Narrative History\n'));
    
    const storage = new SolanaStorage();
    
    try {
      const records = await storage.getHistory(options.platform, parseInt(options.limit));
      
      console.log(chalk.gray(`Found ${records.length} records:\n`));
      
      for (const record of records) {
        const date = new Date(record.timestamp).toLocaleDateString();
        const score = record.score.toFixed(2);
        const scoreColor = record.score > 0.6 ? chalk.red : record.score > 0.3 ? chalk.yellow : chalk.green;
        
        console.log(`${chalk.gray(date)} | ${scoreColor(score)} | ${record.platform} → ${record.alternative}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch history:'), error);
    }
  });

program.parse();
