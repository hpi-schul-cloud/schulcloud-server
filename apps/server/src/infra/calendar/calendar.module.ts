import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { CalendarService } from './service/calendar.service';
import { CalendarMapper } from './mapper/calendar.mapper';

@Module({
	imports: [HttpModule, CqrsModule],
	providers: [CalendarMapper, CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
