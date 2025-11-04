'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Ticket,
  Trash2,
  Plus,
  Eye,
  Edit
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
  createdAt: string;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
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

    fetchEvents();
  }, [user, router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This will cancel all related bookings.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete event');
      }

      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
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
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
            </div>

            <Link
              href="/admin/create-event"
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Total: {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="card p-12 text-center animate-fade-up">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started</p>
            <Link
              href="/admin/create-event"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ 
  event, 
  onDelete 
}: { 
  event: Event; 
  onDelete: (id: string, name: string) => void;
}) {
  const router = useRouter();
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  const soldPercentage = ((event.totalTickets - event.availableTickets) / event.totalTickets) * 100;

  return (
    <div className="card overflow-hidden animate-fade-up group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-primary">
          {event.category}
        </div>

        {isPastEvent && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-red-500/90 text-white rounded-full text-xs font-semibold">
            Past Event
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {event.name}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
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

          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-primary" />
            ${event.ticketPrice.toFixed(2)} per ticket
          </div>
        </div>

        {/* Ticket Sales Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Tickets Sold</span>
            <span>{event.totalTickets - event.availableTickets} / {event.totalTickets}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${soldPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/events/${event._id}`)}
            className="flex-1 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-semibold text-sm flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>
          <button
            onClick={() => router.push(`/admin/events/${event._id}/edit`)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm flex items-center"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event._id, event.name)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm flex items-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
