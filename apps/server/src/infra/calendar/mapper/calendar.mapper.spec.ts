import { ICalendarEvent } from '@infra/calendar/interface/calendar-event.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarMapper } from './calendar.mapper';

describe('CalendarMapper', () => {
	let module: TestingModule;
	let mapper: CalendarMapper;

	const event: ICalendarEvent = {
		data: [
			{
				attributes: {
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
});
