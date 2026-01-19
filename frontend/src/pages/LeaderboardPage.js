import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Search,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaderboardRes, playersRes] = await Promise.all([
        fetch(`${API}/leaderboard`),
        fetch(`${API}/players`)
      ]);
      
      const leaderboardData = await leaderboardRes.json();
      const playersData = await playersRes.json();
      
      setLeaderboard(leaderboardData);
      setPlayers(playersData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Simulate live updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreDisplay = (score) => {
    if (score === 0) return 'E';
    if (score > 0) return `+${score}`;
    return score;
  };

  const getScoreClass = (score) => {
    if (score < 0) return 'score-under';
    if (score > 0) return 'score-over';
    return 'score-even';
  };

  const getPositionChange = (entry) => {
    // Mock position change for demo
    const change = Math.floor(Math.random() * 5) - 2;
    if (change > 0) return <ChevronUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div data-testid="leaderboard-page">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="live-badge mb-4">Live Leaderboard</div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold">
                Players & Leaderboard
              </h1>
              {lastUpdated && (
                <p className="text-primary-foreground/70 text-sm mt-2 font-body">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button 
              onClick={fetchData} 
              disabled={loading}
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 w-fit"
              data-testid="refresh-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-6 border-b border-border/40">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players or countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {filteredLeaderboard.length} Players
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="section-spacing">
        <div className="container-custom">
          {loading && leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <Card className="card-default">
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground font-body">
                  {searchTerm ? 'No players found matching your search.' : 'No leaderboard data available yet.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back when the tournament begins!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-default overflow-hidden" data-testid="leaderboard-table">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider w-16">Pos</th>
                      <th className="px-4 py-4 text-left font-subheading font-semibold text-sm uppercase tracking-wider">Player</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">R1</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">R2</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">R3</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">R4</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">Today</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-20">Thru</th>
                      <th className="px-4 py-4 text-center font-subheading font-semibold text-sm uppercase tracking-wider w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((entry, i) => (
                      <tr 
                        key={entry.entry_id || i} 
                        className={`leaderboard-row border-b border-border/40 ${entry.is_cut ? 'opacity-50' : ''}`}
                        data-testid={`leaderboard-row-${i}`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-subheading font-bold text-lg w-8">{entry.position}</span>
                            {getPositionChange(entry)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {entry.photo_url ? (
                              <img 
                                src={entry.photo_url} 
                                alt={entry.player_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                {entry.country_code || '??'}
                              </div>
                            )}
                            <div>
                              <div className="font-body font-medium">{entry.player_name || 'Unknown Player'}</div>
                              <div className="text-xs text-muted-foreground">{entry.country || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.round1 || '-'}</td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.round2 || '-'}</td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.round3 || '-'}</td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.round4 || '-'}</td>
                        <td className={`px-4 py-4 text-center font-subheading font-bold ${getScoreClass(entry.today)}`}>
                          {entry.today !== null ? getScoreDisplay(entry.today) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center font-subheading">{entry.thru || '-'}</td>
                        <td className={`px-4 py-4 text-center font-subheading font-bold text-lg ${getScoreClass(entry.score_to_par)}`}>
                          {getScoreDisplay(entry.score_to_par)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Legend */}
      <section className="pb-16">
        <div className="container-custom">
          <Card className="card-default">
            <CardContent className="p-6">
              <h3 className="font-subheading font-semibold uppercase tracking-wider text-sm mb-4">Legend</h3>
              <div className="flex flex-wrap gap-6 text-sm font-body">
                <div className="flex items-center gap-2">
                  <span className="score-under font-bold">-5</span>
                  <span className="text-muted-foreground">Under Par</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="score-even font-bold">E</span>
                  <span className="text-muted-foreground">Even Par</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="score-over font-bold">+3</span>
                  <span className="text-muted-foreground">Over Par</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">F</span>
                  <span className="text-muted-foreground">Finished</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
