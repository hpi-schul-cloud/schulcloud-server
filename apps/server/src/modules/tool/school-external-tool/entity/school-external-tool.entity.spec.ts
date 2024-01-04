import { schoolFactory, setupEntities } from '@shared/testing';
import { schoolExternalToolEntityFactory } from '@shared/testing/factory/school-external-tool-entity.factory';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	ExternalToolConfigEntity,
} from '../../external-tool/entity';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '../../common/enum';
import { SchoolExternalToolEntity } from './school-external-tool.entity';

describe('SchoolExternalToolEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new SchoolExternalToolEntity();
			expect(test).toThrow();
		});

		it('should create an external school Tool by passing required properties', () => {
			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();
			expect(schoolExternalToolEntity instanceof SchoolExternalToolEntity).toEqual(true);
		});

		it('should set schoolParameters to empty when is undefined', () => {
			const externalToolConfigEntity: ExternalToolConfigEntity = new BasicToolConfigEntity({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameterEntity = new CustomParameterEntity({
				name: 'parameterName',
				displayName: 'User Friendly Name',
				default: 'mock',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
				regexComment: 'mockComment',
				isOptional: false,
				isProtected: false,
			});
			const externalToolEntity: ExternalToolEntity = new ExternalToolEntity({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				version: 1,
			});
			const schoolExternalToolEntity: SchoolExternalToolEntity = new SchoolExternalToolEntity({
				tool: externalToolEntity,
				school: schoolFactory.buildWithId(),
				schoolParameters: [],
				toolVersion: 1,
			});

			expect(schoolExternalToolEntity.schoolParameters).toEqual([]);
		});
	});
});
