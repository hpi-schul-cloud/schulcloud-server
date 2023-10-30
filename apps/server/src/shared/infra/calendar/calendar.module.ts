import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CalendarMapper } from './mapper/calendar.mapper';
import { CalendarService } from './service/calendar.service';

@Module({
	imports: [HttpModule],
	providers: [CalendarMapper, CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
