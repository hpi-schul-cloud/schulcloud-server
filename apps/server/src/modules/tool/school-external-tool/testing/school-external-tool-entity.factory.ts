import { BaseFactory } from '@testing/factory/base.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { externalToolEntityFactory } from '../../external-tool/testing';
import { SchoolExternalToolEntity, SchoolExternalToolEntityProps } from '../repo';

export const schoolExternalToolEntityFactory = BaseFactory.define<
	SchoolExternalToolEntity,
	SchoolExternalToolEntityProps
>(SchoolExternalToolEntity, () => {
	return {
		tool: externalToolEntityFactory.buildWithId(),
		school: schoolEntityFactory.buildWithId(),
		schoolParameters: [{ name: 'schoolMockParameter', value: 'mockValue' }],
		isDeactivated: false,
	};
});
