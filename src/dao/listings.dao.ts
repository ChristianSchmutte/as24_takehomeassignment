import { Injectable } from '@nestjs/common';
import * as parser from 'csv-parser';
import * as fs from 'fs';
import { join } from 'path';
import { Listing } from '../types';

@Injectable()
export class ListingsDao {
  private listCache = {};
  /**
   * Used to access CSV files
   */
  async findAll(): Promise<Listing[]> {
    return new Promise<Listing[]>(
      (
        resolve: (value: Listing[] | PromiseLike<Listing[]>) => void,
        reject: (reason: string) => void,
      ): void => {
        const listings: Listing[] = [];
        const listingsPath = join(
          __dirname,
          '..',
          '..',
          'csv-datasource',
          'listings.csv',
        );
        fs.createReadStream(listingsPath)
          .pipe(parser())
          .on('data', (data) => {
            const id = parseInt(data.id);
            const price = parseInt(data.price);
            const mileage = parseInt(data.mileage);
            const { make, seller_type } = data;
            const listing: Listing = { id, price, mileage, make, seller_type };
            listings.push(listing);
            this.listCache[id] = listing;
          })
          .on('end', () => resolve(listings))
          .on('error', (err) => reject(err.message));
      },
    );
  }

  findById(id: number): Listing {
    return this.listCache[id];
  }
}
