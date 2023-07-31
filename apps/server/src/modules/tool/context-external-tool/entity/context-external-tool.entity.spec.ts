import {
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	schoolFactory,
	setupEntities,
} from '@shared/testing';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '../../common/enum';

import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	ExternalToolConfigEntity,
} from '../../external-tool/entity';
import { SchoolExternalToolEntity } from '../../school-external-tool/entity';
import { ContextExternalToolEntity } from './context-external-tool.entity';

describe('ExternalToolEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new ContextExternalToolEntity();
			expect(test).toThrow();
		});

		it('should create an external course Tool by passing required properties', () => {
			const externalToolConfigEntity: ExternalToolConfigEntity = new BasicToolConfigEntity({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameterEntity = new CustomParameterEntity({
				name: 'parameterName',
				displayName: 'User Friendly Name',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.CONTEXT,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
				regexComment: 'mockComment',
				isOptional: false,
			});
			const externalToolEntity: ExternalToolEntity = externalToolFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				version: 1,
			});
			const schoolTool: SchoolExternalToolEntity = schoolExternalToolFactory.buildWithId({
				tool: externalToolEntity,
				school: schoolFactory.buildWithId(),
				schoolParameters: [],
				toolVersion: 1,
			});
			const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolFactory.buildWithId({
				schoolTool,
				parameters: [],
				toolVersion: 1,
			});

			expect(contextExternalToolEntity instanceof ContextExternalToolEntity).toEqual(true);
		});
	});
});
