import { Injectable } from '@nestjs/common';
import { ContactsDao } from './dao/contacts.dao';
import { ListingsDao } from './dao/listings.dao';
import { Contact } from './types/contact.type';
import { Listing } from './types/listing.type';
import { shallowCopyArrayObjects as secondLayerCopy } from './helpers/shallowcopy';

@Injectable()
export class AppService {
  constructor(
    private readonly listingsDao: ListingsDao,
    private readonly contactsDao: ContactsDao,
  ) {}
  async getReport(): Promise<Listing[]> {
    const listings: Listing[] = await this.listingsDao.findAll();
    const contacts: Contact[] = await this.contactsDao.findAll();
    const listingAverages = this.averageSellerListingPrices(listings);
    const makesDistribution = this.calcMakeDistribution(listings);
    const topPerMonth = this.calcTopMostContacted(contacts);
    return listings;
  }

  private averageSellerListingPrices(listings: Listing[]) {
    // shallow, since objects only have scalar types
    // if objects get nested deep copying would be necessary
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

  private calcMakeDistribution(listings: Listing[]) {
    const newListings: Listing[] = secondLayerCopy<Listing>(listings);
    const makesAmount = {};
    newListings.forEach(({ make }) => {
      if (makesAmount[make]) makesAmount[make]++;
      else makesAmount[make] = 1;
    });

    const makesDistribution = {};
    Object.keys(makesAmount).forEach((key) => {
      makesDistribution[key] = (makesAmount[key] / newListings.length) * 100;
    });
    return makesDistribution;
  }

  private async calcTopMostContacted(contacts: Contact[]) {
    const newContacts = secondLayerCopy<Contact>(contacts);
    const contactListMap = {};
    newContacts.sort((a, b) => b.contact_date - a.contact_date);
    const res = newContacts.map(({ listing_id, contact_date }: Contact) => {
      const listing = this.listingsDao.findById(listing_id);
      const month = new Date(contact_date).getMonth();
      contactListMap[listing_id] = (contactListMap[listing_id] || 0) + 1;
      const amount = contactListMap[listing_id];
      return { month, ...listing, amount };
    });
    res.sort((a, b) => b.amount - a.amount);
    const monthMap = {};
    res.forEach((result) => {
      const { month } = result;
      if (monthMap[month]) {
        if (monthMap[month].length < 5) monthMap[month].push(result);
      } else {
        monthMap[month] = [result];
      }
    });
    return monthMap;
  }
}
