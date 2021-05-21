import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactsDao } from './dao/contacts.dao';
import { ListingsDao } from './dao/listings.dao';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ListingsDao, ContactsDao],
})
export class AppModule {}
