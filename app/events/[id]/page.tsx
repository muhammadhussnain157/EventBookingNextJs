'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  ArrowLeft,
  Ticket,
  Clock,
  Info,
  Minus,
  Plus
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

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchEvent();
  }, [user, params.id, router]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      toast.error('Failed to load event');
      router.push('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!event) return;

    if (quantity > event.availableTickets) {
      toast.error('Not enough tickets available');
      return;
    }

    setIsBooking(true);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed');
      }

      toast.success('Booking confirmed! Check your bookings page.');
      router.push('/bookings');
    } catch (error: any) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const eventDate = new Date(event.date);
  const isAvailable = event.availableTickets > 0;
  const totalPrice = event.ticketPrice * quantity;

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="card overflow-hidden animate-fade-up">
              <div className="relative h-96 bg-gradient-to-br from-primary/20 to-secondary/20">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-24 h-24 text-primary/30" />
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-primary">
                  {event.category}
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="card p-6 animate-fade-up">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">
                      {eventDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold">
                      {eventDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-gray-500">Available Tickets</p>
                    <p className="font-semibold">{event.availableTickets} / {event.totalTickets}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start mb-4">
                  <Info className="w-5 h-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                  <h2 className="text-lg font-semibold text-gray-900">About this event</h2>
                </div>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 animate-fade-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book Tickets</h3>

              {/* Price */}
              <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Price per ticket</p>
                <div className="flex items-center text-3xl font-bold text-primary">
                  <DollarSign className="w-7 h-7" />
                  {event.ticketPrice.toFixed(2)}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Tickets
                </label>
                <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <span className="text-2xl font-bold text-gray-900">{quantity}</span>
                  
                  <button
                    onClick={() => setQuantity(Math.min(Math.min(event.availableTickets, 5), quantity + 1))}
                    disabled={quantity >= Math.min(event.availableTickets, 5)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Max 5 tickets per booking | {event.availableTickets} available
                </p>
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Tickets ({quantity})</span>
                  <span className="font-semibold">${(event.ticketPrice * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-primary">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={!isAvailable || isBooking}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : !isAvailable ? (
                  'Sold Out'
                ) : (
                  <>
                    <Ticket className="w-5 h-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </button>

              {isAvailable && event.availableTickets < 10 && (
                <p className="mt-3 text-sm text-orange-600 text-center">
                  ⚠️ Only {event.availableTickets} tickets left!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
