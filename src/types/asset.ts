export interface AssetDetailsData {
  asset: {
    id: string;
    assetTag: string;
    serialNumber: string | null;
    name: string | null;
    status: string;
    condition: string | null;
    instanceAttributes: Record<string, unknown> | null;
    usefulLifeMonths: number | null;
    salvageValue: string | null;
    createdAt: string;
    updatedAt: string;
  };
  model: {
    id: number;
    name: string;
    imageUrl: string | null;
    technicalDetails: Record<string, unknown> | null;
    brand: { id: number; name: string };
    category: {
      id: number;
      name: string;
      pillar: string;
      prefix: string;
      customSchema: Record<string, unknown> | null;
    };
  };
  location: {
    id: number;
    name: string;
    type: string | null;
  } | null;
  purchase: {
    id: number;
    vendorId: number | null;
    purchaseDate: string | null;
    basePrice: string | null;
    tax: string | null;
    shippingCost: string | null;
    totalCost: string | null;
    currencyCode: string;
    warrantyExpiry: string | null;
    invoiceUrl: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  vendor: {
    id: number;
    vendorCode: string | null;
    companyName: string;
    email: string | null;
    phone: string | null;
    website: string | null;
  } | null;
  owner: {
    id: number;
    companyName: string;
  } | null;
  assignment: {
    assignedToUser: {
      id: string;
      name: string;
      email: string;
    } | null;
    assignedDate: string;
    expectedReturnDate: string | null;
    notes: string | null;
  } | null;
  softwareLicense?: {
    id: string;
    licenseKey: string | null;
    licenseType: string;
    totalSeats: number;
    availableSeats: number;
    startDate: string | null;
    expiryDate: string | null;
  } | null;
}

export interface ScanResponse {
  success: boolean;
  message?: string;
  data?: AssetDetailsData;
  error?: string;
}
