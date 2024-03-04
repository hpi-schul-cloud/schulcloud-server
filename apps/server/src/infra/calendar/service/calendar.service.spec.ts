import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { CalendarEvent } from '../interface/calendar-event.interface';
import { CalendarMapper } from '../mapper/calendar.mapper';

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

			const event: CalendarEvent = {
				data: [
					{
						attributes: {
							'x-sc-teamid': teamId,
							summary: title,
						},
					},
				],
			};
			const axiosResponse: AxiosResponse<CalendarEvent> = axiosResponseFactory.build({
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

	describe('deleteEventsByScopeId', () => {
		describe('when calling the delete events method', () => {
			const setup = () => {
				httpService.delete.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.NO_CONTENT,
							statusText: 'OK',
						})
					)
				);
			};

			it('should call axios delete method', async () => {
				setup();
				await service.deleteEventsByScopeId('test');
				expect(httpService.delete).toHaveBeenCalled();
			});
		});
		it('should throw error if cannot delete a events', async () => {
			const error = 'error';
			httpService.delete.mockReturnValue(throwError(() => error));

			await expect(service.deleteEventsByScopeId('invalid eventId')).rejects.toThrowError(InternalServerErrorException);
		});
	});
});
