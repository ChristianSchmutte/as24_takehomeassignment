import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { ContactsDao } from './dao/contacts.dao';
import { ListingsDao } from './dao/listings.dao';
import { Contact, Listing, ReportResultDto } from './types';

const mockContacts: Contact[] = [
  { listing_id: 1111, contact_date: 1582158776000 },
  { listing_id: 2222, contact_date: 1585379517000 },
  { listing_id: 2222, contact_date: 1592850063000 },
  { listing_id: 2222, contact_date: 1589609951000 },
  { listing_id: 2222, contact_date: 1588030368000 },
  { listing_id: 3333, contact_date: 1584849954000 },
  { listing_id: 3333, contact_date: 1580893831000 },
  { listing_id: 4444, contact_date: 1582628564000 },
  { listing_id: 5555, contact_date: 1589944141000 },
];

const mockListings: Listing[] = [
  {
    id: 1111,
    price: 44776,
    mileage: 1000,
    make: 'Mazda',
    seller_type: 'dealer',
  },
  {
    id: 2222,
    price: 44776,
    mileage: 1000,
    make: 'Audi',
    seller_type: 'other',
  },
  {
    id: 3333,
    price: 44776,
    mileage: 1000,
    make: 'BMW',
    seller_type: 'dealer',
  },
  {
    id: 4444,
    price: 44776,
    mileage: 1000,
    make: 'Mazda',
    seller_type: 'private',
  },
];

const mockCache = {
  1111: mockListings[0],
  2222: mockListings[1],
  3333: mockListings[2],
  4444: mockListings[3],
};

const mockContactsDto = () => ({
  findAll: jest.fn(),
});
const mockListingsDto = () => ({
  listCache: mockCache,
  findAll: jest.fn(),
  findById: jest.fn(),
});
describe('AppService', () => {
  let appService: AppService;
  let listingsDao: ListingsDao;
  let contactsDao: ContactsDao;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: ListingsDao, useFactory: mockListingsDto },
        { provide: ContactsDao, useFactory: mockContactsDto },
      ],
    }).compile();
    appService = module.get<AppService>(AppService);
    listingsDao = module.get<ListingsDao>(ListingsDao);
    contactsDao = module.get<ContactsDao>(ContactsDao);
  });

  it('mock injecttions should be defined', () => {
    expect(appService).toBeDefined();
    expect(listingsDao).toBeDefined();
    expect(contactsDao).toBeDefined();
  });

  it('should return a report result', async () => {
    listingsDao.findAll = jest.fn().mockResolvedValue(mockListings);
    contactsDao.findAll = jest.fn().mockResolvedValue(mockContacts);
    listingsDao.findById = jest.fn().mockReturnValue(mockCache[1111]);
    const report = await appService.getReport();
    expect(report).not.toBeInstanceOf(ReportResultDto);
  });

  it('should throw and an expection', async () => {
    listingsDao.findAll = jest.fn().mockRejectedValue(new Error('Async Error'));
    expect(appService.getReport()).rejects.toThrow(
      new InternalServerErrorException('Internal server error')
    );
  });
});
