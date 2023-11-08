import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarService } from './service/calendar.service';
import { CalendarMapper } from './mapper/calendar.mapper';

@Module({
	imports: [HttpModule],
	providers: [CalendarMapper, CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
