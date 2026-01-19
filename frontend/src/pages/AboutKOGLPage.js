import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Building2,
  Target,
  Users,
  Globe,
  Award,
  Mail
} from 'lucide-react';

const KOGL_BG = "https://images.pexels.com/photos/1325744/pexels-photo-1325744.jpeg";

const team = [
  { name: 'Board of Directors', role: 'Leadership', description: 'Strategic oversight and governance' },
  { name: 'Tournament Committee', role: 'Operations', description: 'Day-to-day tournament management' },
  { name: 'Marketing Team', role: 'Promotion', description: 'Brand and sponsorship management' },
  { name: 'Youth Programs', role: 'Development', description: 'Junior golf initiatives' }
];

const partners = [
  'DP World Tour',
  'Magical Kenya',
  'Kenya Tourism Board',
  'Professional Golfers of Kenya'
];

export default function AboutKOGLPage() {
  return (
    <div data-testid="about-kogl-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${KOGL_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            The Organization
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            Kenya Open Golf Limited
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            The organization behind the Magical Kenya Open
          </p>
        </div>
      </section>

      {/* About */}
      <section className="section-spacing">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                About KOGL
              </h2>
              <div className="prose prose-lg font-body text-muted-foreground">
                <p className="mb-4">
                  Kenya Open Golf Limited (KOGL) is the organization responsible for staging 
                  the Magical Kenya Open, one of Africa's most prestigious golf tournaments 
                  and a proud member of the DP World Tour.
                </p>
                <p className="mb-4">
                  Founded with the mission to elevate Kenyan golf to international standards, 
                  KOGL works in close partnership with the DP World Tour, Kenya Tourism Board, 
                  and various stakeholders to deliver a world-class tournament experience.
                </p>
                <p>
                  Beyond organizing the annual tournament, KOGL is committed to developing 
                  golf at all levels in Kenya, from grassroots junior programs to professional 
                  player development initiatives.
                </p>
              </div>
            </div>
            <div>
              <Card className="card-feature">
                <CardContent className="p-8">
                  <Building2 className="w-12 h-12 text-accent mb-6" />
                  <h3 className="font-heading text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-primary-foreground/80 font-body">
                    To deliver a world-class golf tournament that showcases Kenya's 
                    potential as a premier sporting destination while developing the 
                    next generation of Kenyan golfers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-12 text-center">Our Objectives</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Target className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Tournament Excellence</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Deliver a best-in-class tournament experience for players and spectators
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Global Visibility</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Showcase Kenya to a worldwide audience through international broadcast
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Youth Development</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Nurture young talent through comprehensive junior golf programs
                </p>
              </CardContent>
            </Card>
            <Card className="card-default hover-lift">
              <CardContent className="p-6 text-center">
                <Award className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold mb-2">Legacy Building</h3>
                <p className="text-muted-foreground font-body text-sm">
                  Create lasting impact on Kenyan golf and sports tourism
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Structure */}
      <section className="section-spacing">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-12 text-center">Our Structure</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <Card key={i} className="card-default" data-testid={`team-${i}`}>
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3">{member.role}</Badge>
                  <h3 className="font-heading text-lg font-bold mb-2">{member.name}</h3>
                  <p className="text-muted-foreground font-body text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="section-spacing bg-muted">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground font-body mb-12 max-w-2xl mx-auto">
            Working together with leading organizations to deliver excellence
          </p>
          
          <div className="flex flex-wrap justify-center gap-8">
            {partners.map((partner, i) => (
              <div 
                key={i}
                className="px-8 py-4 bg-white border border-border/40"
              >
                <span className="font-subheading font-semibold text-primary">{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Partner With Us
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Interested in sponsorship or partnership opportunities? We'd love to hear from you.
          </p>
          <Link to="/contact">
            <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2">
              <Mail className="w-4 h-4" />
              Get In Touch
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
