import { SchoolExternalTool, ToolConfigType } from '@shared/domain';
import { schoolFactory, setupEntities } from '@shared/testing';
import { schoolExternalToolFactory } from '@shared/testing/factory/school-external-tool.factory';
import { BasicToolConfig, CustomParameter, ExternalTool, ExternalToolConfig } from '../../external-tool/entity';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '../../common/interface';

describe('ExternalTool Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new SchoolExternalTool();
			expect(test).toThrow();
		});

		it('should create an external school Tool by passing required properties', () => {
			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			expect(schoolExternalTool instanceof SchoolExternalTool).toEqual(true);
		});

		it('should set schoolParameters to empty when is undefined', () => {
			const externalToolConfig: ExternalToolConfig = new BasicToolConfig({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameter = new CustomParameter({
				name: 'parameterName',
				displayName: 'User Friendly Name',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
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
			const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
				tool: externalTool,
				school: schoolFactory.buildWithId(),
				schoolParameters: [],
				toolVersion: 1,
			});

			expect(schoolExternalTool.schoolParameters).toEqual([]);
		});
	});
});
