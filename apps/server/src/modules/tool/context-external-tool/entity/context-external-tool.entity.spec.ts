import { contextExternalToolEntityFactory } from '@shared/testing/factory/context-external-tool-entity.factory';
import { externalToolEntityFactory } from '@shared/testing/factory/external-tool-entity.factory';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { CustomParameterScope } from '../../common/enum/custom-parameter-scope.enum';
import { CustomParameterType } from '../../common/enum/custom-parameter-type.enum';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { BasicToolConfigEntity } from '../../external-tool/entity/config/basic-tool-config.entity';
import { ExternalToolConfigEntity } from '../../external-tool/entity/config/external-tool-config.entity';
import { CustomParameterEntity } from '../../external-tool/entity/custom-parameter/custom-parameter.entity';
import { ExternalToolEntity } from '../../external-tool/entity/external-tool.entity';
import { SchoolExternalToolEntity } from '../../school-external-tool/entity/school-external-tool.entity';
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
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				version: 1,
			});
			const schoolTool: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school: schoolFactory.buildWithId(),
				schoolParameters: [],
				toolVersion: 1,
			});
			const contextExternalToolEntity: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
				schoolTool,
				parameters: [],
				toolVersion: 1,
			});

			expect(contextExternalToolEntity instanceof ContextExternalToolEntity).toEqual(true);
		});
	});
});
