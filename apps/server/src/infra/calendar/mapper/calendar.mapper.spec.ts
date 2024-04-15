import { CalendarEvent } from '@infra/calendar/interface/calendar-event.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarMapper } from './calendar.mapper';
import { CalendarEventId } from '../interface/calendar-event-id.interface';

describe('CalendarMapper', () => {
	let module: TestingModule;
	let mapper: CalendarMapper;

	const event: CalendarEvent = {
		data: [
			{
				attributes: {
					'x-sc-teamid': 'teamId',
					summary: 'eventTitle',
				},
			},
		],
	};

	const events: CalendarEventId = {
		data: [{ id: '1' }, { id: '2' }],
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CalendarMapper],
		}).compile();
		mapper = module.get(CalendarMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	it('mapToDto', () => {
		// Act
		const result = mapper.mapToDto(event);

		// Assert
		expect(result.teamId).toEqual('teamId');
		expect(result.title).toEqual('eventTitle');
	});

	it('mapEventsToDto', () => {
		const result = mapper.mapEventsToId(events);

		expect(result[0]).toEqual('1');
		expect(result[1]).toEqual('2');
		expect(result.length).toEqual(2);
	});
});
