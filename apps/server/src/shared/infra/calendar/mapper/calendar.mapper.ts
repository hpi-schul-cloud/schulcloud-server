import { ICalendarEvent } from '@shared/infra/calendar/interface/calendar-event.interface';
import { Injectable } from '@nestjs/common';
import { CalendarEventDto } from '@shared/infra/calendar/dto/calendar-event.dto';

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
