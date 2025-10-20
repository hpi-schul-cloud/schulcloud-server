import { createMock } from '@golevelup/ts-jest';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
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
