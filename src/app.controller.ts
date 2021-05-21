import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ReportResultDto } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  async root() {
    const report = await this.appService.getReport();
    const { topPerMonth } = report;
    return {
      listingAverages: {
        dealer: this.formatPrice(report.listingAverages.dealer),
        private: this.formatPrice(report.listingAverages.private),
        other: this.formatPrice(report.listingAverages.other),
      },
      makesDistribution: report.makesDistribution,
      topPerMonth,
      averagePriceTopListings: this.formatPrice(report.averagePriceTopListings),
    };
  }

  @Get('/api')
  async getReport(): Promise<ReportResultDto> {
    return this.appService.getReport();
  }

  private formatPrice(price: number): string {
    return `€ ${new Intl.NumberFormat('de-DE').format(price)},-`;
  }
}
