import { schoolEntityFactory } from '@modules/school/testing';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolEntity, SchoolExternalToolEntityProps } from '@modules/tool/school-external-tool/entity';
import { BaseFactory } from '@testing/factory/base.factory';

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
