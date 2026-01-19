import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  ArrowRight,
  Play,
  Clock
} from 'lucide-react';

const HERO_BG = "https://images.pexels.com/photos/9207751/pexels-photo-9207751.jpeg";

// Countdown timer component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 md:gap-8" data-testid="countdown-timer">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="text-center">
          <div className="font-subheading text-4xl md:text-6xl font-bold text-white">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm uppercase tracking-widest text-white/70 mt-1">
            {key}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [news, setNews] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);

  useEffect(() => {
    // Fetch data
    Promise.all([
      fetch(`${API}/news?limit=3`).then(r => r.json()).catch(() => []),
      fetch(`${API}/leaderboard`).then(r => r.json()).catch(() => []),
      fetch(`${API}/tournament/info`).then(r => r.json()).catch(() => null)
    ]).then(([newsData, leaderboardData, infoData]) => {
      setNews(newsData);
      setLeaderboard(leaderboardData.slice(0, 5));
      setTournamentInfo(infoData);
    });
  }, []);

  const sponsors = [
    { name: 'DP World Tour', logo: 'https://placehold.co/150x60/1a472a/ffffff?text=DP+World+Tour' },
    { name: 'Kenya Tourism', logo: 'https://placehold.co/150x60/e31937/ffffff?text=Magical+Kenya' },
    { name: 'Safaricom', logo: 'https://placehold.co/150x60/1a472a/ffffff?text=Safaricom' },
    { name: 'KCB', logo: 'https://placehold.co/150x60/1a472a/ffffff?text=KCB' },
  ];

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        
        <div className="relative z-10 container-custom text-center py-20">
          <div className="animate-fade-in">
            <Badge className="bg-secondary text-white mb-6 px-4 py-2 text-xs uppercase tracking-widest">
              DP World Tour Event
            </Badge>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-tight">
              <span className="text-secondary italic">Magical</span>
              <br />
              Kenya Open
            </h1>
            
            <p className="text-white/80 text-lg md:text-xl font-body max-w-2xl mx-auto mb-8">
              {tournamentInfo?.dates || 'March 6-9, 2025'} • {tournamentInfo?.venue || 'Muthaiga Golf Club'}
            </p>

            {/* Countdown */}
            <div className="mb-10 flex justify-center">
              <CountdownTimer targetDate="2026-02-19T07:00:00" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tickets">
                <Button className="btn-secondary h-14 px-10 text-base" data-testid="hero-tickets-btn">
                  Get Tickets
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="outline" className="h-14 px-10 text-base border-white text-white hover:bg-white hover:text-primary" data-testid="hero-leaderboard-btn">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-primary text-primary-foreground py-8" data-testid="quick-stats">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Trophy, value: tournamentInfo?.purse || '$2,000,000', label: 'Prize Fund' },
              { icon: Users, value: '156', label: 'Players' },
              { icon: MapPin, value: tournamentInfo?.venue || 'Muthaiga GC', label: 'Venue' },
              { icon: Calendar, value: '4', label: 'Days' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-accent" />
                <div className="font-subheading text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Leaderboard Preview */}
      {leaderboard.length > 0 && (
        <section className="section-spacing bg-background" data-testid="leaderboard-preview">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="live-badge mb-2">Live</div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold">Leaderboard</h2>
              </div>
              <Link to="/leaderboard">
                <Button variant="outline" className="gap-2">
                  Full Leaderboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <Card className="card-default overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-subheading font-semibold text-sm uppercase tracking-wider">Pos</th>
                      <th className="px-4 py-3 font-subheading font-semibold text-sm uppercase tracking-wider">Player</th>
                      <th className="px-4 py-3 font-subheading font-semibold text-sm uppercase tracking-wider text-center">Today</th>
                      <th className="px-4 py-3 font-subheading font-semibold text-sm uppercase tracking-wider text-center">Thru</th>
                      <th className="px-4 py-3 font-subheading font-semibold text-sm uppercase tracking-wider text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={entry.entry_id || i} className="leaderboard-row border-b border-border/40">
                        <td className="px-4 py-4 font-subheading font-bold text-lg">{entry.position}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs uppercase">{entry.country_code}</span>
                            <span className="font-body font-medium">{entry.player_name}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-4 text-center font-subheading font-bold ${entry.today < 0 ? 'score-under' : entry.today > 0 ? 'score-over' : 'score-even'}`}>
                          {entry.today > 0 ? `+${entry.today}` : entry.today || 'E'}
                        </td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.thru}</td>
                        <td className={`px-4 py-4 text-center font-subheading font-bold text-lg ${entry.score_to_par < 0 ? 'score-under' : entry.score_to_par > 0 ? 'score-over' : 'score-even'}`}>
                          {entry.score_to_par > 0 ? `+${entry.score_to_par}` : entry.score_to_par || 'E'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Featured Content Grid */}
      <section className="section-spacing bg-muted" data-testid="featured-content">
        <div className="container-custom">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Experience the Magic</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Large Feature Card */}
            <Card className="md:col-span-8 card-feature group cursor-pointer overflow-hidden" data-testid="feature-card-tournament">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
              <CardContent className="relative z-10 flex flex-col justify-end min-h-[400px] p-8">
                <Badge className="w-fit mb-4 bg-accent text-accent-foreground">Tournament</Badge>
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  Muthaiga Golf Club
                </h3>
                <p className="text-white/80 font-body mb-4">
                  One of Africa's finest courses, hosting world-class golf since 1913.
                </p>
                <Link to="/tournament">
                  <Button variant="outline" className="w-fit border-white text-white hover:bg-white hover:text-primary">
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Side Cards */}
            <div className="md:col-span-4 grid gap-6">
              <Link to="/tickets">
                <Card className="card-default group hover-lift h-full" data-testid="feature-card-tickets">
                  <CardContent className="p-6 flex flex-col h-full">
                    <Trophy className="w-8 h-8 text-accent mb-4" />
                    <h3 className="font-heading text-xl font-bold mb-2">Tickets & Hospitality</h3>
                    <p className="text-muted-foreground font-body text-sm flex-1">
                      Premium experiences and daily passes available.
                    </p>
                    <div className="flex items-center gap-2 text-primary font-semibold mt-4 group-hover:gap-3 transition-all">
                      Book Now <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/travel">
                <Card className="card-default group hover-lift h-full" data-testid="feature-card-travel">
                  <CardContent className="p-6 flex flex-col h-full">
                    <MapPin className="w-8 h-8 text-secondary mb-4" />
                    <h3 className="font-heading text-xl font-bold mb-2">Travel & Experience</h3>
                    <p className="text-muted-foreground font-body text-sm flex-1">
                      Plan your trip to magical Kenya.
                    </p>
                    <div className="flex items-center gap-2 text-primary font-semibold mt-4 group-hover:gap-3 transition-all">
                      Explore <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {news.length > 0 && (
        <section className="section-spacing bg-background" data-testid="latest-news">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-3xl md:text-4xl font-bold">Latest News</h2>
              <Link to="/news">
                <Button variant="ghost" className="gap-2">
                  All News <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((article) => (
                <Link key={article.article_id} to={`/news/${article.article_id}`}>
                  <Card className="card-default group hover-lift h-full overflow-hidden" data-testid={`news-card-${article.article_id}`}>
                    {article.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3">{article.category}</Badge>
                      <h3 className="font-heading text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground font-body text-sm line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                        <Clock className="w-3 h-3" />
                        {new Date(article.published_at || article.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsors */}
      <section className="py-16 bg-muted border-t border-border/40" data-testid="sponsors-section">
        <div className="container-custom">
          <h3 className="font-subheading text-xs uppercase tracking-widest text-muted-foreground text-center mb-8">
            Official Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {sponsors.map((sponsor, i) => (
              <img 
                key={i}
                src={sponsor.logo} 
                alt={sponsor.name}
                className="h-10 md:h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
