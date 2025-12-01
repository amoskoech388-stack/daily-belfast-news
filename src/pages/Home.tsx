import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
  post_tags: {
    tags: {
      name: string;
      slug: string;
    };
  }[];
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  image?: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [rssItems, setRssItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rssLoading, setRssLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchRSSFeeds();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (full_name),
          post_tags (
            tags (name, slug)
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRSSFeeds = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-rss-feeds');
      
      if (error) throw error;
      if (data?.success && data?.items) {
        setRssItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching RSS feeds:', error);
    } finally {
      setRssLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading latest news...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-secondary-foreground md:text-5xl">
          Daily Belfast News
        </h1>
        <p className="text-lg text-secondary-foreground/90 md:text-xl">
          Your trusted source for local news and stories
        </p>
      </div>

      {/* User Posts Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Latest from Our Community</h2>
        {posts.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/posts/${post.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  {post.featured_image && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="p-3 lg:p-6">
                    <div className="mb-2 flex flex-wrap gap-1 lg:gap-2">
                      {post.post_tags?.slice(0, 3).map((pt, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {pt.tags.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2 text-sm lg:text-2xl">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs lg:line-clamp-3 lg:text-sm">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 lg:p-6">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:gap-4 lg:text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="truncate">{post.profiles?.full_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* International News RSS Feeds */}
      <div className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold">International News</h2>
          {rssLoading ? (
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Loading international news...</p>
            </div>
          ) : rssItems.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-muted-foreground">No news available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
              {rssItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    {item.image && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    )}
                    <CardHeader className="p-3 lg:p-6">
                      <Badge variant="outline" className="mb-2 w-fit text-xs">
                        {item.source}
                      </Badge>
                      <CardTitle className="line-clamp-2 text-sm lg:text-2xl">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs lg:line-clamp-3 lg:text-sm">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 lg:p-6">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground lg:text-sm">
                        <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>{format(new Date(item.pubDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
