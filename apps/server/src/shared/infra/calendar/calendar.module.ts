import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarService } from '@shared/infra/calendar/calendar.service';

@Module({
	imports: [HttpModule],
	providers: [CalendarService],
	exports: [CalendarService],
})
export class CalendarModule {}
