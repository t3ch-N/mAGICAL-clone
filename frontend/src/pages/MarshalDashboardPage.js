import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  ClipboardCheck, 
  Download, 
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Settings,
  BarChart3,
  Loader2,
  Eye,
  Edit,
  UserCheck,
  UserX,
  MapPin,
  RefreshCw
} from 'lucide-react';

const KOGL_LOGO = "https://customer-assets.emergentagent.com/job_magical-kenya-golf/artifacts/ft1exgdt_KOGL.png";

const roleLabels = {
  chief_marshal: 'Chief Marshal',
  area_supervisor: 'Area Supervisor',
  admin: 'Admin',
  viewer: 'Viewer'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const attendanceColors = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800'
};

const tournamentDates = [
  { value: '2026-02-19', label: 'Thursday, Feb 19' },
  { value: '2026-02-20', label: 'Friday, Feb 20' },
  { value: '2026-02-21', label: 'Saturday, Feb 21' },
  { value: '2026-02-22', label: 'Sunday, Feb 22' }
];

export default function MarshalDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  // Data states
  const [stats, setStats] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [marshalUsers, setMarshalUsers] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(tournamentDates[0].value);
  const [attendanceData, setAttendanceData] = useState([]);
  
  // New user form
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'viewer' });

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const sessionId = localStorage.getItem('marshal_session');
      if (!sessionId) {
        navigate('/marshal-login');
        return;
      }

      try {
        const response = await fetch(`${API}/marshal/me`, {
          
          headers: { 'Authorization': `Bearer ${sessionId}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('marshal_session');
          localStorage.removeItem('marshal_user');
          navigate('/marshal-login');
        }
      } catch {
        navigate('/marshal-login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch data
  const fetchData = useCallback(async () => {
    const sessionId = localStorage.getItem('marshal_session');
    const headers = { 'Authorization': `Bearer ${sessionId}` };
    
    try {
      const [statsRes, volunteersRes] = await Promise.all([
        fetch(`${API}/marshal/stats`, { headers,  }),
        fetch(`${API}/marshal/volunteers`, { headers,  })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (volunteersRes.ok) {
        const vols = await volunteersRes.json();
        setVolunteers(vols);
        setFilteredVolunteers(vols);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Filter volunteers
  useEffect(() => {
    let filtered = [...volunteers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.first_name?.toLowerCase().includes(term) ||
        v.last_name?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.phone?.includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(v => v.role === roleFilter);
    }
    
    setFilteredVolunteers(filtered);
  }, [volunteers, searchTerm, statusFilter, roleFilter]);

  // Fetch attendance data
  const fetchAttendance = async (date) => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/attendance/${date}`, {
        headers: { 'Authorization': `Bearer ${sessionId}` },
        
      });
      if (response.ok) {
        setAttendanceData(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceDate) {
      fetchAttendance(attendanceDate);
    }
  }, [activeTab, attendanceDate]);

  // Fetch marshal users
  const fetchMarshalUsers = async () => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/users`, {
        headers: { 'Authorization': `Bearer ${sessionId}` },
        
      });
      if (response.ok) {
        setMarshalUsers(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'chief_marshal') {
      fetchMarshalUsers();
    }
  }, [activeTab, user]);

  // Actions
  const handleLogout = async () => {
    const sessionId = localStorage.getItem('marshal_session');
    await fetch(`${API}/marshal/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionId}` },
      
    });
    localStorage.removeItem('marshal_session');
    localStorage.removeItem('marshal_user');
    navigate('/marshal-login');
  };

  const handleApprove = async (volunteerId) => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/volunteers/${volunteerId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        
      });
      if (response.ok) {
        toast.success('Volunteer approved');
        fetchData();
      }
    } catch {
      toast.error('Failed to approve volunteer');
    }
  };

  const handleReject = async (volunteerId) => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/volunteers/${volunteerId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionId}` },
        
      });
      if (response.ok) {
        toast.success('Volunteer rejected');
        fetchData();
      }
    } catch {
      toast.error('Failed to reject volunteer');
    }
  };

  const handleMarkAttendance = async (volunteerId, status) => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/attendance`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        
        body: JSON.stringify({
          volunteer_id: volunteerId,
          date: attendanceDate,
          status: status
        })
      });
      if (response.ok) {
        toast.success('Attendance marked');
        fetchAttendance(attendanceDate);
      }
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const handleCreateUser = async () => {
    const sessionId = localStorage.getItem('marshal_session');
    try {
      const response = await fetch(`${API}/marshal/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${sessionId}`,
          'Content-Type': 'application/json'
        },
        
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        toast.success('User created successfully');
        setShowCreateUserModal(false);
        setNewUser({ username: '', password: '', full_name: '', role: 'viewer' });
        fetchMarshalUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create user');
      }
    } catch {
      toast.error('Failed to create user');
    }
  };

  const handleExportVolunteers = () => {
    const sessionId = localStorage.getItem('marshal_session');
    window.open(`${API}/marshal/export/volunteers?format=csv`, '_blank');
  };

  const handleExportAttendance = () => {
    const sessionId = localStorage.getItem('marshal_session');
    window.open(`${API}/marshal/export/attendance/${attendanceDate}`, '_blank');
  };

  const canEdit = user?.role === 'chief_marshal' || user?.role === 'admin';
  const canMarkAttendance = user?.role !== 'viewer';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted" data-testid="marshal-dashboard">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Marshal Dashboard | MKO 2026</title>
      </Helmet>
      
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={KOGL_LOGO} alt="KOGL" className="h-10" />
            <div>
              <h1 className="font-heading text-lg font-bold">Marshal Dashboard</h1>
              <p className="text-xs text-primary-foreground/70">MKO 2026 Volunteer Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <Badge variant="secondary" className="text-xs">{roleLabels[user?.role]}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="volunteers" className="gap-2">
              <Users className="w-4 h-4" /> Volunteers
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <ClipboardCheck className="w-4 h-4" /> Attendance
            </TabsTrigger>
            {user?.role === 'chief_marshal' && (
              <TabsTrigger value="users" className="gap-2">
                <Settings className="w-4 h-4" /> Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Volunteers</p>
                      <p className="text-3xl font-bold">{stats?.total || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                    </div>
                    <Clock className="w-10 h-10 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-3xl font-bold text-green-600">{stats?.approved || 0}</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</p>
                    </div>
                    <XCircle className="w-10 h-10 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Marshals</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{stats?.by_role?.marshals || 0}</span>
                        <span className="text-xs text-muted-foreground">/ {stats?.quotas?.marshals_minimum}+ needed</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min((stats?.by_role?.marshals || 0) / stats?.quotas?.marshals_minimum * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Scorers</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{stats?.by_role?.scorers || 0}</span>
                        <span className="text-xs text-muted-foreground">/ {stats?.quotas?.scorers_maximum} max</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${(stats?.by_role?.scorers || 0) / stats?.quotas?.scorers_maximum * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('volunteers')}>
                    <Users className="w-4 h-4 mr-2" /> View All Volunteers
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setStatusFilter('pending'); setActiveTab('volunteers'); }}>
                    <Clock className="w-4 h-4 mr-2" /> Review Pending ({stats?.pending || 0})
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleExportVolunteers}>
                    <Download className="w-4 h-4 mr-2" /> Export Volunteer List
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Volunteer Management</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                      <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportVolunteers}>
                      <Download className="w-4 h-4 mr-1" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="marshal">Marshal</SelectItem>
                      <SelectItem value="scorer">Scorer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Volunteers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Availability</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolunteers.map((vol) => (
                        <tr key={vol.volunteer_id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                              <p className="text-xs text-muted-foreground">{vol.nationality}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{vol.email}</p>
                            <p className="text-xs text-muted-foreground">{vol.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{vol.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={statusColors[vol.status]}>{vol.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {['thursday', 'friday', 'saturday', 'sunday'].map((day, i) => (
                                <div
                                  key={day}
                                  className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${
                                    vol[`availability_${day}`] !== 'not_available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                                  }`}
                                  title={`${day}: ${vol[`availability_${day}`]}`}
                                >
                                  {['T', 'F', 'S', 'S'][i]}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => { setSelectedVolunteer(vol); setShowVolunteerModal(true); }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canEdit && vol.status === 'pending' && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(vol.volunteer_id)}>
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleReject(vol.volunteer_id)}>
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredVolunteers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No volunteers found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Attendance Tracking</CardTitle>
                  <div className="flex gap-2">
                    <Select value={attendanceDate} onValueChange={(v) => { setAttendanceDate(v); fetchAttendance(v); }}>
                      <SelectTrigger className="w-48">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentDates.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                      <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Location</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Status</th>
                        {canMarkAttendance && (
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Mark Attendance</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.map((vol) => (
                        <tr key={vol.volunteer_id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <p className="font-medium">{vol.first_name} {vol.last_name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{vol.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{vol.assigned_location || '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {vol.attendance_status ? (
                              <Badge className={attendanceColors[vol.attendance_status]}>
                                {vol.attendance_status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </td>
                          {canMarkAttendance && (
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-1">
                                <Button 
                                  variant={vol.attendance_status === 'present' ? 'default' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'present')}
                                >
                                  Present
                                </Button>
                                <Button 
                                  variant={vol.attendance_status === 'late' ? 'default' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'late')}
                                >
                                  Late
                                </Button>
                                <Button 
                                  variant={vol.attendance_status === 'absent' ? 'destructive' : 'outline'} 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleMarkAttendance(vol.volunteer_id, 'absent')}
                                >
                                  Absent
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {attendanceData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No approved volunteers to show
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab (Chief Marshal only) */}
          {user?.role === 'chief_marshal' && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <Button onClick={() => setShowCreateUserModal(true)}>
                      <UserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Username</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Full Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Last Login</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marshalUsers.map((u) => (
                          <tr key={u.marshal_id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{u.username}</td>
                            <td className="px-4 py-3">{u.full_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{roleLabels[u.role]}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {u.is_active ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Volunteer Detail Modal */}
      <Dialog open={showVolunteerModal} onOpenChange={setShowVolunteerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Volunteer Details</DialogTitle>
          </DialogHeader>
          {selectedVolunteer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedVolunteer.first_name} {selectedVolunteer.last_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <p>{selectedVolunteer.nationality}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID Number</Label>
                  <p>{selectedVolunteer.identification_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Golf Club</Label>
                  <p>{selectedVolunteer.golf_club || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p>{selectedVolunteer.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p>{selectedVolunteer.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Badge variant="outline" className="capitalize">{selectedVolunteer.role}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={statusColors[selectedVolunteer.status]}>{selectedVolunteer.status}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Volunteered Before</Label>
                  <p>{selectedVolunteer.volunteered_before ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Registered</Label>
                  <p>{new Date(selectedVolunteer.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Availability</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {tournamentDates.map((day, i) => (
                    <div key={day.value} className="text-center p-2 bg-muted rounded">
                      <p className="text-xs font-medium">{['Thu', 'Fri', 'Sat', 'Sun'][i]}</p>
                      <p className="text-xs capitalize">{selectedVolunteer[`availability_${['thursday', 'friday', 'saturday', 'sunday'][i]}`]?.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedVolunteer.assigned_location && (
                <div>
                  <Label className="text-xs text-muted-foreground">Assigned Location</Label>
                  <p>{selectedVolunteer.assigned_location}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {canEdit && selectedVolunteer?.status === 'pending' && (
              <>
                <Button variant="outline" className="text-red-600" onClick={() => { handleReject(selectedVolunteer.volunteer_id); setShowVolunteerModal(false); }}>
                  Reject
                </Button>
                <Button onClick={() => { handleApprove(selectedVolunteer.volunteer_id); setShowVolunteerModal(false); }}>
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the marshal dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area_supervisor">Area Supervisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
