import { CustomParameterEntryEntity } from '@modules/tool/common/entity';
import {
	ContextExternalToolEntity,
	ContextExternalToolProperties,
	ContextExternalToolType,
} from '@modules/tool/context-external-tool/entity';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { courseFactory } from './course.factory';
import { schoolExternalToolEntityFactory } from './school-external-tool-entity.factory';

export const contextExternalToolEntityFactory = BaseFactory.define<
	ContextExternalToolEntity,
	ContextExternalToolProperties
>(ContextExternalToolEntity, () => {
	return {
		contextId: courseFactory.buildWithId().id,
		contextType: ContextExternalToolType.COURSE,
		displayName: 'My Course Tool 1',
		schoolTool: schoolExternalToolEntityFactory.buildWithId(),
		parameters: [new CustomParameterEntryEntity({ name: 'mockParamater', value: 'mockValue' })],
		toolVersion: 1,
	};
});
