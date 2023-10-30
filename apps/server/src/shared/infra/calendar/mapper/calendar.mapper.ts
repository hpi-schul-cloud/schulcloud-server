import { Injectable } from '@nestjs/common';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { ICalendarEvent } from '../interface/calendar-event.interface';

@Injectable()
export class CalendarMapper {
	mapToDto(event: ICalendarEvent): CalendarEventDto {
		const { attributes } = event.data[0];
		return new CalendarEventDto({
			teamId: attributes['x-sc-teamid'],
			title: attributes.summary,
		});
	}
}
