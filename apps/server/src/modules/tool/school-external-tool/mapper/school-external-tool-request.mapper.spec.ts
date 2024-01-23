import { schoolToolConfigurationStatusFactory } from '@shared/testing';
import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';
import { SchoolExternalToolDto } from '../uc/dto/school-external-tool.types';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../controller/dto';

describe('SchoolExternalToolRequestMapper', () => {
	const mapper: SchoolExternalToolRequestMapper = new SchoolExternalToolRequestMapper();

	describe('mapSchoolExternalToolRequest', () => {
		describe('when SchoolExternalToolPostParams is given', () => {
			const setup = () => {
				const param: CustomParameterEntryParam = {
					name: 'name',
					value: 'value',
				};
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: [param],
					isDeactivated: true,
				};

				return {
					param,
					params,
				};
			};

			it('should return an schoolExternalTool', () => {
				const { param, params } = setup();

				const schoolExternalToolDto: SchoolExternalToolDto = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolDto>({
					toolId: params.toolId,
					parameters: [{ name: param.name, value: param.value }],
					schoolId: params.schoolId,
					toolVersion: params.version,
					status: schoolToolConfigurationStatusFactory.build({ isDeactivated: true }),
				});
			});
		});

		describe('when parameters are not given', () => {
			const setup = () => {
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: undefined,
					isDeactivated: false,
				};

				return {
					params,
				};
			};

			it('should return an schoolExternalTool without parameter', () => {
				const { params } = setup();

				const schoolExternalToolDto: SchoolExternalToolDto = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolDto>({
					toolId: params.toolId,
					parameters: [],
					schoolId: params.schoolId,
					toolVersion: params.version,
					status: schoolToolConfigurationStatusFactory.build(),
				});
			});
		});
	});
});
