import { CalendarEvent } from '@infra/calendar/interface/calendar-event.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarMapper } from './calendar.mapper';

describe('CalendarMapper', () => {
	let module: TestingModule;
	let mapper: CalendarMapper;

	const event: CalendarEvent = {
		data: [
			{
				attributes: {
					id: 'id',
					'x-sc-teamid': 'teamId',
					summary: 'eventTitle',
				},
			},
		],
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
		const events = [event, event];
		// Act
		const result = mapper.mapEventsToDto(events);

		// Assert
		expect(result[0].teamId).toEqual('teamId');
		expect(result[0].title).toEqual('eventTitle');
		expect(result.length).toEqual(2);
	});
});
