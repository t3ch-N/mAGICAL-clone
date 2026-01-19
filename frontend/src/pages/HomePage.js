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
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
  Camera,
  Star
} from 'lucide-react';

// Logo URLs
const MKO_LOGO = "https://customer-assets.emergentagent.com/job_kenya-golf-tourney/artifacts/n9g48emm_MKO%20logo.jpeg";
const DP_WORLD_TOUR_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/h2va547a_DPWORLD%20LOGO.jpg";
const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_kenya-golf-tourney/artifacts/ch5rc2h4_KENYA%20OPEN%20LOGO_250724_100403.pdf";

// Partner & Sponsor Logos
const MINISTRY_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/q0qxyns1_MINISTRY.png";
const ABSA_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/2h0ry18x_ABSA%20KENYA.jpg";
const JOHNNIE_WALKER_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/0cc2631j_JOHNYWALKER%20LOGO.jpg";
const SPORTPESA_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/0baz3u7v_SPORTS%20PESA.png";

// Hero backgrounds
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1760253488581-f77fe3a6e479?w=1920&q=80",
  "https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg?w=1920",
  "https://images.unsplash.com/photo-1768396747921-5a18367415d2?w=1920&q=80"
];

// Featured content carousel items
const featuredContent = [
  {
    id: 1,
    type: 'video',
    title: '2025 Highlights: Best Shots',
    subtitle: 'Relive the magic moments from last year',
    image: 'https://images.pexels.com/photos/3692901/pexels-photo-3692901.jpeg',
    category: 'VIDEO',
    duration: '4:32'
  },
  {
    id: 2,
    type: 'article',
    title: 'Meet the 2026 Field',
    subtitle: 'World-class players descend on Karen Country Club',
    image: 'https://images.unsplash.com/photo-1766206096984-5b13b0f1eedd?w=800&q=80',
    category: 'PLAYERS'
  },
  {
    id: 3,
    type: 'gallery',
    title: 'Karen Country Club Gallery',
    subtitle: 'Stunning views of the championship course',
    image: 'https://images.unsplash.com/photo-1768396747921-5a18367415d2?w=800&q=80',
    category: 'PHOTOS'
  },
  {
    id: 4,
    type: 'video',
    title: 'The Kenya Experience',
    subtitle: 'Golf, safari, and unforgettable adventures',
    image: 'https://images.unsplash.com/photo-1740048264207-ad890ed15fd4?w=800&q=80',
    category: 'VIDEO',
    duration: '3:15'
  },
  {
    id: 5,
    type: 'article',
    title: 'Junior Golf Initiative',
    subtitle: 'Developing the next generation of Kenyan golfers',
    image: 'https://images.unsplash.com/photo-1727122383197-71ec73d9a6cc?w=800&q=80',
    category: 'COMMUNITY'
  }
];

// Player spotlight data
const playerSpotlight = [
  {
    name: 'Guido Migliozzi',
    country: 'Italy',
    countryCode: 'ITA',
    title: 'Defending Champion',
    image: 'https://images.unsplash.com/photo-1760253488581-f77fe3a6e479?w=400&q=80'
  },
  {
    name: 'Thriston Lawrence',
    country: 'South Africa',
    countryCode: 'RSA',
    title: 'World #55',
    image: 'https://images.unsplash.com/photo-1765037189295-149d3072b1ff?w=400&q=80'
  },
  {
    name: 'Mutahi Kibugu',
    country: 'Kenya',
    countryCode: 'KEN',
    title: 'Local Star',
    image: 'https://images.unsplash.com/photo-1744551154591-7613d92e0eb9?w=400&q=80'
  }
];

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
    <div className="flex gap-3 md:gap-6" data-testid="countdown-timer">
      {Object.entries(timeLeft).map(([key, value]) => (
        <div key={key} className="text-center bg-black/30 backdrop-blur-sm px-3 py-2 md:px-5 md:py-3">
          <div className="font-subheading text-3xl md:text-5xl font-bold text-white">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/70 mt-1">
            {key}
          </div>
        </div>
      ))}
    </div>
  );
}

