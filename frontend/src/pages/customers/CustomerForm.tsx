import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiX, FiLoader, FiAlertCircle, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';
import { CustomerStatus, CustomerType } from '../../types';
import type { Customer, CustomerFormData } from '../../types';
import { formatDateForInput } from '../../utils/helpers';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().optional(),
  customerType: z.enum([CustomerType.RETAIL, CustomerType.WHOLESALE, CustomerType.DISTRIBUTOR]),
  address: z.string().min(1, 'Address is required'),
  status: z.enum([CustomerStatus.LEAD, CustomerStatus.ACTIVE, CustomerStatus.INACTIVE]),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

const CustomerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = id !== undefined && id !== 'new';
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: CustomerType.RETAIL,
      address: '',
      status: CustomerStatus.LEAD,
      followUpDate: '',
      notes: '',
    },
  });

  const { data: fetchedCustomer, isLoading: isFetching, isError: fetchError, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data.data.customer as Customer;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (fetchedCustomer) {
      reset({
        name: fetchedCustomer.name,
        mobile: fetchedCustomer.mobile,
        email: fetchedCustomer.email,
        businessName: fetchedCustomer.businessName,
        gstNumber: fetchedCustomer.gstNumber || '',
        customerType: fetchedCustomer.customerType,
        address: fetchedCustomer.address,
        status: fetchedCustomer.status,
        followUpDate: formatDateForInput(fetchedCustomer.followUpDate),
        notes: fetchedCustomer.notes || '',
      });
    }
  }, [fetchedCustomer, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.followUpDate) delete payload.followUpDate;
      if (!payload.gstNumber) delete payload.gstNumber;
      if (!payload.notes) delete payload.notes;
      const response = await api.post('/customers', payload);
      return response.data.data.customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSuccessBanner('Customer created successfully!');
      setTimeout(() => {
        navigate('/customers');
      }, 1200);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || 'Failed to create customer. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.followUpDate) payload.followUpDate = null;
      if (!payload.gstNumber) payload.gstNumber = null;
      if (!payload.notes) payload.notes = null;
      const response = await api.patch(`/customers/${id}`, payload);
      return response.data.data.customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setSuccessBanner('Customer updated successfully!');
      setTimeout(() => {
        navigate('/customers');
      }, 1200);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || 'Failed to update customer. Please try again.');
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setServerError(null);
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isFetching) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-100 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
                <div className="h-10 w-full bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && fetchError) {
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <FiChevronLeft />
            Back to Customers
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Update customer information' : 'Fill in the details to add a new customer'}
          </p>
        </div>
      </div>

      {successBanner && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="text-green-800 font-medium">{successBanner}</div>
        </div>
      )}

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="text-red-800 font-medium">{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('mobile')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                placeholder="+91 98765 43210"
              />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('businessName')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                placeholder="Acme Trading Pvt Ltd"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                {...register('gstNumber')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gstNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.gstNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Follow Up Date
              </label>
              <input
                type="date"
                {...register('followUpDate')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
              />
              {errors.followUpDate && (
                <p className="mt-1 text-sm text-red-600">{errors.followUpDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('customerType')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 bg-white"
              >
                <option value={CustomerType.RETAIL}>Retail</option>
                <option value={CustomerType.WHOLESALE}>Wholesale</option>
                <option value={CustomerType.DISTRIBUTOR}>Distributor</option>
              </select>
              {errors.customerType && (
                <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 bg-white"
              >
                <option value={CustomerStatus.LEAD}>Lead</option>
                <option value={CustomerStatus.ACTIVE}>Active</option>
                <option value={CustomerStatus.INACTIVE}>Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 resize-y"
                placeholder="123 Business Street, Sector 18, Gurugram, Haryana 122001"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 resize-y"
                placeholder="Any additional notes about this customer..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            <FiX />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isMutating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {(isSubmitting || isMutating) ? (
              <>
                <FiLoader className="animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FiSave />
                {isEdit ? 'Update Customer' : 'Save Customer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
