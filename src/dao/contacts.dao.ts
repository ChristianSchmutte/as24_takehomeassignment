import { Injectable } from '@nestjs/common';
import * as parser from 'csv-parser';
import * as fs from 'fs';
import { join } from 'path';
import { Contact } from '../types';

@Injectable()
export class ContactsDao {
  /**
   * Used to access CSV files
   */
  async findAll(): Promise<Contact[]> {
    return new Promise<Contact[]>(
      (
        resolve: (value: Contact[] | PromiseLike<Contact[]>) => void,
        reject: (reason: string) => void,
      ): void => {
        const contacts: Contact[] = [];
        const contactsPath = join(
          __dirname,
          '..',
          '..',
          'csv-datasource',
          'contacts.csv',
        );
        fs.createReadStream(contactsPath)
          .pipe(parser())
          .on('data', (contactsData) => {
            const listing_id = parseInt(contactsData.listing_id);
            const contact_date = parseInt(contactsData.contact_date);
            contacts.push({ listing_id, contact_date });
          })
          .on('end', () => {
            resolve(contacts);
          })
          .on('error', (err) => reject(err.message));
      },
    );
  }
}
