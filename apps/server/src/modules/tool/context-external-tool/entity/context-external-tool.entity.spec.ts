import { schoolEntityFactory, setupEntities } from '@shared/testing';

import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '../../common/enum';

import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolConfigEntity,
	ExternalToolEntity,
} from '../../external-tool/entity';
import { externalToolEntityFactory } from '../../external-tool/testing';
import { SchoolExternalToolEntity } from '../../school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '../../school-external-tool/testing';
import { contextExternalToolEntityFactory } from '../testing';
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
				isProtected: false,
			});
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
			});
			const schoolTool: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school: schoolEntityFactory.buildWithId(),
				schoolParameters: [],
			});
			const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				schoolTool,
				parameters: [],
			});

			expect(contextExternalToolEntity instanceof ContextExternalToolEntity).toEqual(true);
		});
	});
});
