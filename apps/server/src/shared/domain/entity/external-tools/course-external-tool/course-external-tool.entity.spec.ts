import {
	BasicToolConfig,
	CourseExternalTool,
	CustomParameter,
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ExternalTool,
	ExternalToolConfig,
	SchoolExternalTool,
	ToolConfigType,
} from '@shared/domain';
import { courseFactory, schoolFactory, setupEntities } from '@shared/testing';

describe('ExternalTool Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseExternalTool();
			expect(test).toThrow();
		});

		it('should create an external course Tool by passing required properties', () => {
			const externalToolConfig: ExternalToolConfig = new BasicToolConfig({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameter = new CustomParameter({
				name: 'parameterName',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.COURSE,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
				regexComment: 'mockComment',
				isOptional: false,
			});
			const externalTool: ExternalTool = new ExternalTool({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfig,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				version: 1,
			});
			const schoolTool: SchoolExternalTool = new SchoolExternalTool({
				tool: externalTool,
				school: schoolFactory.buildWithId(),
				schoolParameters: [],
				toolVersion: 1,
			});
			const courseExternalTool: CourseExternalTool = new CourseExternalTool({
				schoolTool,
				course: courseFactory.buildWithId(),
				courseParameters: [],
				toolVersion: 1,
			});

			expect(courseExternalTool instanceof CourseExternalTool).toEqual(true);
		});
	});
});
