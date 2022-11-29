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
	ExternalTool,
	IFindOptions,
	SortOrder,
} from '@shared/domain';
import { externalToolFactory } from '@shared/testing';
import { ExternalToolService } from './external-tool.service';
import { ToolConfigType } from '../interface/tool-config-type.enum';

describe('ExternalToolService', () => {
	let module: TestingModule;
	let service: ExternalToolService;

	let repo: DeepMocked<ExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ExternalToolService,
				{
					provide: ExternalToolRepo,
					useValue: createMock<ExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolService);
		repo = module.get(ExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	function setup() {
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
			id: '1',
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

		const externalTool: ExternalTool = externalToolFactory.buildWithId();

		return {
			externalToolDO,
			oauth2ToolConfigDO,
			externalTool,
			customParameterDO,
		};
	}

	describe('createExternalTool', () => {
		it('should save DO', async () => {
			const { externalToolDO } = setup();
			repo.save.mockResolvedValue(externalToolDO);

			const result: ExternalToolDO = await service.createExternalTool(externalToolDO);

			expect(result).toEqual(externalToolDO);
			expect(repo.save).toHaveBeenCalledWith(externalToolDO);
		});
	});

	describe('findExternalToolById', () => {
		it('should get DO', async () => {
			const { externalToolDO } = setup();
			repo.findById.mockResolvedValue(externalToolDO);

			const result: ExternalToolDO = await service.findExternalToolById('toolId');

			expect(result).toEqual(externalToolDO);
		});
	});

	describe('isNameUnique', () => {
		it('should find a tool with this name', async () => {
			const { externalToolDO } = setup();
			repo.findByName.mockResolvedValue(null);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(true);
			expect(repo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});

		it('should not find a tool with this name', async () => {
			const { externalToolDO, externalTool } = setup();
			repo.findByName.mockResolvedValue(externalTool);

			const expected: boolean = await service.isNameUnique(externalToolDO);

			expect(expected).toEqual(false);
			expect(repo.findByName).toHaveBeenCalledWith(externalToolDO.name);
		});
	});

	describe('isClientIdUnique', () => {
		it('should find a tool with this client id', async () => {
			const { oauth2ToolConfigDO } = setup();
			repo.findByOAuth2ConfigClientId.mockResolvedValue(null);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(true);
			expect(repo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
		});

		it('should not find a tool with this client id', async () => {
			const { oauth2ToolConfigDO, externalTool } = setup();
			repo.findByOAuth2ConfigClientId.mockResolvedValue(externalTool);

			const expected: boolean = await service.isClientIdUnique(oauth2ToolConfigDO);

			expect(expected).toEqual(false);
			expect(repo.findByOAuth2ConfigClientId).toHaveBeenCalledWith(oauth2ToolConfigDO.clientId);
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

			expect(repo.find).toHaveBeenCalledWith(query, options);
		});
	});
});
