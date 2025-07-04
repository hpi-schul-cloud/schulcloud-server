import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@core/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CalendarService } from '@infra/calendar';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { UserConfig } from '..';
import { DeleteUserCalendarDataStep } from './delete-user-calendar-data.step';

describe(DeleteUserCalendarDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserCalendarDataStep;
	let config: DeepMocked<ConfigService>;
	let calendarService: DeepMocked<CalendarService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserCalendarDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<UserConfig, true>>(),
				},
				{
					provide: CalendarService,
					useValue: createMock<CalendarService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserCalendarDataStep);

		config = module.get(ConfigService);
		calendarService = module.get(CalendarService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserCalendarDataStep(sagaService, config, calendarService, createMock<Logger>());
			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.USER_CALENDAR, step);
		});
	});

	describe('execute', () => {
		describe('when CALENDAR_SERVICE_ENABLED is false', () => {
			const setup = () => {
				config.get.mockImplementationOnce((key) => {
					if (key === 'CALENDAR_SERVICE_ENABLED') {
						return false;
					}
				});
			};

			it('should call config to check flag CALENDAR_SERVICE_ENABLED', async () => {
				await step.execute({ userId: 'test-user-id' });

				expect(config.get).toHaveBeenCalledWith('CALENDAR_SERVICE_ENABLED');
			});

			it('should return an empty StepReport', async () => {
				setup();
				const result = await step.execute({ userId: 'test-user-id' });
				expect(result).toEqual({
					moduleName: ModuleName.USER_CALENDAR,
					operations: [],
				});
			});
		});

		describe('when CALENDAR_SERVICE_ENABLED is true', () => {
			const setup = () => {
				config.get.mockImplementationOnce((key) => {
					if (key === 'CALENDAR_SERVICE_ENABLED') {
						return true;
					}
					return true;
				});
				const eventIds = ['event1', 'event2'];
				calendarService.getAllEvents.mockResolvedValueOnce(eventIds);
			};

			it('should call calendar service getAllEvents with userId as scopeId', async () => {
				setup();

				await step.execute({ userId: 'test-user-id' });

				expect(calendarService.getAllEvents).toHaveBeenCalledWith('test-user-id', 'test-user-id');
			});

			it('should call calendar service deleteEventsByScopeId', async () => {
				setup();

				await step.execute({ userId: 'test-user-id' });

				expect(calendarService.deleteEventsByScopeId).toHaveBeenCalledWith('test-user-id');
			});

			it('should return a StepReport with the number of deleted events', async () => {
				setup();

				const result = await step.execute({ userId: 'test-user-id' });

				expect(result).toEqual(
					StepReportBuilder.build(ModuleName.USER_CALENDAR, [
						StepOperationReportBuilder.build(StepOperationType.DELETE, 2, ['event1', 'event2']),
					])
				);
			});
		});
	});
});
