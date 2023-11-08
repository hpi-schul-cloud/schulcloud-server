import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { axiosResponseFactory } from '@shared/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { CalendarMapper } from '../mapper/calendar.mapper';
import { ICalendarEvent } from '../interface/calendar-event.interface';

describe('CalendarServiceSpec', () => {
	let module: TestingModule;
	let service: CalendarService;

	let httpService: DeepMocked<HttpService>;
	let calendarMapper: DeepMocked<CalendarMapper>;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'CALENDAR_URI':
					return 'http://localhost:4000';
				default:
					return null;
			}
		});

		module = await Test.createTestingModule({
			providers: [
				CalendarService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: CalendarMapper,
					useValue: createMock<CalendarMapper>(),
				},
			],
		}).compile();
		service = module.get(CalendarService);
		httpService = module.get(HttpService);
		calendarMapper = module.get(CalendarMapper);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	describe('findEvent', () => {
		it('should successfully find an event', async () => {
			// Arrange
			const title = 'eventTitle';
			const teamId = 'teamId';

			const event: ICalendarEvent = {
				data: [
					{
						attributes: {
							'x-sc-teamid': teamId,
							summary: title,
						},
					},
				],
			};
			const axiosResponse: AxiosResponse<ICalendarEvent> = axiosResponseFactory.build({
				data: event,
			});
			httpService.get.mockReturnValue(of(axiosResponse));
			calendarMapper.mapToDto.mockReturnValue({ title, teamId });

			// Act
			const result: CalendarEventDto = await service.findEvent('userId', 'eventId');

			// Assert
			expect(calendarMapper.mapToDto).toHaveBeenCalledWith(event);
			expect(result.title).toEqual(title);
			expect(result.teamId).toEqual(teamId);
		});

		it('should throw if event cannot be found, because of invalid parameters', async () => {
			const error = 'error';
			httpService.get.mockReturnValue(throwError(() => error));

			// Act & Assert
			await expect(service.findEvent('invalid userId', 'invalid eventId')).rejects.toThrow(
				InternalServerErrorException
			);
		});
	});
});
