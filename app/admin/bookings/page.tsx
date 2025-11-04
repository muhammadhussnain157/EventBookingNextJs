'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Ticket,
  Calendar,
  User,
  DollarSign,
  Search,
  Filter
} from 'lucide-react';

interface Booking {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  eventId: {
    _id: string;
    name: string;
    date: string;
    location: string;
    ticketPrice: number;
  };
  ticketQuantity: number;
  totalPrice: number;
  ticketId: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  bookingDate: string;
  cancellationDate?: string;
}

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

    fetchBookings();
  }, [user, router]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/admin/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.userId.name.toLowerCase().includes(term) ||
        booking.userId.email.toLowerCase().includes(term) ||
        booking.eventId.name.toLowerCase().includes(term) ||
        booking.ticketId.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
  };

  const calculateStats = () => {
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    return { totalRevenue, confirmedCount, cancelledCount, pendingCount };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/dashboard"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>

            <div className="flex items-center space-x-3">
              <Ticket className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${(stats.totalRevenue || 0).toFixed(2)}</p>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <Ticket className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.confirmedCount}</p>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <Ticket className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.cancelledCount}</p>
          </div>

          <div className="card p-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <Ticket className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, event, or ticket ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </p>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="card p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
            </h3>
            <p className="text-gray-600">
              {bookings.length === 0 
                ? 'Bookings will appear here when users make reservations' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const bookingDate = new Date(booking.bookingDate);
  const eventDate = new Date(booking.eventId.date);

  return (
    <div className="card p-6 animate-fade-up hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section - Main Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {booking.eventId.name}
              </h3>
              <p className="text-sm text-gray-600">Ticket ID: {booking.ticketId}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[booking.status]}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <User className="w-4 h-4 mr-2 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">{booking.userId.name}</p>
                  <p className="text-xs">{booking.userId.email}</p>
                  {booking.userId.phone && <p className="text-xs">{booking.userId.phone}</p>}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Event Date</p>
                  <p className="text-xs">
                    {eventDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Booking Details */}
        <div className="lg:text-right space-y-2 lg:min-w-[200px]">
          <div className="flex lg:justify-end items-center text-sm text-gray-600">
            <Ticket className="w-4 h-4 mr-2 text-primary" />
            <span>{booking.ticketQuantity} ticket{booking.ticketQuantity > 1 ? 's' : ''}</span>
          </div>

          <div className="flex lg:justify-end items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-primary" />
            <span className="text-lg font-bold text-gray-900">${(booking.totalPrice || 0).toFixed(2)}</span>
          </div>

          <p className="text-xs text-gray-500">
            Booked: {bookingDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>

          {booking.status === 'cancelled' && booking.cancellationDate && (
            <p className="text-xs text-red-600">
              Cancelled: {new Date(booking.cancellationDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
