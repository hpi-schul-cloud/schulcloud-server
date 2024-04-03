import { CalendarEvent } from '@infra/calendar/interface/calendar-event.interface';
import { Injectable } from '@nestjs/common';
import { CalendarEventDto } from '../dto/calendar-event.dto';

@Injectable()
export class CalendarMapper {
	mapToDto(event: CalendarEvent): CalendarEventDto {
		const { attributes } = event.data[0];
		return new CalendarEventDto({
			teamId: attributes['x-sc-teamid'],
			title: attributes.summary,
			id: attributes.id,
		});
	}

	mapEventsToDto(events: CalendarEvent[]): CalendarEventDto[] {
		return events.map((it) => this.mapToDto(it));
	}
}
