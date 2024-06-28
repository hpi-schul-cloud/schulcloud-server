import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../controller/dto';
import { SchoolExternalToolProps } from '../domain';
import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';

describe('SchoolExternalToolRequestMapper', () => {
	describe('mapSchoolExternalToolRequest', () => {
		describe('when SchoolExternalToolPostParams is given', () => {
			const setup = () => {
				const param: CustomParameterEntryParam = {
					name: 'name',
					value: 'value',
				};
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
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

				const schoolExternalToolDto: SchoolExternalToolProps =
					SchoolExternalToolRequestMapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolProps>({
					id: expect.any(String),
					toolId: params.toolId,
					parameters: [{ name: param.name, value: param.value }],
					schoolId: params.schoolId,
					isDeactivated: true,
				});
			});
		});

		describe('when parameters are not given', () => {
			const setup = () => {
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
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

				const schoolExternalToolDto: SchoolExternalToolProps =
					SchoolExternalToolRequestMapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolProps>({
					id: expect.any(String),
					toolId: params.toolId,
					parameters: [],
					schoolId: params.schoolId,
					isDeactivated: false,
				});
			});
		});
	});
});
