'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Calendar, Loader2 } from 'lucide-react';

const categories = ['Music', 'Sports', 'Arts', 'Tech', 'Food', 'Business', 'Other'];

interface EventData {
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  ticketPrice: number;
  totalTickets: number;
  imageUrl: string;
  availableTickets: number;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<EventData>({
    name: '',
    description: '',
    category: 'Music',
    location: '',
    date: '',
    ticketPrice: 0,
    totalTickets: 0,
    imageUrl: '',
    availableTickets: 0,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

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

    fetchEvent();
  }, [user, router, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      
      const data = await response.json();
      
      // Format date for datetime-local input
      const eventDate = new Date(data.date);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      
      setFormData({
        name: data.name,
        description: data.description,
        category: data.category,
        location: data.location,
        date: formattedDate,
        ticketPrice: data.ticketPrice,
        totalTickets: data.totalTickets,
        imageUrl: data.imageUrl,
        availableTickets: data.availableTickets,
      });
      
      setImagePreview(data.imageUrl);
    } catch (error) {
      toast.error('Failed to load event');
      router.push('/admin/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl; // Return existing URL if no new image

    setIsUploading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('file', imageFile);
    formDataToSend.append('upload_preset', 'ml_default');
    formDataToSend.append('folder', 'event-booking/events');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataToSend,
        }
      );

      if (!response.ok) throw new Error('Image upload failed');

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.ticketPrice <= 0) {
      toast.error('Ticket price must be greater than 0');
      return;
    }

    if (formData.totalTickets <= 0) {
      toast.error('Total tickets must be greater than 0');
      return;
    }

    const ticketsSold = formData.totalTickets - formData.availableTickets;
    if (formData.totalTickets < ticketsSold) {
      toast.error(`Cannot reduce total tickets below ${ticketsSold}. ${ticketsSold} tickets have already been sold.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if changed
      const imageUrl = await uploadImage();
      
      if (imageFile && !imageUrl) {
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`/api/events/${eventId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl || formData.imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update event');
      }

      toast.success('Event updated successfully!');
      router.push('/admin/events');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  const ticketsSold = formData.totalTickets - formData.availableTickets;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/admin/events')}
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Events
            </button>

            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Image
            </label>
            <div className="flex flex-col items-center">
              {imagePreview && (
                <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Event preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  {imageFile ? 'Change Image' : 'Upload New Image (Optional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Max size: 10MB</p>
            </div>
          </div>

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Enter event name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input-field"
              placeholder="Enter event location"
            />
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date and Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Ticket Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price ($) *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.ticketPrice}
              onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) || 0 })}
              className="input-field"
              placeholder="0.00"
            />
          </div>

          {/* Total Tickets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tickets *
            </label>
            <input
              type="number"
              required
              min={ticketsSold}
              value={formData.totalTickets}
              onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) || 0 })}
              className="input-field"
              placeholder="Enter total tickets"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tickets sold: {ticketsSold} | Available: {formData.availableTickets}
            </p>
            {ticketsSold > 0 && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Cannot reduce below {ticketsSold} tickets (already sold)
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              placeholder="Enter event description"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/events')}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isUploading ? 'Uploading Image...' : 'Updating Event...'}
                </>
              ) : (
                'Update Event'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
