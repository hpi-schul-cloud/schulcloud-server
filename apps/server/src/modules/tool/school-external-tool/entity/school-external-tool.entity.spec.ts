import { schoolEntityFactory, setupEntities } from '@shared/testing';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '../../common/enum';
import { CustomParameterEntity, ExternalToolConfigEntity, ExternalToolEntity } from '../../external-tool/entity';
import {
	basicToolConfigFactory,
	customParameterEntityFactory,
	externalToolEntityFactory,
} from '../../external-tool/testing';
import { schoolExternalToolConfigurationStatusEntityFactory, schoolExternalToolEntityFactory } from '../testing';
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
			const externalToolConfigEntity: ExternalToolConfigEntity = basicToolConfigFactory.buildWithId({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameterEntity = customParameterEntityFactory.build({
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
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				isDeactivated: false,
			});
			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school: schoolEntityFactory.buildWithId(),
				schoolParameters: [],
				status: schoolExternalToolConfigurationStatusEntityFactory.build(),
			});

			expect(schoolExternalToolEntity.schoolParameters).toEqual([]);
		});

		it('should set school external tool configuration status', () => {
			const externalToolConfigEntity: ExternalToolConfigEntity = basicToolConfigFactory.buildWithId({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'mockBaseUrl',
			});
			const customParameter: CustomParameterEntity = customParameterEntityFactory.build({
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
			const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId({
				name: 'toolName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				config: externalToolConfigEntity,
				parameters: [customParameter],
				isHidden: true,
				openNewTab: true,
				isDeactivated: false,
			});
			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				tool: externalToolEntity,
				school: schoolEntityFactory.buildWithId(),
				schoolParameters: [],
				status: schoolExternalToolConfigurationStatusEntityFactory.build(),
			});

			expect(schoolExternalToolEntity.status).toEqual({ isDeactivated: false, isOutdatedOnScopeSchool: false });
		});
	});
});
