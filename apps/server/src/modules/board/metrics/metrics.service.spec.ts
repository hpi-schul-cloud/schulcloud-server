import { createMock } from '@golevelup/ts-jest';
import { UserService } from '@modules/user';
import { Test, type TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe(MetricsService.name, () => {
	let module: TestingModule;
	let service: MetricsService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MetricsService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get(MetricsService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('setTotalUserCount', () => {
		it('should set the total user count gauge', () => {
			const spy = jest.spyOn(service['totalUserCounter'], 'set');

			service.setTotalUserCount(42);

			expect(spy).toHaveBeenCalledWith(42);
		});
	});

	describe('school connection count', () => {
		it('should increment and decrement the gauge for a school', () => {
			const schoolId = 'school-id';
			const incrementSpy = jest.spyOn(service['connectionsPerSchoolGauge'], 'inc');
			const decrementSpy = jest.spyOn(service['connectionsPerSchoolGauge'], 'dec');

			service.incrementSchoolConnectionCount(schoolId);
			service.decrementSchoolConnectionCount(schoolId);

			expect(incrementSpy).toHaveBeenCalledWith({ school_id: schoolId });
			expect(decrementSpy).toHaveBeenCalledWith({ school_id: schoolId });
		});
	});

	describe('setTotalBoardCount', () => {
		it('should set the total board count gauge', () => {
			const spy = jest.spyOn(service['totalBoardCounter'], 'set');

			service.setTotalBoardCount(17);

			expect(spy).toHaveBeenCalledWith(17);
		});
	});

	describe('incrementActionCount', () => {
		it('should increment the action counter', () => {
			const actionName = 'test_action';
			const spy = jest.spyOn(service['actionCounters'], 'get');

			let counter = service.getCounter(actionName);
			expect(counter).toBeUndefined();

			service.incrementActionCount(actionName);
			service.incrementActionCount(actionName);

			counter = service.getCounter(actionName);
			expect(spy).toHaveBeenCalledWith(actionName);
			expect(counter).toBeDefined();
		});
	});

	describe('incrementActionGauge', () => {
		it('should increment the action gauge', () => {
			const actionName = 'test_gauge_action';
			const spy = jest.spyOn(service['actionGauges'], 'get');

			let counter = service['actionGauges'].get(actionName);
			expect(counter).toBeUndefined();

			service.incrementActionGauge(actionName);
			service.incrementActionGauge(actionName);

			counter = service['actionGauges'].get(actionName);
			expect(spy).toHaveBeenCalledWith(actionName);
			expect(counter).toBeDefined();
		});
	});
});
