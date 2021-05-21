import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContactsDao } from './dao/contacts.dao';
import { ListingsDao } from './dao/listings.dao';
import { shallowCopyArrayObjects as secondLayerCopy } from './helpers/shallowcopy';
import {
  ContactListing,
  ListingAverages,
  MakeDistribution,
  ReportResultDto,
  Contact,
  Listing,
} from './types';

@Injectable()
export class AppService {
  constructor(
    private readonly listingsDao: ListingsDao,
    private readonly contactsDao: ContactsDao,
  ) {}
  async getReport(): Promise<ReportResultDto> {
    try {
      const listings: Listing[] = await this.listingsDao.findAll();
      const contacts: Contact[] = await this.contactsDao.findAll();
      const listingAverages = this.averageSellerListingPrices(listings);
      const makesDistribution = this.calcMakeDistribution(listings);
      const topPerMonth = this.topListingsByMonth(contacts);
      const averagePriceTopListings = this.calcTopContacted(contacts);
      return {
        listingAverages,
        makesDistribution,
        topPerMonth,
        averagePriceTopListings,
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  private averageSellerListingPrices(listings: Listing[]): ListingAverages {
    const newListings: Listing[] = secondLayerCopy<Listing>(listings);
    const dealerListings = newListings
      .filter((listing) => listing.seller_type === 'dealer')
      .map((listing) => listing.price);
    const dealerAverage =
      dealerListings.reduce((prev, curr) => prev + curr, 0) /
      dealerListings.length;
    const privateListingsAvg = newListings
      .filter((listing) => listing.seller_type === 'private')
      .map((listing) => listing.price);
    const privateAverage =
      privateListingsAvg.reduce((prev, curr) => prev + curr, 0) /
      privateListingsAvg.length;
    const otherListings = newListings
      .filter((listing) => listing.seller_type === 'other')
      .map((listing) => listing.price);
    const otherAverage =
      otherListings.reduce((prev, curr) => prev + curr, 0) /
      otherListings.length;
    return {
      dealer: Math.round(dealerAverage),
      private: Math.round(privateAverage),
      other: Math.round(otherAverage),
    };
  }

  private calcMakeDistribution(listings: Listing[]): MakeDistribution[] {
    const newListings: Listing[] = secondLayerCopy<Listing>(listings);
    const makesAmount = {};
    newListings.forEach(({ make }) => {
      if (makesAmount[make]) makesAmount[make]++;
      else makesAmount[make] = 1;
    });

    const result: MakeDistribution[] = [];
    Object.keys(makesAmount).forEach((key) => {
      const distribution = ((makesAmount[key] / newListings.length) *
        100) as number;
      result.push({ make: key, distribution });
    });
    result.sort((a, b) => b.distribution - a.distribution);
    return result;
  }

  private sortContactsByAmount(contacts: Contact[]): ContactListing[] {
    const newContacts = secondLayerCopy<Contact>(contacts);
    const contactListMap = {};
    newContacts.sort((a, b) => b.contact_date - a.contact_date);
    const result: ContactListing[] = newContacts.map(
      ({ listing_id, contact_date }: Contact) => {
        const listing = this.listingsDao.findById(listing_id);
        const month = new Date(contact_date).getMonth();
        contactListMap[listing_id] = (contactListMap[listing_id] || 0) + 1;
        const amount: number = contactListMap[listing_id];
        return { month, ...listing, amount };
      },
    );
    return result.sort((a, b) => b.amount - a.amount);
  }

  private topListingsByMonth(
    contacts: Contact[],
  ): Record<string, ContactListing[]> {
    const monthMap: Record<string, ContactListing[]> = {};
    const newContacts = secondLayerCopy<Contact>(contacts);
    const contactListings = this.sortContactsByAmount(newContacts);
    contactListings.forEach((result) => {
      const { month } = result;
      if (monthMap[month]) {
        if (monthMap[month].length < 5) monthMap[month].push(result);
      } else {
        monthMap[month] = [result];
      }
    });
    return monthMap;
  }

  private calcTopContacted(contacts: Contact[]): number {
    const newContacts = secondLayerCopy<Contact>(contacts);
    const sorted = this.sortContactsByAmount(newContacts);
    const indexFromPercentage = Math.round(newContacts.length * 0.3) + 1;
    const sortedByPercentage = sorted.slice(0, indexFromPercentage);
    const sum = sortedByPercentage
      .map((value) => value.price)
      .reduce((acc, curr) => acc + curr);
    return Math.round(sum / sortedByPercentage.length);
  }
}
