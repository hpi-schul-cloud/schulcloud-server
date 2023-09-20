import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { DemoSchoolService } from '../service/demo-school.service';
import { DemoSchoolUc } from './demo-school.uc';

describe(DemoSchoolUc.name, () => {
	let module: TestingModule;
	let uc: DemoSchoolUc;
	let em: EntityManager;
	let configService: DeepMocked<ConfigService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				DemoSchoolUc,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: DemoSchoolService,
					useValue: createMock<DemoSchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(DemoSchoolUc);
		em = module.get(EntityManager);
		configService = module.get(ConfigService);
		authorizationService = module.get(AuthorizationService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setup = async () => {
		jest.clearAllMocks();
		const user = userFactory.buildWithId();
		await em.persistAndFlush(user);

		return { user };
	};

	describe('createSchool', () => {
		describe('when feature is enabled', () => {
			it('should call the service', async () => {
				const { user } = await setup();
				configService.get.mockReturnValue(true);

				const schoolId = await uc.createSchool(user.id);

				expect(schoolId).toBeDefined();
			});

			it('should check for CREATE_DEMO_SCHOOL permission', async () => {
				const { user } = await setup();
				configService.get.mockReturnValue(true);

				await uc.createSchool(user.id);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith({}, ['CREATE_DEMO_SCHOOL']);
			});
		});

		describe('when feature is diabled', () => {
			describe('when user does not exist', () => {
				it('should write an error message if courseId is not valid', async () => {
					const fakeId = new ObjectId().toHexString();
					configService.get.mockReturnValue(false);

					await expect(uc.createSchool(fakeId)).rejects.toThrow(ForbiddenException);
				});
			});
		});
	});
});
