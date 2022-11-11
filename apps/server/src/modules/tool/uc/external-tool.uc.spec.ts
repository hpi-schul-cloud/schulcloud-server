import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolUc } from '@src/modules/tool/uc/external-tool.uc';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { NotImplementedException } from '@nestjs/common';
import { CustomParameterScope } from '@src/modules/tool/interface/custom-parameter-scope.enum';
import { CustomParameterLocation } from '@src/modules/tool/interface/custom-parameter-location.enum';
import { CustomParameterType } from '@src/modules/tool/interface/custom-parameter-type.enum';

describe('ExternalToolUc', () => {
	let module: TestingModule;
	let uc: ExternalToolUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolUc],
		}).compile();

		uc = module.get(ExternalToolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('uc should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('createExternalTool', () => {
		const bodyConfig: ExternalToolConfigCreateParams = {
			type: 'mockType',
			baseUrl: 'mockUrl',
		};
		const bodyParameters: CustomParameterCreateParams = {
			name: 'mockName',
			default: 'mockDefault',
			regex: 'mockRegex',
			scope: CustomParameterScope.COURSE,
			location: CustomParameterLocation.PATH,
			type: CustomParameterType.STRING,
		};
		const body: ExternalToolParams = {
			name: 'ExternalTool',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			config: bodyConfig,
			parameters: [bodyParameters],
			isHidden: false,
			openNewTab: true,
			version: 1,
		};
		it('should throw NotImplementedException', async () => {
			await expect(uc.createExternalTool(body)).rejects.toThrow(NotImplementedException);
		});
	});
});
