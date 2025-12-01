import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  image?: string;
}

const RSS_FEEDS = [
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
  { url: 'https://feeds.reuters.com/reuters/topNews', source: 'Reuters' },
  { url: 'http://rss.cnn.com/rss/edition_world.rss', source: 'CNN World' },
  { url: 'https://www.theguardian.com/world/rss', source: 'The Guardian' },
];

async function parseFeed(feedUrl: string, source: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl);
    const xml = await response.text();
    
    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = xml.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const imageMatch = itemXml.match(/<media:thumbnail url="(.*?)"|<enclosure url="(.*?)"/);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: (titleMatch[1] || titleMatch[2] || '').trim(),
          link: linkMatch[1].trim(),
          description: (descMatch?.[1] || descMatch?.[2] || '').replace(/<[^>]*>/g, '').substring(0, 150),
          pubDate: dateMatch?.[1] || new Date().toISOString(),
          source,
          image: imageMatch?.[1] || imageMatch?.[2] || undefined,
        });
      }
    }
    
    return items.slice(0, 5); // Return top 5 items per source
  } catch (error) {
    console.error(`Error fetching ${source}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching RSS feeds from international news outlets...');
    
    const feedPromises = RSS_FEEDS.map(feed => parseFeed(feed.url, feed.source));
    const results = await Promise.all(feedPromises);
    
    const allItems = results.flat();
    
    // Sort by date, newest first
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    console.log(`Successfully fetched ${allItems.length} news items`);
    
    return new Response(
      JSON.stringify({ success: true, items: allItems.slice(0, 20) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-rss-feeds function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
