import { BaseFactory } from '@shared/testing/factory/base.factory';
import { CustomParameterEntryEntity } from '@src/modules/tool/common/entity';
import {
	ContextExternalToolEntity,
	ContextExternalToolType,
	IContextExternalToolProperties,
} from '@src/modules/tool/context-external-tool/entity';
import { courseFactory } from './course.factory';
import { schoolExternalToolEntityFactory } from './school-external-tool-entity.factory';

export const contextExternalToolEntityFactory = BaseFactory.define<
	ContextExternalToolEntity,
	IContextExternalToolProperties
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
