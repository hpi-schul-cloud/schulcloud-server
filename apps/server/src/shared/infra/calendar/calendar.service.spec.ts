import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CalendarService } from '@shared/infra/calendar';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ICalendarEvent } from '@shared/infra/calendar/calendar-event.interface';
import { AxiosResponse } from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

describe('VideoConferenceUc', () => {
	let module: TestingModule;
	let service: CalendarService;

	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
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
			],
		}).compile();
		service = module.get(CalendarService);
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
		jest.clearAllMocks();
	});

	describe('findEvent', () => {
		it('should successfully find an event', async () => {
			// Arrange
			const event: ICalendarEvent = {
				title: 'eventTitle',
				'x-sc-teamId': 'teamId',
			};
			const axiosResponse: AxiosResponse<ICalendarEvent> = {
				data: event,
				status: 0,
				statusText: 'statusText',
				headers: {},
				config: {},
			};
			httpService.get.mockReturnValue(of(axiosResponse));

			// Act
			const result: ICalendarEvent = await service.findEvent('userId', 'eventId');

			// Assert
			expect(result.title).toEqual(event.title);
			expect(result['x-sc-teamId']).toEqual(event['x-sc-teamId']);
		});

		it('should throw if event cannot be found, because of invalid parameters', async () => {
			const error = 'error';
			httpService.get.mockReturnValue(throwError(() => error));

			// Act & Assert
			await expect(service.findEvent('invalid userId', 'invalid eventId')).rejects.toThrow(
				InternalServerErrorException
			);
			await expect(service.findEvent('invalid userId', 'invalid eventId')).rejects.toThrow(error);
		});
	});
});
