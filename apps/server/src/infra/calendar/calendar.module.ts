import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarService } from '@infra/calendar/service/calendar.service';
import { CalendarMapper } from '@infra/calendar/mapper/calendar.mapper';

@Module({
	imports: [HttpModule],
	providers: [CalendarMapper, CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
