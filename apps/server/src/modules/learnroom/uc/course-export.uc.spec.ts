import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

describe('CourseExportUc', () => {
	let module: TestingModule;
	let courseExportUc: CourseExportUc;
	let courseExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let authorizationServiceMock: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseExportUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();
		courseExportUc = module.get(CourseExportUc);
		courseExportServiceMock = module.get(CommonCartridgeExportService);
		authorizationServiceMock = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('exportCourse', () => {
		const version: CommonCartridgeVersion = CommonCartridgeVersion.V_1_1_0;
		it('should check for permissions', async () => {
			authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();
			await expect(courseExportUc.exportCourse('', '', version)).resolves.not.toThrow();
			expect(authorizationServiceMock.checkPermissionByReferences).toBeCalledTimes(1);
		});

		it('should return a binary file as buffer', async () => {
			courseExportServiceMock.exportCourse.mockResolvedValueOnce(Buffer.from(''));
			authorizationServiceMock.checkPermissionByReferences.mockResolvedValueOnce();

			await expect(courseExportUc.exportCourse('', '', version)).resolves.toBeInstanceOf(Buffer);
		});
	});
});
