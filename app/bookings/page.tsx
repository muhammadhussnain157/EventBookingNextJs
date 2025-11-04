'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import BottomNav from '@/components/BottomNav';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  ArrowLeft,
  Ticket,
  X,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Booking {
  _id: string;
  ticketId: string;
  quantity: number;
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  bookingDate: string;
  eventId: {
    _id: string;
    name: string;
    description: string;
    category: string;
    location: string;
    date: string;
    imageUrl: string;
    ticketPrice: number;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchBookings();
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, totalQuantity: number) => {
    let cancelQuantity = 1;
    
    // If more than 1 ticket, ask how many to cancel
    if (totalQuantity > 1) {
      const quantity = prompt(`How many tickets do you want to cancel? (1-${totalQuantity})`);
      
      if (!quantity) return; // User cancelled
      
      cancelQuantity = parseInt(quantity);
      
      if (isNaN(cancelQuantity) || cancelQuantity < 1 || cancelQuantity > totalQuantity) {
        toast.error(`Please enter a number between 1 and ${totalQuantity}`);
        return;
      }
    }

    const confirmMessage = cancelQuantity === totalQuantity
      ? 'Are you sure you want to cancel this entire booking?'
      : `Are you sure you want to cancel ${cancelQuantity} ticket(s)?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelQuantity }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
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
            <button
              onClick={() => router.push('/home')}
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>

            <div className="flex items-center space-x-3">
              <Ticket className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            </div>

            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Ticket className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start exploring events and book your first ticket!</p>
            <Link
              href="/home"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BookingCard({ 
  booking, 
  onCancel 
}: { 
  booking: Booking; 
  onCancel: (id: string, quantity: number) => void;
}) {
  const router = useRouter();
  const eventDate = new Date(booking.eventId.date);
  const bookingDate = new Date(booking.bookingDate);
  const isPastEvent = eventDate < new Date();

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'confirmed':
        return (
          <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirmed
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <XCircle className="w-4 h-4 mr-1" />
            Cancelled
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </div>
        );
    }
  };

  return (
    <div className="card overflow-hidden animate-fade-up">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-64 h-48 md:h-auto bg-gradient-to-br from-primary/20 to-secondary/20">
          {booking.eventId.imageUrl ? (
            <Image
              src={booking.eventId.imageUrl}
              alt={booking.eventId.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-primary/30" />
            </div>
          )}

          {/* Ticket ID Badge */}
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-mono font-semibold">
            #{booking.ticketId}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {booking.eventId.name}
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {getStatusBadge()}
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {booking.eventId.category}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Event Date</p>
                <p className="font-semibold">
                  {eventDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold">{booking.eventId.location}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Ticket className="w-5 h-5 mr-2 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Tickets</p>
                <p className="font-semibold">{booking.quantity} ticket(s)</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              <div>
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="font-semibold text-primary">${booking.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Booked on {bookingDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/events/${booking.eventId._id}`)}
              className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-semibold"
            >
              View Event
            </button>

            {booking.status === 'confirmed' && !isPastEvent && (
              <button
                onClick={() => onCancel(booking._id, booking.quantity)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel {booking.quantity > 1 ? `(${booking.quantity} tickets)` : 'Booking'}
              </button>
            )}

            {isPastEvent && booking.status === 'confirmed' && (
              <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
                Event Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
