'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import CountUp from 'react-countup';
import { 
  Users, 
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ChevronRight
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
}

interface RecentBooking {
  _id: string;
  ticketId: string;
  userId: { name: string; email: string };
  eventId: { name: string; date: string };
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      router.push('/home');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setStats(data.stats);
      setRecentBookings(data.recentBookings);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { useAuthStore } = await import('@/store/authStore');
      await fetch('/api/auth/logout', { method: 'POST' });
      useAuthStore.getState().logout();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/admin/create-event"
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            title="Total Events"
            value={stats.totalEvents}
            color="purple"
            trend="+8%"
          />
          <StatCard
            icon={<Ticket className="w-8 h-8" />}
            title="Total Bookings"
            value={stats.totalBookings}
            color="green"
            trend="+23%"
          />
          <StatCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Total Revenue"
            value={stats.totalRevenue}
            prefix="$"
            color="orange"
            trend="+18%"
            isPrice
          />
        </div>

        {/* Booking Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmed</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              <CountUp end={stats.confirmedBookings} duration={2} />
            </p>
            <p className="text-sm text-gray-500 mt-2">Active bookings</p>
          </div>

          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancelled</h3>
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">
              <CountUp end={stats.cancelledBookings} duration={2} />
            </p>
            <p className="text-sm text-gray-500 mt-2">Cancelled bookings</p>
          </div>

          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              <CountUp end={stats.pendingBookings} duration={2} />
            </p>
            <p className="text-sm text-gray-500 mt-2">Awaiting confirmation</p>
          </div>
        </div>

        {/* Quick Actions & Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="card p-6 animate-fade-up">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <QuickActionButton
                icon={<Calendar className="w-5 h-5" />}
                title="Manage Events"
                description="View and edit all events"
                href="/admin/events"
              />
              <QuickActionButton
                icon={<Ticket className="w-5 h-5" />}
                title="Manage Bookings"
                description="View all booking details"
                href="/admin/bookings"
              />
              <QuickActionButton
                icon={<Users className="w-5 h-5" />}
                title="Manage Users"
                description="View and manage user accounts"
                href="/admin/users"
              />
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
              <Link
                href="/admin/bookings"
                className="text-sm text-primary hover:underline flex items-center"
              >
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              ) : (
                recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {booking.eventId.name}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{booking.userId.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">#{booking.ticketId}</span>
                      <span className="text-sm font-semibold text-primary">
                        ${booking.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  prefix = '', 
  color, 
  trend, 
  isPrice = false 
}: any) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="card p-6 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} text-white`}>
          {icon}
        </div>
        <div className="flex items-center text-sm text-green-600 font-semibold">
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {prefix}
        <CountUp 
          end={isPrice ? value : value} 
          duration={2} 
          decimals={isPrice ? 2 : 0}
          separator=","
        />
      </p>
    </div>
  );
}

function QuickActionButton({ icon, title, description, href }: any) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
    </Link>
  );
}
