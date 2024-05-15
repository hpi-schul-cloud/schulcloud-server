import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolEntity, SchoolExternalToolEntityProps } from '@modules/tool/school-external-tool/entity';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { schoolEntityFactory } from '@shared/testing/factory/school-entity.factory';
import { schoolExternalToolConfigurationStatusEntityFactory } from './school-external-tool-configuration-status-entity.factory';

export const schoolExternalToolEntityFactory = BaseFactory.define<
	SchoolExternalToolEntity,
	SchoolExternalToolEntityProps
>(SchoolExternalToolEntity, () => {
	return {
		tool: externalToolEntityFactory.buildWithId(),
		school: schoolEntityFactory.buildWithId(),
		schoolParameters: [{ name: 'schoolMockParameter', value: 'mockValue' }],
		status: schoolExternalToolConfigurationStatusEntityFactory.build(),
	};
});
