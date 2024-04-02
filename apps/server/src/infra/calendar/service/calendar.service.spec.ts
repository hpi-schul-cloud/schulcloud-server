import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CalendarEventDto, CalendarService } from '@infra/calendar';
import { HttpService } from '@nestjs/axios';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@shared/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { Logger } from '@src/core/logger';
import { EventBus } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { ObjectId } from 'bson';
import { deletionRequestFactory } from '@src/modules/deletion/domain/testing';
import { CalendarEvent } from '../interface/calendar-event.interface';
import { CalendarMapper } from '../mapper/calendar.mapper';

describe('CalendarServiceSpec', () => {
	let module: TestingModule;
	let service: CalendarService;

	let httpService: DeepMocked<HttpService>;
	let calendarMapper: DeepMocked<CalendarMapper>;
	let eventBus: DeepMocked<EventBus>;

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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();
		service = module.get(CalendarService);
		httpService = module.get(HttpService);
		calendarMapper = module.get(CalendarMapper);
		eventBus = module.get(EventBus);
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
			const error = 'error1';
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
							statusText: 'NO_CONTENT',
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
		describe('When calling the delete events method with scopeId which does not exist', () => {
			const setup = () => {
				const error = 'error';
				httpService.delete.mockReturnValue(throwError(() => error));
			};

			it('should throw error if cannot delete a events', async () => {
				setup();
				await expect(service.deleteEventsByScopeId('invalid eventId')).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});
		describe('when calling the delete events method', () => {
			const setupError = () => {
				httpService.delete.mockReturnValueOnce(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.CONFLICT,
						})
					)
				);
			};

			it('should throw error if cannot delete a events cause of invalid response Http status', async () => {
				setupError();
				await expect(service.deleteEventsByScopeId('scopeId')).rejects.toThrow(
					new Error('invalid HTTP status code in a response from the server instead of 204')
				);
			});
		});

		describe('when calling the deleteUserEvent events method', () => {
			const setup = () => {
				httpService.delete.mockReturnValue(
					of(
						axiosResponseFactory.build({
							data: '',
							status: HttpStatus.NO_CONTENT,
							statusText: 'NO_CONTENT',
						})
					)
				);
				const userId: EntityId = '1';

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.CALENDAR, [
					DomainOperationReportBuilder.build(OperationType.DELETE, 0, [userId]),
				]);

				return {
					expectedResult,
					userId,
				};
			};

			it('should call service.deleteEventsByScopeId with userId', async () => {
				const { userId } = setup();
				const spy = jest.spyOn(service, 'deleteEventsByScopeId');

				await service.deleteUserData(userId);

				expect(spy).toHaveBeenCalledWith(userId);
			});

			it('should return domainOperation object with information about deleted user', async () => {
				const { expectedResult, userId } = setup();

				const result = await service.deleteUserData(userId);

				expect(result).toEqual(expectedResult);
			});

			it('should throw error after call service.deleteEventsByScopeId with bad userId', async () => {
				const userId = undefined as unknown as EntityId;

				await expect(service.deleteUserData(userId)).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('handle', () => {
			const setup = () => {
				const targetRefId = new ObjectId().toHexString();
				const targetRefDomain = DomainName.CLASS;
				const classId = new ObjectId().toHexString();
				const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
				const deletionRequestId = deletionRequest.id;

				const expectedData = DomainDeletionReportBuilder.build(DomainName.CLASS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 1, [classId]),
				]);

				return {
					deletionRequestId,
					expectedData,
					targetRefId,
				};
			};

			describe('when UserDeletedEvent is received', () => {
				it('should call deleteUserData in classService', async () => {
					const { deletionRequestId, expectedData, targetRefId } = setup();

					jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

					await service.handle({ deletionRequestId, targetRefId });

					expect(service.deleteUserData).toHaveBeenCalledWith(targetRefId);
				});

				it('should call eventBus.publish with DataDeletedEvent', async () => {
					const { deletionRequestId, expectedData, targetRefId } = setup();

					jest.spyOn(service, 'deleteUserData').mockResolvedValueOnce(expectedData);

					await service.handle({ deletionRequestId, targetRefId });

					expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
				});
			});
		});
	});
});
