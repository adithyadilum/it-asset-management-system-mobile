export interface InventoryAsset {
  id: string;
  assetTag: string;
  name: string | null;
  serialNumber: string | null;
  status: string;
  condition: string | null;
  model: string;
  brand: string;
  imageUrl: string | null;
  category: string;
  pillar: string;
  location: string | null;
  assignedTo: string | null;
}
export interface InventoryFilters {
  query?: string;
  pillar?: string;
  categoryId?: number;
  locationId?: number;
  status?: string;
}
export interface InventoryResponse {
  data: InventoryAsset[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  filters: {
    categories: { id: number; name: string; pillar: string }[];
    locations: { id: number; name: string }[];
    statuses: string[];
  };
}
export interface AssetProfile {
  asset: {
    id: string;
    assetTag: string;
    name: string | null;
    serialNumber: string | null;
    status: string;
    condition: string | null;
    createdAt: string;
    updatedAt: string;
  };
  model: {
    id: number;
    name: string;
    imageUrl: string | null;
    brand: { id: number; name: string };
    category: { id: number; name: string; pillar: string };
  };
  specifications: Record<string, unknown>;
  location: { id: number; name: string; type: string | null } | null;
  owner: { id: number; companyName: string } | null;
  warrantyExpiry: string | null;
  assignment: {
    assignedToUser: { id: string; name: string; email: string } | null;
    assignedToLocation: { id: number; name: string } | null;
    assignedDate: string;
    expectedReturnDate: string | null;
    state: string | null;
  } | null;
  softwareLicense: {
    licenseType: string;
    totalSeats: number;
    availableSeats: number;
    startDate: string | null;
    expiryDate: string | null;
  } | null;
  history: {
    id: string;
    timestamp: string;
    eventType: string;
    actor: string;
    description: string;
    details?: string;
  }[];
  maintenance: {
    id: number;
    status: string;
    reportedIssue: string;
    vendorName: string | null;
    estimatedReturnDate: string | null;
    actualCompletionDate: string | null;
    createdAt: string;
  }[];
}
