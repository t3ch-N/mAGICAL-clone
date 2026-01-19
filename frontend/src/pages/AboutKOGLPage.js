import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Building2,
  Target,
  Users,
  Globe,
  Award,
  Mail,
  FileText,
  Shield,
  Scale,
  BookOpen,
  Briefcase,
  ChevronRight,
  Download
} from 'lucide-react';

const KOGL_BG = "https://images.pexels.com/photos/1325744/pexels-photo-1325744.jpeg";

// Board Members
const boardMembers = [
  { 
    name: 'Peter Kanyago', 
    role: 'Chairman', 
    bio: 'Leading the strategic direction of KOGL with over 20 years of experience in sports administration.',
    image: null
  },
  { 
    name: 'Francis Njogu', 
    role: 'Vice Chairman', 
    bio: 'Overseeing tournament operations and player relations.',
    image: null
  },
  { 
    name: 'Susan Mwangi', 
    role: 'Secretary', 
    bio: 'Managing corporate governance and stakeholder communications.',
    image: null
  },
  { 
    name: 'John Kariuki', 
    role: 'Treasurer', 
    bio: 'Responsible for financial oversight and budget management.',
    image: null
  },
  { 
    name: 'David Odhiambo', 
    role: 'Director - Marketing', 
    bio: 'Driving brand partnerships and sponsorship relationships.',
    image: null
  },
  { 
    name: 'Grace Wanjiku', 
    role: 'Director - Operations', 
    bio: 'Coordinating tournament logistics and venue management.',
    image: null
  }
];

// Governance Structure
const governanceStructure = [
  {
    title: 'Board of Directors',
    description: 'The Board provides strategic oversight, ensuring KOGL operates with integrity and achieves its mission of promoting golf in Kenya.',
    icon: Users
  },
  {
    title: 'Tournament Committee',
    description: 'Responsible for the planning, execution, and delivery of the Magical Kenya Open to world-class standards.',
    icon: Award
  },
  {
    title: 'Finance & Audit Committee',
    description: 'Ensures financial transparency, compliance, and responsible stewardship of resources.',
    icon: Scale
  },
  {
    title: 'Marketing Committee',
    description: 'Manages brand positioning, sponsorship acquisition, and promotional activities.',
    icon: Globe
  }
];

// Policies
const policies = [
  {
    title: 'Code of Conduct',
    description: 'Standards of behavior expected from all stakeholders, officials, and participants.',
    icon: Shield
  },
  {
    title: 'Anti-Doping Policy',
    description: 'Commitment to clean sport in accordance with WADA and DP World Tour regulations.',
    icon: FileText
  },
  {
    title: 'Safeguarding Policy',
    description: 'Protection of children and vulnerable adults in all KOGL activities.',
    icon: Users
  },
  {
    title: 'Environmental Policy',
    description: 'Commitment to sustainable practices and environmental responsibility.',
    icon: Globe
  },
  {
    title: 'Diversity & Inclusion Policy',
    description: 'Promoting equal opportunity and diversity in all aspects of operations.',
    icon: Award
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect personal data.',
    icon: Shield
  }
];

// Partners
const partners = [
  'DP World Tour',
  'Magical Kenya',
  'Kenya Tourism Board',
  'Professional Golfers of Kenya',
  'Kenya Golf Union'
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
            Delivering excellence in golf tournament management since 1967
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

      {/* Tabs Section */}
      <section className="section-spacing bg-muted">
        <div className="container-custom">
          <Tabs defaultValue="governance" className="w-full">
            <TabsList className="w-full justify-start mb-8 bg-white overflow-x-auto flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="governance" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Scale className="w-4 h-4 mr-2" />
                Governance
              </TabsTrigger>
              <TabsTrigger value="board" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Board
              </TabsTrigger>
              <TabsTrigger value="policies" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Policies
              </TabsTrigger>
              <TabsTrigger value="partners" className="font-subheading uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white">
                <Briefcase className="w-4 h-4 mr-2" />
                Partners
              </TabsTrigger>
            </TabsList>

            {/* Governance Tab */}
            <TabsContent value="governance" data-testid="tab-governance">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Governance Structure</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  KOGL operates under a robust governance framework that ensures transparency, 
                  accountability, and effective decision-making at all levels of the organization.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {governanceStructure.map((item, i) => (
                  <Card key={i} className="card-default hover-lift" data-testid={`governance-${i}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg font-bold mb-2">{item.title}</h3>
                          <p className="text-muted-foreground font-body text-sm">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-default mt-8">
                <CardContent className="p-6">
                  <h3 className="font-heading text-xl font-bold mb-4">Our Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Integrity</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Operating with honesty and transparency in all dealings
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-secondary text-secondary-foreground flex items-center justify-center mx-auto mb-3">
                        <Award className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Excellence</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Striving for the highest standards in everything we do
                      </p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-subheading font-semibold mb-2">Inclusivity</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Welcoming everyone to experience the joy of golf
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board" data-testid="tab-board">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Board of Directors</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  Our Board comprises experienced professionals dedicated to advancing 
                  the mission of KOGL and promoting golf development in Kenya.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boardMembers.map((member, i) => (
                  <Card key={i} className="card-default hover-lift" data-testid={`board-member-${i}`}>
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold">{member.name}</h3>
                      <Badge variant="outline" className="mt-2 mb-3">{member.role}</Badge>
                      <p className="text-muted-foreground font-body text-sm">{member.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" data-testid="tab-policies">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Policies & Guidelines</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  KOGL maintains comprehensive policies to ensure responsible governance, 
                  ethical conduct, and compliance with international sporting standards.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map((policy, i) => (
                  <Card key={i} className="card-default hover-lift group cursor-pointer" data-testid={`policy-${i}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                          <policy.icon className="w-5 h-5 text-primary" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-2">{policy.title}</h3>
                      <p className="text-muted-foreground font-body text-sm">{policy.description}</p>
                      <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto text-primary hover:text-primary/80">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-default mt-8 bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-heading font-bold">Annual Reports</h4>
                      <p className="text-muted-foreground text-sm font-body">
                        Access our annual reports for detailed information on KOGL's activities and financial performance.
                      </p>
                    </div>
                    <Button variant="outline" className="ml-auto">
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" data-testid="tab-partners">
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold mb-4">Our Partners</h2>
                <p className="text-muted-foreground font-body max-w-3xl">
                  Working together with leading organizations to deliver excellence in golf
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                {partners.map((partner, i) => (
                  <Card key={i} className="card-default hover-lift">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-3">
                        <Globe className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-subheading font-semibold text-sm">{partner}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-feature">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-white mb-4">
                        Become a Partner
                      </h3>
                      <p className="text-primary-foreground/80 font-body mb-6">
                        Join us in showcasing Kenya to the world through world-class golf. 
                        We offer various partnership and sponsorship opportunities.
                      </p>
                      <Link to="/contact">
                        <Button className="btn-secondary">
                          <Mail className="w-4 h-4 mr-2" />
                          Enquire About Partnerships
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="w-32 h-32 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                        <Briefcase className="w-16 h-16 text-accent" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Objectives */}
      <section className="section-spacing">
        <div className="container-custom">
          <h2 className="font-heading text-3xl font-bold mb-12 text-center">Our Strategic Objectives</h2>
          
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

      {/* Contact CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Get In Touch
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Interested in sponsorship, partnerships, or have questions about KOGL? We'd love to hear from you.
          </p>
          <Link to="/contact">
            <Button variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2">
              <Mail className="w-4 h-4" />
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