// Featured Content Carousel
function FeaturedCarousel({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length]);

  const goTo = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlaying(false);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="relative group" data-testid="featured-carousel">
      {/* Main featured item */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img 
          src={currentItem.image} 
          alt={currentItem.title}
          className="w-full h-full object-cover transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Badge className={`mb-3 ${currentItem.type === 'video' ? 'bg-secondary' : 'bg-primary'}`}>
            {currentItem.type === 'video' && <Play className="w-3 h-3 mr-1" />}
            {currentItem.type === 'gallery' && <Camera className="w-3 h-3 mr-1" />}
            {currentItem.category}
            {currentItem.duration && <span className="ml-2">{currentItem.duration}</span>}
          </Badge>
          <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-2">
            {currentItem.title}
          </h2>
          <p className="text-white/80 font-body text-sm md:text-base max-w-2xl">
            {currentItem.subtitle}
          </p>
          <Button className="mt-4 btn-secondary" data-testid="watch-now-btn">
            {currentItem.type === 'video' ? 'Watch Now' : 'View More'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Navigation arrows */}
        <button 
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => goTo(index)}
            className={`relative flex-shrink-0 w-32 md:w-48 h-20 md:h-28 overflow-hidden transition-all ${
              index === currentIndex ? 'ring-2 ring-secondary' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 right-1">
              <p className="text-white text-[10px] md:text-xs font-body truncate">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [news, setNews] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tournamentInfo, setTournamentInfo] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

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

    // Hero image rotation
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div data-testid="home-page">
      {/* Official Partners Banner */}
      <div className="bg-white border-b border-border/40 py-3">
        <div className="container-custom flex items-center justify-center gap-8 md:gap-16">
          <span className="text-xs uppercase tracking-widest text-muted-foreground hidden md:block">Official Partners</span>
          <img src={DP_WORLD_TOUR_LOGO} alt="DP World Tour" className="h-8 md:h-10 w-auto" />
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="font-subheading font-bold text-[10px] md:text-xs text-primary leading-tight">GOVERNMENT OF KENYA</div>
              <div className="font-body text-[8px] md:text-[10px] text-muted-foreground leading-tight">Ministry of Youth Affairs,</div>
              <div className="font-body text-[8px] md:text-[10px] text-muted-foreground leading-tight">Creative Economy & Sports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {HERO_IMAGES.map((img, i) => (
          <div 
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="hero-overlay absolute inset-0" />
        
        <div className="relative z-10 container-custom text-center py-20">
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge className="bg-secondary text-white px-4 py-2 text-xs uppercase tracking-widest">
                DP World Tour
              </Badge>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-2 tracking-tight">
              <span className="text-secondary italic">Magical</span>
            </h1>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
              Kenya Open
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-white/90 text-lg md:text-xl font-body mb-8">
              <Calendar className="w-5 h-5" />
              <span>{tournamentInfo?.dates || 'February 19-22, 2026'}</span>
              <span className="mx-2">•</span>
              <MapPin className="w-5 h-5" />
              <span>{tournamentInfo?.venue || 'Karen Country Club'}</span>
            </div>

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

      {/* Featured Content Section - Similar to DP World Tour */}
      <section className="bg-foreground py-8" data-testid="featured-section">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-subheading text-white text-sm uppercase tracking-widest">Featured Content</h2>
            <Link to="/gallery" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <FeaturedCarousel items={featuredContent} />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-primary text-primary-foreground py-8" data-testid="quick-stats">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Trophy, value: tournamentInfo?.purse || '$2,000,000', label: 'Prize Fund' },
              { icon: Users, value: '156', label: 'Players' },
              { icon: MapPin, value: 'Karen CC', label: 'Venue' },
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

      {/* Player Spotlight */}
      <section className="section-spacing bg-muted" data-testid="player-spotlight">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-2">Players</Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">Player Spotlight</h2>
            </div>
            <Link to="/leaderboard">
              <Button variant="outline" className="gap-2">
                All Players <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {playerSpotlight.map((player, i) => (
              <Card key={i} className="card-default group overflow-hidden hover-lift" data-testid={`player-card-${i}`}>
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={player.image} 
                    alt={player.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-foreground">{player.countryCode}</Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-accent text-xs uppercase tracking-wider mb-1">{player.title}</p>
                    <h3 className="font-heading text-xl font-bold text-white">{player.name}</h3>
                    <p className="text-white/70 text-sm">{player.country}</p>
                  </div>
                </div>
              </Card>
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

      {/* The Course - Karen Country Club */}
      <section className="section-spacing bg-primary text-primary-foreground" data-testid="course-section">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-4">The Venue</Badge>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Karen Country Club</h2>
              <p className="text-primary-foreground/80 font-body mb-6 leading-relaxed">
                Established in 1937, Karen Country Club is one of Kenya's most prestigious golf courses. 
                Located in the beautiful Karen suburb of Nairobi, at the foot of the Ngong Hills, the club 
                offers a championship-caliber test of golf in stunning surroundings.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-primary-foreground/10">
                  <div className="font-subheading text-2xl font-bold text-accent">72</div>
                  <div className="text-xs text-primary-foreground/60">Par</div>
                </div>
                <div className="text-center p-4 bg-primary-foreground/10">
                  <div className="font-subheading text-2xl font-bold text-accent">6,818</div>
                  <div className="text-xs text-primary-foreground/60">Yards</div>
                </div>
                <div className="text-center p-4 bg-primary-foreground/10">
                  <div className="font-subheading text-2xl font-bold text-accent">1937</div>
                  <div className="text-xs text-primary-foreground/60">Est.</div>
                </div>
              </div>
              <Link to="/tournament">
                <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Explore The Course <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1768396747921-5a18367415d2?w=800&q=80"
                alt="Karen Country Club"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground p-6 hidden md:block">
                <div className="font-heading text-4xl font-bold">2026</div>
                <div className="text-sm uppercase tracking-wider">Host Venue</div>
              </div>
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

      {/* Experience Kenya CTA */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden" data-testid="kenya-experience">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1740048264207-ad890ed15fd4?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <Badge className="bg-accent text-accent-foreground mb-4">Beyond Golf</Badge>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4">
            Experience Magical Kenya
          </h2>
          <p className="text-white/80 font-body max-w-2xl mx-auto mb-8">
            Combine world-class golf with unforgettable safari adventures. Discover why Kenya is called "Magical".
          </p>
          <Link to="/travel">
            <Button className="btn-secondary h-12 px-8">
              Plan Your Trip <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Partners & Sponsors */}
      <section className="py-16 bg-white border-t border-border/40" data-testid="sponsors-section">
        <div className="container-custom">
          <h3 className="font-subheading text-xs uppercase tracking-widest text-muted-foreground text-center mb-8">
            Official Partners & Sponsors
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <img 
              src={DP_WORLD_TOUR_LOGO} 
              alt="DP World Tour"
              className="h-12 md:h-16 w-auto"
            />
            <img 
              src={MKO_LOGO} 
              alt="Magical Kenya Open"
              className="h-14 md:h-20 w-auto"
            />
            <div className="h-12 md:h-16 px-6 bg-muted flex items-center justify-center">
              <span className="font-subheading font-semibold text-primary">Kenya Tourism</span>
            </div>
            <div className="h-12 md:h-16 px-6 bg-muted flex items-center justify-center">
              <span className="font-subheading font-semibold text-primary">Safaricom</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
