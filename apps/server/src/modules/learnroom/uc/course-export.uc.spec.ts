import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CommonCartridgeVersion } from '@modules/common-cartridge';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { AuthorizationReferenceService } from '../../authorization/domain';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CourseExportUc } from './course-export.uc';

describe('CourseExportUc', () => {
	let module: TestingModule;
	let courseExportUc: CourseExportUc;
	let courseExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let authorizationServiceMock: DeepMocked<AuthorizationReferenceService>;
	let configServiceMock: DeepMocked<ConfigService<LearnroomConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseExportUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<LearnroomConfig, true>>(),
				},
			],
		}).compile();
		courseExportUc = module.get(CourseExportUc);
		courseExportServiceMock = module.get(CommonCartridgeExportService);
		authorizationServiceMock = module.get(AuthorizationReferenceService);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		// is needed to solve buffer test isolation
		jest.resetAllMocks();
	});

	describe('exportCourse', () => {
		const setupParams = () => {
			const courseId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const version: CommonCartridgeVersion = CommonCartridgeVersion.V_1_1_0;
			const topics: string[] = [faker.string.uuid()];
			const tasks: string[] = [faker.string.uuid()];

			return { version, userId, courseId, topics, tasks };
		};

		describe('when authorization throw a error', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));
				configServiceMock.get.mockReturnValueOnce(true);

				return setupParams();
			};

			it('should pass this error', async () => {
				const { courseId, userId, version, topics, tasks } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version, topics, tasks)).rejects.toThrowError(
					new ForbiddenException()
				);
			});
		});

		describe('when course export service throw a error', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
				courseExportServiceMock.exportCourse.mockRejectedValueOnce(new Error());
				configServiceMock.get.mockReturnValueOnce(true);

				return setupParams();
			};

			it('should pass this error', async () => {
				const { courseId, userId, version, topics, tasks } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version, topics, tasks)).rejects.toThrowError(
					new Error()
				);
			});
		});

		describe('when authorization resolve', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
				courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));
				configServiceMock.get.mockReturnValueOnce(true);

				return setupParams();
			};

			it('should check for permissions', async () => {
				const { courseId, userId, version, topics, tasks } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version, topics, tasks)).resolves.not.toThrow();
				expect(authorizationServiceMock.checkPermissionByReferences).toBeCalledTimes(1);
			});

			it('should return a binary file as buffer', async () => {
				const { courseId, userId, version, topics, tasks } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version, topics, tasks)).resolves.toBeInstanceOf(
					Buffer
				);
			});
		});

		describe('when feature is disabled', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
				courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));
				configServiceMock.get.mockReturnValueOnce(false);

				return setupParams();
			};

			it('should throw a NotFoundException', async () => {
				const { courseId, userId, version, topics, tasks } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version, topics, tasks)).rejects.toThrowError(
					new NotFoundException()
				);
			});
		});
	});
});
