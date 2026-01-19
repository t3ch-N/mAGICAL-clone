import React, { useState, useEffect } from 'react';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { toast } from 'sonner';
import { 
  Ticket,
  Crown,
  Users,
  Star,
  Check,
  ArrowRight,
  Mail
} from 'lucide-react';

const HOSPITALITY_BG = "https://images.pexels.com/photos/1766957/pexels-photo-1766957.jpeg";

const defaultPackages = [
  {
    package_id: 'daily-1',
    name: 'Daily Pass',
    description: 'Full day access to the tournament grounds with access to general viewing areas.',
    price_range: 'KES 2,500 - 5,000',
    category: 'daily',
    features: [
      'Tournament ground access',
      'General viewing areas',
      'Food & beverage outlets',
      'Official merchandise shop'
    ],
    image_url: 'https://images.pexels.com/photos/1325744/pexels-photo-1325744.jpeg'
  },
  {
    package_id: 'weekly-1',
    name: 'Weekly Pass',
    description: 'Full access for all four days of the tournament with exclusive benefits.',
    price_range: 'KES 8,000 - 15,000',
    category: 'weekly',
    features: [
      'All 4 days tournament access',
      'Reserved seating areas',
      'Tournament program included',
      'Priority entry lanes'
    ],
    image_url: 'https://images.pexels.com/photos/9207751/pexels-photo-9207751.jpeg'
  },
  {
    package_id: 'hospitality-1',
    name: 'Clubhouse Experience',
    description: 'Premium hospitality with exclusive access to the clubhouse and fine dining.',
    price_range: 'KES 50,000 - 80,000',
    category: 'hospitality',
    features: [
      'Exclusive clubhouse access',
      'Gourmet dining experience',
      'Premium bar service',
      'Best viewing positions',
      'Meet & greet opportunities'
    ],
    image_url: 'https://images.pexels.com/photos/1766957/pexels-photo-1766957.jpeg'
  },
  {
    package_id: 'hospitality-2',
    name: 'Corporate Suite',
    description: 'Ultimate VIP experience for corporate entertaining and networking.',
    price_range: 'KES 150,000+',
    category: 'hospitality',
    features: [
      'Private corporate suite',
      'Dedicated host & concierge',
      'Premium catering (10-20 guests)',
      'Exclusive networking events',
      'Player appearance opportunities',
      'Branded signage option'
    ],
    image_url: 'https://images.pexels.com/photos/6256827/pexels-photo-6256827.jpeg'
  }
];

