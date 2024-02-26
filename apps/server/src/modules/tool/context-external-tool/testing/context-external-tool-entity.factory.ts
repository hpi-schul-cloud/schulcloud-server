import { CustomParameterEntryEntity } from '@modules/tool/common/entity';
import {
	ContextExternalToolEntity,
	ContextExternalToolProperties,
	ContextExternalToolType,
} from '@modules/tool/context-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing/school-external-tool-entity.factory';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { courseFactory } from '@shared/testing/factory/course.factory';

export const contextExternalToolEntityFactory = BaseFactory.define<
	ContextExternalToolEntity,
	ContextExternalToolProperties
>(ContextExternalToolEntity, () => {
	return {
		contextId: courseFactory.buildWithId().id,
		contextType: ContextExternalToolType.COURSE,
		displayName: 'My Course Tool 1',
		schoolTool: schoolExternalToolEntityFactory.buildWithId(),
		parameters: [new CustomParameterEntryEntity({ name: 'contextMockParameter', value: 'mockValue' })],
		toolVersion: 1,
	};
});
