import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CommonCartridgeExportService } from '@src/modules/learnroom/service/common-cartridge-export.service';
import { AuthorizationReferenceService } from '@src/modules/authorization/domain/reference';
import { ObjectId } from 'bson';
import { ForbiddenException } from '@nestjs/common';
import { CourseExportUc } from './course-export.uc';
import { CommonCartridgeVersion } from '../common-cartridge';

describe('CourseExportUc', () => {
	let module: TestingModule;
	let courseExportUc: CourseExportUc;
	let courseExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let authorizationServiceMock: DeepMocked<AuthorizationReferenceService>;

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
			],
		}).compile();
		courseExportUc = module.get(CourseExportUc);
		courseExportServiceMock = module.get(CommonCartridgeExportService);
		authorizationServiceMock = module.get(AuthorizationReferenceService);
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

			return { version, userId, courseId };
		};

		describe('when authorization throw a error', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());
				courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));

				return setupParams();
			};

			it('should pass this error', async () => {
				const { courseId, userId, version } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version)).rejects.toThrowError(
					new ForbiddenException()
				);
			});
		});

		describe('when course export service throw a error', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
				courseExportServiceMock.exportCourse.mockRejectedValueOnce(new Error());

				return setupParams();
			};

			it('should pass this error', async () => {
				const { courseId, userId, version } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version)).rejects.toThrowError(new Error());
			});
		});

		describe('when authorization resolve', () => {
			const setup = () => {
				authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
				courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));

				return setupParams();
			};

			it('should check for permissions', async () => {
				const { courseId, userId, version } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version)).resolves.not.toThrow();
				expect(authorizationServiceMock.checkPermissionByReferences).toBeCalledTimes(1);
			});

			it('should return a binary file as buffer', async () => {
				const { courseId, userId, version } = setup();

				await expect(courseExportUc.exportCourse(courseId, userId, version)).resolves.toBeInstanceOf(Buffer);
			});
		});
	});
});
