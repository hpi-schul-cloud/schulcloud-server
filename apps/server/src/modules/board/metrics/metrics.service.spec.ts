import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@src/modules/user';
import { RoleName } from '@shared/domain/interface';
import { roleFactory, userDoFactory } from '@shared/testing';
import { MetricsService } from './metrics.service';

describe(MetricsService.name, () => {
	let module: TestingModule;
	let service: MetricsService;
	let userService: DeepMocked<UserService>;

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
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('trackRoleOfClient', () => {
		const setup = (roleName: RoleName) => {
			const teacherRole = roleFactory.build({ name: roleName });
			const userDo = userDoFactory.buildWithId({ roles: [teacherRole] });
			userService.findById.mockResolvedValueOnce(userDo);
			const clientId = Math.random().toString();
			return { userDo, clientId, userId: userDo.id };
		};

		describe('when tracking a user with role teacher', () => {
			it('should count one editor', async () => {
				const { clientId, userId } = setup(RoleName.TEACHER);

				const role = await service.trackRoleOfClient(clientId, userId);

				expect(role).toEqual('editor');
			});
		});

		describe('when tracking a user with role Course-Substition-Teacher', () => {
			it('should count one editor', async () => {
				const { clientId, userId } = setup(RoleName.COURSESUBSTITUTIONTEACHER);

				const role = await service.trackRoleOfClient(clientId, userId);

				expect(role).toEqual('editor');
			});
		});

		describe('when tracking a user with role student', () => {
			it('should count one viewer', async () => {
				const { clientId, userId } = setup(RoleName.STUDENT);

				const role = await service.trackRoleOfClient(clientId, userId);

				expect(role).toEqual('viewer');
			});
		});

		describe('when tracking a user with role teacher that is unknown', () => {
			it('should not count for any role', async () => {
				const teacherRole = roleFactory.build({ name: RoleName.TEACHER });
				const userDo = userDoFactory.buildWithId({ roles: [teacherRole] });
				const clientId = Math.random().toString();

				const role = await service.trackRoleOfClient(clientId, userDo.id);

				expect(role).toEqual(undefined);
			});
		});
	});
});
