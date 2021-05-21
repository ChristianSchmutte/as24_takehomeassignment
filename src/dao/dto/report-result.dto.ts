export type ReportResoltDto = {
  listingAverages: ListingAverages;
  topPerMonth: Record<string, ContactListing[]>;
  makesDistribution: MakeDistribution[];
  averagePriceTopListings: number;
};

export type ListingAverages = {
  dealer: number;
  private: number;
  other: number;
};

export type MakeDistribution = {
  make: string;
  distribution: number;
};

export type ContactListing = {
  amount: number;
  id: number;
  make: string;
  mileage: number;
  price: number;
  seller_type: string;
  month: number;
};
