import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo } from '@shared/repo';
import { LtiPrivacyPermission, Page, SchoolFeatures } from '@shared/domain';
import { LtiToolService } from '@src/modules/tool/service/lti-tool.service';
import { SchoolService } from '@src/modules/school/service/school.service';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ForbiddenException } from '@nestjs/common';

describe('LtiToolService', () => {
	let module: TestingModule;
	let service: LtiToolService;

	let schoolService: DeepMocked<SchoolService>;
	let ltiToolRepo: DeepMocked<LtiToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiToolService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
			],
		}).compile();

		service = module.get(LtiToolService);
		schoolService = module.get(SchoolService);
		ltiToolRepo = module.get(LtiToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	function setup() {
		const courseId = 'courseId';
		const url = 'url';
		const ltiToolDo: LtiToolDO = {
			name: 'name',
			url,
			key: 'key',
			secret: 'secret',
			logo_url: 'logo_url',
			roles: [],
			privacy_permission: LtiPrivacyPermission.ANONYMOUS,
			customs: [],
			openNewTab: false,
			isHidden: false,
			originToolId: 'originToolId',
		};
		const originLtiToolSecret = 'secret';
		const bbbTool: LtiToolDO = {
			...ltiToolDo,
			secret: originLtiToolSecret,
			name: 'Video-Konferenz mit BigBlueButton',
		};
		const page: Page<LtiToolDO> = new Page<LtiToolDO>([ltiToolDo, bbbTool], 2);
		const schoolId = 'schoolId';

		return {
			courseId,
			ltiToolDo,
			url,
			bbbTool,
			page,
			schoolId,
		};
	}

	describe('setupBBB', () => {
		it('should update url when is a bbb request', () => {
			const { ltiToolDo, courseId } = setup();
			ltiToolDo.url = 'BBB_URL';

			service.setupBBB(ltiToolDo, courseId);

			expect(ltiToolDo.url).toEqual(`/videoconference/course/${courseId}`);
		});

		it('should not update url when is no bbb request', () => {
			const { ltiToolDo, courseId, url } = setup();

			service.setupBBB(ltiToolDo, courseId);

			expect(ltiToolDo.url).toEqual(url);
		});
	});

	describe('addSecret', () => {
		it('should call the ltiToolRepo', async () => {
			const { ltiToolDo } = setup();

			await service.addSecret(ltiToolDo);

			expect(ltiToolRepo.findById).toHaveBeenCalledWith(ltiToolDo.originToolId);
		});

		it('should add secret from origin tool', async () => {
			const { ltiToolDo, bbbTool } = setup();
			ltiToolRepo.findById.mockResolvedValue(bbbTool);

			await service.addSecret(ltiToolDo);

			expect(ltiToolDo.secret).toEqual(bbbTool.secret);
		});
	});

	describe('filterFindBBB', () => {
		it('should do nothing when school has no bbb tool', async () => {
			const { page, schoolId } = setup();
			page.removeElement(1);

			await service.filterFindBBB(page, schoolId);

			expect(schoolService.hasFeature).not.toHaveBeenCalled();
		});

		it('should remove bbb tool when conference feature is not enabled for school ', async () => {
			const { page, schoolId, bbbTool } = setup();
			schoolService.hasFeature.mockResolvedValue(false);

			await service.filterFindBBB(page, schoolId);

			expect(page.data).not.toContain(bbbTool);
		});

		it('should not remove bbb tool when conference feature is enabled for school ', async () => {
			const { page, schoolId, bbbTool, ltiToolDo } = setup();
			schoolService.hasFeature.mockResolvedValue(true);

			await service.filterFindBBB(page, schoolId);

			expect(page.data).toEqual([ltiToolDo, bbbTool]);
		});

		it('should call the schoolService', async () => {
			const { page, schoolId } = setup();

			await service.filterFindBBB(page, schoolId);

			expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeatures.VIDEOCONFERENCE);
		});
	});

	describe('filterGetBBB', () => {
		it('should do nothing when school has no bbb tool', async () => {
			const { ltiToolDo, schoolId } = setup();

			await service.filterGetBBB(ltiToolDo, schoolId);

			expect(schoolService.hasFeature).not.toHaveBeenCalled();
		});

		it('should do nothing when school has the bbb feature and a bbb tool', async () => {
			const { bbbTool, schoolId } = setup();

			await service.filterGetBBB(bbbTool, schoolId);

			expect(schoolService.hasFeature).toHaveBeenCalledWith(schoolId, SchoolFeatures.VIDEOCONFERENCE);
		});

		it('should throw ForbiddenException when school does not has the bbb feature and a bbb tool', async () => {
			const { bbbTool, schoolId } = setup();
			schoolService.hasFeature.mockResolvedValue(false);

			const func = () => service.filterGetBBB(bbbTool, schoolId);

			await expect(func).rejects.toThrow(ForbiddenException);
		});
	});
});
