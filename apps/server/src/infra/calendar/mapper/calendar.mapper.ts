import { CalendarEvent } from '@infra/calendar/interface/calendar-event.interface';
import { Injectable } from '@nestjs/common';
import { CalendarEventDto } from '../dto/calendar-event.dto';
import { CalendarEventId } from '../interface/calendar-event-id.interface';

@Injectable()
export class CalendarMapper {
	mapToDto(event: CalendarEvent): CalendarEventDto {
		const { attributes } = event.data[0];
		return new CalendarEventDto({
			teamId: attributes['x-sc-teamid'],
			title: attributes.summary,
		});
	}

	mapEventsToId(events: CalendarEventId): string[] {
		return events.data.map((it) => it.id);
	}
}
