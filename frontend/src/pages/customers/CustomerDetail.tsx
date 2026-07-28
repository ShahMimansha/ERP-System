import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiChevronLeft,
  FiEdit,
  FiAlertCircle,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiCalendar,
  FiHash,
  FiSend,
  FiLoader,
  FiMessageSquare,
} from 'react-icons/fi';
import api from '../../api/axios';
import type { Customer, FollowUp } from '../../types';
import {
  getStatusBadgeClasses,
  getStatusLabel,
  getTypeBadgeClasses,
  getTypeLabel,
  formatDate,
  formatDateTime,
  isDatePast,
} from '../../utils/helpers';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [followUpContent, setFollowUpContent] = useState('');
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const { data: customer, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data.data.customer as Customer;
    },
    enabled: !!id,
  });

  const addFollowUpMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/customers/${id}/followups`, { content });
      return response.data.data.followUp as FollowUp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setFollowUpContent('');
      setFollowUpError(null);
    },
    onError: (error: any) => {
      setFollowUpError(error.response?.data?.message || 'Failed to add follow-up. Please try again.');
    },
  });

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpContent.trim()) {
      setFollowUpError('Follow-up content cannot be empty');
      return;
    }
    setFollowUpError(null);
    addFollowUpMutation.mutate(followUpContent.trim());
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-6">
            <div>
            <div className="h-4 w-28 bg-slate-100 rounded mb-3" />
            <div className="h-8 w-56 bg-slate-100 rounded" />
            </div>
            <div className="flex gap-2">
            <div className="h-10 w-28 bg-slate-100 rounded" />
            <div className="h-10 w-36 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-5 w-full bg-slate-100 rounded" />
            </div>
          ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="h-6 w-40 bg-slate-100 rounded mb-6" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="h-4 w-40 bg-slate-100 rounded mb-3" />
              <div className="h-4 w-full bg-slate-100 rounded mb-1" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load customer</h3>
            <p className="text-slate-500 mb-4">The customer may not exist or you do not have permission.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <FiRefreshCw />
                Retry
              </button>
              <Link
                to="/customers"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const followUps = customer.followUps || [];
  const showFollowUpWarning = isDatePast(customer.followUpDate);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <FiChevronLeft />
            Back to Customers
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
            <span className={getStatusBadgeClasses(customer.status)}>
              {getStatusLabel(customer.status)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            <FiChevronLeft />
            Back to List
          </Link>
          <Link
            to={`/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiEdit />
            Edit Customer
          </Link>
        </div>
      </div>

      {showFollowUpWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-amber-800 font-medium">Follow-up date is overdue</div>
            <div className="text-amber-700 text-sm mt-0.5">
              The scheduled follow-up date was {formatDate(customer.followUpDate)}. Please schedule a new follow-up or mark this customer accordingly.
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiUser className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Name</div>
              <div className="text-slate-800 font-medium truncate">{customer.name}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiPhone className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mobile</div>
              <a href={`tel:${customer.mobile}`} className="text-slate-800 font-medium hover:text-blue-600 transition-colors">
                {customer.mobile}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiMail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</div>
              <a href={`mailto:${customer.email}`} className="text-slate-800 font-medium hover:text-blue-600 transition-colors truncate block">
                {customer.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiBriefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business</div>
              <div className="text-slate-800 font-medium truncate">{customer.businessName}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiHash className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">GST Number</div>
              <div className="text-slate-800 font-medium truncate">{customer.gstNumber || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiFileText className="w-5 h-5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Customer Type</div>
              <div className="pt-1">
                <span className={getTypeBadgeClasses(customer.customerType)}>
                  {getTypeLabel(customer.customerType)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiCalendar className="w-5 h-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Follow Up Date</div>
              <div className={`font-medium truncate ${showFollowUpWarning ? 'text-amber-700' : 'text-slate-800'}`}>
                {formatDate(customer.followUpDate)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiMapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</div>
              <div className="text-slate-800 font-medium break-words">{customer.address}</div>
            </div>
          </div>

          {customer.notes && (
            <div className="flex items-start gap-3 md:col-span-2 lg:col-span-3">
              <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiFileText className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</div>
                <div className="text-slate-800 font-medium whitespace-pre-wrap break-words">{customer.notes}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FiMessageSquare className="w-5 h-5" />
            Follow-ups
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              {followUps.length}
            </span>
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          {followUps.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No follow-ups yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first follow-up note below.</p>
            </div>
          ) : (
            followUps.map((followUp) => (
              <div key={followUp.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-sm">
                        {(followUp.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {followUp.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateTime(followUp.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-11">
                  {followUp.content}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddFollowUp}>
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Follow-up Note</h3>
            {followUpError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {followUpError}
              </div>
            )}
            <textarea
              value={followUpContent}
              onChange={(e) => setFollowUpContent(e.target.value)}
              rows={4}
              placeholder="Add notes about this follow-up call, meeting, or conversation..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 resize-y mb-3"
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={addFollowUpMutation.isPending || !followUpContent.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {addFollowUpMutation.isPending ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Submit Follow-up
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerDetail;
