import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users,
  Clock,
  Flag,
  Target
} from 'lucide-react';

const COURSE_BG = "https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg";

export default function TournamentPage() {
  const [info, setInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [pastWinners, setPastWinners] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tournament/info`).then(r => r.json()).catch(() => null),
      fetch(`${API}/tournament/schedule`).then(r => r.json()).catch(() => []),
      fetch(`${API}/tournament/past-winners`).then(r => r.json()).catch(() => [])
    ]).then(([infoData, scheduleData, winnersData]) => {
      setInfo(infoData);
      setSchedule(scheduleData);
      setPastWinners(winnersData);
    });
  }, []);

  return (
    <div data-testid="tournament-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${COURSE_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-secondary text-white mb-4 px-4 py-2">
            DP World Tour
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            The Tournament
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            {info?.dates || 'March 6-9, 2025'} • {info?.venue || 'Muthaiga Golf Club'}
          </p>
        </div>
      </section>

      {/* Quick Info */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Trophy className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">{info?.purse || '$2,000,000'}</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Prize Fund</div>
            </div>
            <div>
              <Target className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">Par {info?.course_par || 71}</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Course</div>
            </div>
            <div>
              <Flag className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">{info?.course_yards || '6,902'}</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Yards</div>
            </div>
            <div>
              <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="font-subheading text-xl font-bold">156</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Players</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-spacing">
        <div className="container-custom">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full justify-start mb-8 bg-muted overflow-x-auto">
              <TabsTrigger value="about" className="font-subheading uppercase tracking-wider">About</TabsTrigger>
              <TabsTrigger value="course" className="font-subheading uppercase tracking-wider">The Course</TabsTrigger>
              <TabsTrigger value="schedule" className="font-subheading uppercase tracking-wider">Schedule</TabsTrigger>
              <TabsTrigger value="history" className="font-subheading uppercase tracking-wider">Past Winners</TabsTrigger>
            </TabsList>

            <TabsContent value="about" data-testid="tab-about">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="font-heading text-3xl font-bold mb-6">About the Tournament</h2>
                  <div className="prose prose-lg font-body text-muted-foreground">
                    <p className="mb-4">
                      The Magical Kenya Open is one of Africa's most prestigious golf tournaments, 
                      part of the DP World Tour. Held annually in Kenya, it showcases world-class 
                      golf while celebrating the country's rich culture and stunning landscapes.
                    </p>
                    <p className="mb-4">
                      The tournament attracts top international players and offers a unique 
                      combination of competitive golf and unforgettable experiences in one of 
                      the world's most beautiful destinations.
                    </p>
                    <p>
                      With its rich history dating back to 1967, the Kenya Open has grown to become 
                      a highlight of the African golfing calendar, promoting tourism and sports 
                      development across the continent.
                    </p>
                  </div>
                </div>
                <div>
                  <Card className="card-default overflow-hidden">
                    <img 
                      src="https://images.pexels.com/photos/30752232/pexels-photo-30752232.jpeg"
                      alt="Kenya landscape"
                      className="w-full h-64 object-cover"
                    />
                    <CardContent className="p-6">
                      <h3 className="font-heading text-xl font-bold mb-2">Defending Champion</h3>
                      <p className="text-muted-foreground font-body">
                        {info?.defending_champion || 'Guido Migliozzi'} returns to defend his title 
                        at the 2025 Magical Kenya Open.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="course" data-testid="tab-course">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h2 className="font-heading text-3xl font-bold mb-6">Muthaiga Golf Club</h2>
                  <div className="prose prose-lg font-body text-muted-foreground">
                    <p className="mb-4">
                      Muthaiga Golf Club, established in 1913, is one of Kenya's most prestigious 
                      golf courses. Located in the leafy suburbs of Nairobi, the club offers a 
                      challenging yet fair test of golf.
                    </p>
                    <p className="mb-4">
                      The course features beautifully manicured fairways lined with indigenous 
                      trees, strategic bunkers, and well-protected greens that reward precise 
                      shot-making and course management.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">18</div>
                        <div className="text-sm text-muted-foreground">Holes</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">{info?.course_par || 71}</div>
                        <div className="text-sm text-muted-foreground">Par</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">{info?.course_yards || '6,902'}</div>
                        <div className="text-sm text-muted-foreground">Yards</div>
                      </CardContent>
                    </Card>
                    <Card className="card-default">
                      <CardContent className="p-4 text-center">
                        <div className="font-subheading text-2xl font-bold text-primary">1913</div>
                        <div className="text-sm text-muted-foreground">Established</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                <div>
                  <img 
                    src={COURSE_BG}
                    alt="Muthaiga Golf Club"
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" data-testid="tab-schedule">
              <h2 className="font-heading text-3xl font-bold mb-8">Tournament Schedule</h2>
              <div className="space-y-4">
                {schedule.map((item, i) => (
                  <Card key={i} className="card-default">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="font-subheading text-2xl font-bold text-primary">{item.date}</div>
                          <div className="text-sm text-muted-foreground">{item.day}</div>
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-bold">{item.event}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{item.event.includes('Round') ? 'Competition' : 'Event'}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" data-testid="tab-history">
              <h2 className="font-heading text-3xl font-bold mb-8">Past Champions</h2>
              <Card className="card-default overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Year</th>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Champion</th>
                        <th className="px-6 py-4 text-left font-subheading font-semibold uppercase tracking-wider">Country</th>
                        <th className="px-6 py-4 text-center font-subheading font-semibold uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastWinners.map((winner, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/50">
                          <td className="px-6 py-4 font-subheading font-bold text-lg">{winner.year}</td>
                          <td className="px-6 py-4 font-body font-medium">
                            {winner.winner === 'Cancelled' ? (
                              <span className="text-muted-foreground italic">Cancelled</span>
                            ) : (
                              winner.winner
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{winner.country}</td>
                          <td className="px-6 py-4 text-center font-subheading font-bold text-primary">
                            {winner.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
