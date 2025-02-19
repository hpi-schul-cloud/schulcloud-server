import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeImportService } from '../service';
import { CourseImportUc } from './course-import.uc';

describe('CourseImportUc', () => {
	let module: TestingModule;
	let sut: CourseImportUc;
	let orm: MikroORM;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;
	let authorizationServiceMock: DeepMocked<AuthorizationService>;
	let courseImportServiceMock: DeepMocked<CommonCartridgeImportService>;

	beforeAll(async () => {
		orm = await setupEntities([User, Course, CourseGroup]);
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
					provide: CommonCartridgeImportService,
					useValue: createMock<CommonCartridgeImportService>(),
				},
			],
		}).compile();

		sut = module.get(CourseImportUc);
		configServiceMock = module.get(ConfigService);
		authorizationServiceMock = module.get(AuthorizationService);
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
				courseImportServiceMock.importFile.mockResolvedValue();

				return { user, course, file };
			};

			it('should check the permissions', async () => {
				const { user, file } = setup();

				await sut.importFromCommonCartridge(user.id, file);

				expect(authorizationServiceMock.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.COURSE_CREATE]);
			});

			it('should call import service', async () => {
				const { user, file } = setup();

				await sut.importFromCommonCartridge(user.id, file);

				expect(courseImportServiceMock.importFile).toHaveBeenCalledTimes(1);
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
