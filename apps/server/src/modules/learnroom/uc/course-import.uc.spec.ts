import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeImportService, CourseService } from '../service';
import { CourseImportUc } from './course-import.uc';

describe('CourseImportUc', () => {
	let module: TestingModule;
	let sut: CourseImportUc;
	let orm: MikroORM;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;
	let authorizationServiceMock: DeepMocked<AuthorizationService>;
	let courseServiceMock: DeepMocked<CourseService>;
	let courseImportServiceMock: DeepMocked<CommonCartridgeImportService>;

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseImportUc,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: CommonCartridgeImportService,
					useValue: createMock<CommonCartridgeImportService>(),
				},
			],
		}).compile();

		sut = module.get(CourseImportUc);
		configServiceMock = module.get(ConfigService);
		authorizationServiceMock = module.get(AuthorizationService);
		courseServiceMock = module.get(CourseService);
		courseImportServiceMock = module.get(CommonCartridgeImportService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importFromCommonCartridge', () => {
		describe('when the feature is enabled', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const file = Buffer.from('');

				configServiceMock.getOrThrow.mockReturnValue(true);
				authorizationServiceMock.getUserWithPermissions.mockResolvedValue(user);
				courseImportServiceMock.createCourse.mockReturnValue(course);

				return { user, course, file };
			};

			it('should check the permissions', async () => {
				const { user, file } = setup();

				await sut.importFromCommonCartridge(user.id, file);

				expect(authorizationServiceMock.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_CREATE]);
			});

			it('should create the course', async () => {
				const { user, course, file } = setup();

				await sut.importFromCommonCartridge(user.id, file);

				expect(courseServiceMock.create).toHaveBeenCalledWith(course);
			});
		});

		describe('when user has insufficient permissions', () => {
			const setup = () => {
				configServiceMock.getOrThrow.mockReturnValue(true);
				authorizationServiceMock.checkAllPermissions.mockImplementation(() => {
					throw new Error();
				});
			};

			it('should throw', async () => {
				setup();

				await expect(sut.importFromCommonCartridge(faker.string.uuid(), Buffer.from(''))).rejects.toThrow();
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				configServiceMock.getOrThrow.mockReturnValue(false);
			};

			it('should throw', async () => {
				setup();

				await expect(sut.importFromCommonCartridge(faker.string.uuid(), Buffer.from(''))).rejects.toThrow(
					NotFoundException
				);
			});
		});
	});
});
