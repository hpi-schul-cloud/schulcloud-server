import { Test, type TestingModule } from '@nestjs/testing';
import { type CalendarEventId } from '../interface/calendar-event-id.interface';
import { CalendarMapper } from './calendar.mapper';

describe('CalendarMapper', () => {
	let module: TestingModule;
	let mapper: CalendarMapper;

	const event = {
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
