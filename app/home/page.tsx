'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import { 
  Calendar, 
  MapPin, 
  Search, 
  Filter,
  Ticket,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  availableTickets: number;
}

const categories = ['All', 'Music', 'Sports', 'Arts', 'Tech', 'Food', 'Business', 'Other'];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!user) {
      router.push('/login');
      return;
    }

    fetchEvents();
  }, [user, router]);

  useEffect(() => {
    filterEvents();
  }, [selectedCategory, searchQuery, events]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events);
      setFilteredEvents(data.events);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
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
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Event Booking</h1>
                <p className="text-sm text-gray-500">Discover amazing events</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/bookings"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Ticket className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">My Bookings</span>
              </Link>
              
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700">{user?.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by name, location..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all flex-shrink-0 ${
                  selectedCategory === category
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const isAvailable = event.availableTickets > 0;

  return (
    <div
      onClick={() => router.push(`/events/${event._id}`)}
      className="card overflow-hidden cursor-pointer group animate-fade-up"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-primary">
          {event.category}
        </div>

        {/* Availability Badge */}
        <div className={`absolute bottom-3 left-3 px-3 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${
          isAvailable ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {isAvailable ? `${event.availableTickets} tickets left` : 'Sold Out'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            {eventDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {event.location}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center text-lg font-bold text-primary">
              <DollarSign className="w-5 h-5" />
              {event.ticketPrice.toFixed(2)}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/events/${event._id}`);
              }}
              disabled={!isAvailable}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isAvailable
                  ? 'bg-primary text-white hover:bg-primary-600 hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAvailable ? 'Book Now' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
