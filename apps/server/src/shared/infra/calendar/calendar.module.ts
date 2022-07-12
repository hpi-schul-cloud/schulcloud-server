import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarService } from '@shared/infra/calendar/calendar.service';
import { LoggerModule } from '@src/core/logger';

@Module({
	imports: [LoggerModule, HttpModule],
	providers: [CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