export default function TicketsPage() {
  const [packages, setPackages] = useState(defaultPackages);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enquiry_type: 'tickets',
    package_id: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/tickets/packages`)
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) setPackages(data);
      })
      .catch(() => {});
  }, []);

  const handleEnquiry = (pkg) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({
      ...prev,
      package_id: pkg?.package_id || '',
      enquiry_type: pkg?.category === 'hospitality' ? 'hospitality' : 'tickets'
    }));
    setEnquiryOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Enquiry submitted successfully! We\'ll be in touch soon.');
        setEnquiryOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          enquiry_type: 'tickets',
          package_id: '',
          message: ''
        });
      } else {
        toast.error('Failed to submit enquiry. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hospitality': return Crown;
      case 'weekly': return Users;
      default: return Ticket;
    }
  };

  const dailyPackages = packages.filter(p => p.category === 'daily');
  const weeklyPackages = packages.filter(p => p.category === 'weekly');
  const hospitalityPackages = packages.filter(p => p.category === 'hospitality');

  return (
    <div data-testid="tickets-page">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HOSPITALITY_BG})` }}
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-custom text-center">
          <Badge className="bg-accent text-accent-foreground mb-4 px-4 py-2">
            Tickets Available
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4">
            Tickets & Hospitality
          </h1>
          <p className="text-white/80 text-lg font-body max-w-2xl mx-auto">
            Experience the Magical Kenya Open with our range of ticket options and premium hospitality packages.
          </p>
        </div>
      </section>

      {/* Ticket Options */}
      <section className="section-spacing">
        <div className="container-custom">
          {/* Daily & Weekly Passes */}
          <div className="mb-16">
            <h2 className="font-heading text-3xl font-bold mb-2">General Admission</h2>
            <p className="text-muted-foreground font-body mb-8">
              Daily and weekly passes for golf enthusiasts
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...dailyPackages, ...weeklyPackages].map((pkg) => {
                const Icon = getCategoryIcon(pkg.category);
                return (
                  <Card key={pkg.package_id} className="card-default hover-lift" data-testid={`package-${pkg.package_id}`}>
                    <CardContent className="p-0">
                      {pkg.image_url && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={pkg.image_url} 
                            alt={pkg.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {pkg.category === 'weekly' ? 'Best Value' : 'Daily'}
                            </Badge>
                            <h3 className="font-heading text-xl font-bold">{pkg.name}</h3>
                          </div>
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-muted-foreground font-body text-sm mb-4">
                          {pkg.description}
                        </p>
                        <ul className="space-y-2 mb-6">
                          {pkg.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm font-body">
                              <Check className="w-4 h-4 text-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between">
                          <div className="font-subheading text-lg font-bold text-primary">
                            {pkg.price_range}
                          </div>
                          <Button 
                            onClick={() => handleEnquiry(pkg)}
                            className="btn-primary"
                            data-testid={`enquire-${pkg.package_id}`}
                          >
                            Enquire
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Hospitality */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-accent" />
              <h2 className="font-heading text-3xl font-bold">Premium Hospitality</h2>
            </div>
            <p className="text-muted-foreground font-body mb-8">
              Exclusive experiences for discerning guests and corporate entertaining
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {hospitalityPackages.map((pkg) => (
                <Card key={pkg.package_id} className="card-default overflow-hidden group" data-testid={`package-${pkg.package_id}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                    <div className="h-64 md:h-auto overflow-hidden">
                      <img 
                        src={pkg.image_url} 
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-6 flex flex-col">
                      <Badge className="w-fit mb-2 bg-accent text-accent-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                      <h3 className="font-heading text-xl font-bold mb-2">{pkg.name}</h3>
                      <p className="text-muted-foreground font-body text-sm mb-4">
                        {pkg.description}
                      </p>
                      <ul className="space-y-2 mb-6 flex-1">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm font-body">
                            <Check className="w-4 h-4 text-accent" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border/40 pt-4">
                        <div className="font-subheading text-xl font-bold text-primary mb-3">
                          {pkg.price_range}
                        </div>
                        <Button 
                          onClick={() => handleEnquiry(pkg)}
                          className="w-full btn-primary"
                          data-testid={`enquire-${pkg.package_id}`}
                        >
                          Request Information
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-custom text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-primary-foreground/80 font-body mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the perfect ticket or hospitality package for your needs.
          </p>
          <Button 
            onClick={() => handleEnquiry(null)}
            variant="outline"
            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            data-testid="general-enquiry-btn"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Our Team
          </Button>
        </div>
      </section>

      {/* Enquiry Dialog */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md" data-testid="enquiry-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {selectedPackage ? `Enquire About ${selectedPackage.name}` : 'General Enquiry'}
            </DialogTitle>
            <DialogDescription className="font-body">
              Fill in your details and we'll get back to you shortly.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                data-testid="enquiry-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                data-testid="enquiry-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="enquiry-phone"
              />
            </div>
            <div>
              <Label htmlFor="enquiry_type">Enquiry Type</Label>
              <Select 
                value={formData.enquiry_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, enquiry_type: value }))}
              >
                <SelectTrigger data-testid="enquiry-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                rows={4}
                data-testid="enquiry-message"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary"
              disabled={submitting}
              data-testid="enquiry-submit"
            >
              {submitting ? 'Submitting...' : 'Submit Enquiry'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
