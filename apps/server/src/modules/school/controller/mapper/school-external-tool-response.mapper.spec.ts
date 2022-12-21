import { Test, TestingModule } from '@nestjs/testing';
import { CustomParameterDO } from '@shared/domain/domainobject/external-tool';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { CustomParameterResponse } from '../../../tool/controller/dto';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
} from '../../../tool/interface';
import { SchoolExternalToolResponse } from '../dto/response/school-external-tool.response';
import { SchoolExternalToolResponseMapper } from './school-external-tool-response.mapper';

describe('SchoolExternalToolResponseMapper', () => {
	let module: TestingModule;
	let mapper: SchoolExternalToolResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SchoolExternalToolResponseMapper],
		}).compile();

		mapper = module.get(SchoolExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
			name: 'mockName',
			default: 'mockDefault',
			location: CustomParameterLocationParams.PATH,
			scope: CustomParameterScopeParams.SCHOOL,
			type: CustomParameterTypeParams.STRING,
			regex: 'mockRegex',
			regexComment: 'mockComment',
			isOptional: false,
		});

		const schoolExternalToolResponse: SchoolExternalToolResponse = new SchoolExternalToolResponse({
			id: '1',
			toolId: '1',
			schoolId: '1',
			parameters: [customParameterResponse],
			version: 1,
		});

		const customParameterDO: CustomParameterDO = new CustomParameterDO({
			name: 'mockName',
			default: 'mockDefault',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			regex: 'mockRegex',
			regexComment: 'mockComment',
			isOptional: false,
		});
		const schoolExternalToolDO: SchoolExternalToolDO = new SchoolExternalToolDO({
			id: '1',
			toolId: '1',
			schoolId: '1',
			parameters: [customParameterDO],
			toolVersion: 1,
		});

		return {
			schoolExternalToolDO,
			schoolExternalToolResponse,
		};
	};

	describe('should call mapToResponse', () => {
		it('when mapping schoolExternalToolDO', () => {
			const { schoolExternalToolDO, schoolExternalToolResponse } = setup();

			const result: SchoolExternalToolResponse = mapper.mapToResponse(schoolExternalToolDO);

			expect(result).toEqual(schoolExternalToolResponse);
		});
	});
});
