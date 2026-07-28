export enum CustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  DISTRIBUTOR = 'DISTRIBUTOR',
}

export enum CustomerStatus {
  LEAD = 'LEAD',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum ChallanStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string | null;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: string;
  customerId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  type: MovementType;
  reason: string | null;
  reference?: string;
  createdBy: string;
  createdAt: string;
  userName?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ProductWithMovements extends Product {
  stockMovements?: StockMovement[];
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productSnapshotName: string;
  productSnapshotPrice: number;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock?: number;
  };
}

export interface Challan {
  id: string;
  challanNumber: string | number;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    name: string;
    email?: string;
    mobile?: string;
  };
  customerName?: string;
  createdByName?: string;
  items?: ChallanItem[];
  itemsCount?: number;
}
