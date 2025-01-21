import { CustomParameterEntryEntity } from '@modules/tool/common/entity';
import {
	ContextExternalToolEntity,
	ContextExternalToolEntityProps,
	ContextExternalToolType,
} from '@modules/tool/context-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing/school-external-tool-entity.factory';
import { BaseFactory } from '@testing/factory/base.factory';
import { courseFactory } from '@testing/factory/course.factory';

export const contextExternalToolEntityFactory = BaseFactory.define<
	ContextExternalToolEntity,
	ContextExternalToolEntityProps
>(ContextExternalToolEntity, () => {
	return {
		contextId: courseFactory.buildWithId().id,
		contextType: ContextExternalToolType.COURSE,
		displayName: 'My Course Tool 1',
		schoolTool: schoolExternalToolEntityFactory.buildWithId(),
		parameters: [new CustomParameterEntryEntity({ name: 'contextMockParameter', value: 'mockValue' })],
	};
});
