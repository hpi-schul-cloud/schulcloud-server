import { Module } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CalendarService } from '@shared/infra/calendar/calendar.service';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [LoggerModule],
	providers: [CalendarService, HttpService],
	exports: [CalendarService],
})
export class CalendarModule {}
