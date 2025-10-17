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

	// describe('trackRoleOfClient', () => {
	// 	const setup = (roleName: RoleName) => {
	// 		const teacherRole = roleFactory.build({ name: roleName });
	// 		const userDo = userDoFactory.buildWithId({ roles: [teacherRole] });
	// 		userService.findById.mockResolvedValueOnce(userDo);
	// 		const clientId = Math.random().toString();
	// 		return { userDo, clientId, userId: userDo.id };
	// 	};

	// 	describe('when tracking a user with role teacher', () => {
	// 		it('should count one editor', async () => {
	// 			const { clientId, userId } = setup(RoleName.TEACHER);

	// 			const role = await service.trackRoleOfClient(clientId, userId);

	// 			expect(role).toEqual('editor');
	// 		});
	// 	});

	// 	describe('when tracking a user with role Course-Substition-Teacher', () => {
	// 		it('should count one editor', async () => {
	// 			const { clientId, userId } = setup(RoleName.COURSESUBSTITUTIONTEACHER);

	// 			const role = await service.trackRoleOfClient(clientId, userId);

	// 			expect(role).toEqual('editor');
	// 		});
	// 	});

	// 	describe('when tracking a user with role student', () => {
	// 		it('should count one viewer', async () => {
	// 			const { clientId, userId } = setup(RoleName.STUDENT);

	// 			const role = await service.trackRoleOfClient(clientId, userId);

	// 			expect(role).toEqual('viewer');
	// 		});
	// 	});

	// 	describe('when tracking a user with role teacher that is unknown', () => {
	// 		it('should not count for any role', async () => {
	// 			const teacherRole = roleFactory.build({ name: RoleName.TEACHER });
	// 			const userDo = userDoFactory.buildWithId({ roles: [teacherRole] });
	// 			const clientId = Math.random().toString();

	// 			const role = await service.trackRoleOfClient(clientId, userDo.id);

	// 			expect(role).toEqual(undefined);
	// 		});
	// 	});
	// });
});
