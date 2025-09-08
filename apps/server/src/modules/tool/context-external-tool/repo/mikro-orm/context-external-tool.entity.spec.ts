import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { setupEntities } from '@testing/database';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ToolConfigType,
} from '../../../common/enum';
import { BasicToolConfigEntity, CustomParameterEntity, ExternalToolConfigEntity } from '../../../external-tool/repo';
import { externalToolEntityFactory } from '../../../external-tool/testing';
import { schoolExternalToolEntityFactory } from '../../../school-external-tool/testing';
import { contextExternalToolEntityFactory } from '../../testing';
import { ContextExternalToolType } from './context-external-tool-type.enum';
import { ContextExternalToolEntity } from './context-external-tool.entity';

describe(ContextExternalToolEntity.name, () => {
	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new ContextExternalToolEntity();
			expect(test).toThrow();
		});

		describe('when id is passed', () => {
			it('should set id', () => {
				const contextExternalToolEntity: ContextExternalToolEntity = new ContextExternalToolEntity({
					id: new ObjectId().toHexString(),
					schoolTool: schoolExternalToolEntityFactory.buildWithId(),
					contextId: new ObjectId(),
					contextType: ContextExternalToolType.MEDIA_BOARD,
					parameters: [],
				});

				expect(contextExternalToolEntity.id).toBeDefined();
			});
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
			const externalToolEntity = externalToolEntityFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
			});
			const schoolTool = schoolExternalToolEntityFactory.buildWithId({
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
