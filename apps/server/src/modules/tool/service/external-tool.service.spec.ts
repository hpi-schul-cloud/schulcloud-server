import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';

import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	IFindOptions,
	SortOrder,
} from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { ExternalToolService } from './external-tool.service';
import { ToolConfigType } from '../interface/tool-config-type.enum';

describe('ExternalToolService', () => {
	let module: TestingModule;
	let service: ExternalToolService;

	let externalToolRepo: DeepMocked<ExternalToolRepo>;
	let schoolToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let courseToolRepo: DeepMocked<CourseExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: CourseExternalToolRepo,
					useValue: createMock<CourseExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolService);
		externalToolRepo = module.get(ExternalToolRepo);
		schoolToolRepo = module.get(SchoolExternalToolRepo);
		courseToolRepo = module.get(CourseExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});
		const customParameterDO: CustomParameterDO = new CustomParameterDO({
			name: 'mockName',
			default: 'mockDefault',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			regex: 'mockRegex',
		});
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
			id: 'tool1',
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameterDO],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfigDO,
		});

		const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
			clientId: 'mockId',
			skipConsent: false,
			type: ToolConfigType.OAUTH2,
			baseUrl: 'mockUrl',
		});

		return {
			externalToolDO,
			oauth2ToolConfigDO,
			customParameterDO,
		};
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createExternalTool', () => {
		it('should save DO', async () => {
			const { externalToolDO } = setup();
			externalToolRepo.save.mockResolvedValue(externalToolDO);

			const expected = await service.createExternalTool(externalToolDO);

			expect(expected).toEqual(externalToolDO);
			expect(externalToolRepo.save).toHaveBeenCalledWith(externalToolDO);
		});
	});

	describe('deleteExternalTool', () => {
		const setupDelete = () => {
			const schoolExternalToolDO: SchoolExternalToolDO = new SchoolExternalToolDO({
				id: 'schoolTool1',
				toolId: 'tool1',
				schoolId: 'school1',
				parameters: [],
				toolVersion: 1,
			});

			schoolToolRepo.findByToolId.mockResolvedValue([schoolExternalToolDO]);

			return { schoolExternalToolDO };
		};

		it('should delete all related CourseExternalTools', async () => {
			const toolId = 'tool1';
			setup();
			const { schoolExternalToolDO } = setupDelete();

			await service.deleteExternalTool(toolId);

			expect(courseToolRepo.deleteBySchoolExternalToolIds).toHaveBeenCalledWith([schoolExternalToolDO.id]);
		});

		it('should delete all related SchoolExternalTools', async () => {
			const toolId = 'tool1';
			setup();
			setupDelete();

			await service.deleteExternalTool(toolId);

			expect(schoolToolRepo.deleteByToolId).toHaveBeenCalledWith(toolId);
		});

		it('should delete the ExternalTool', async () => {
			const toolId = 'tool1';
			setup();
			setupDelete();

			await service.deleteExternalTool(toolId);

			expect(externalToolRepo.deleteById).toHaveBeenCalledWith(toolId);
		});
	});

	describe('isNameUnique', () => {
		it('should find a tool with this name', async () => {
			const { externalToolDO } = setup();
			externalToolRepo.findByName.mockResolvedValue(null);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(true);
			expect(externalToolRepo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});

		it('should not find a tool with this name', async () => {
			const { externalToolDO } = setup();
			externalToolRepo.findByName.mockResolvedValue(externalToolDO);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(false);
			expect(externalToolRepo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});
	});

	describe('isClientIdUnique', () => {
		it('should find a tool with this client id', async () => {
			const { oauth2ToolConfigDO } = setup();
			externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(null);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(true);
			expect(externalToolRepo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
		});

		it('should not find a tool with this client id', async () => {
			const { externalToolDO, oauth2ToolConfigDO } = setup();
			externalToolRepo.findByOAuth2ConfigClientId.mockResolvedValue(externalToolDO);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(false);
			expect(externalToolRepo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
		});
	});

	describe('hasDuplicateAttributes', () => {
		it('should not find duplicate custom parameters if there are none', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.hasDuplicateAttributes([customParameterDO]);

			expect(expected).toEqual(false);
		});

		it('should find duplicate custom parameters if there are any', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.hasDuplicateAttributes([customParameterDO, customParameterDO]);

			expect(expected).toEqual(true);
		});
	});

	describe('validateByRegex', () => {
		it('should validate the regular expression', () => {
			const { customParameterDO } = setup();

			const expected: boolean = service.validateByRegex([customParameterDO]);

			expect(expected).toEqual(true);
		});

		it('should not validate a faulty regular expression', () => {
			const { customParameterDO } = setup();
			customParameterDO.regex = '[';

			const expected: boolean = service.validateByRegex([customParameterDO]);

			expect(expected).toEqual(false);
		});
	});

	describe('findExternalTool', () => {
		it('should call the externalToolRepo', async () => {
			const { externalToolDO } = setup();
			const query: Partial<ExternalToolDO> = {
				id: externalToolDO.id,
				name: externalToolDO.name,
			};
			const options: IFindOptions<ExternalToolDO> = {
				order: {
					id: SortOrder.asc,
					name: SortOrder.asc,
				},
				pagination: {
					limit: 2,
					skip: 1,
				},
			};

			await service.findExternalTools(query, options);

			expect(externalToolRepo.find).toHaveBeenCalledWith(query, options);
		});
	});
});
