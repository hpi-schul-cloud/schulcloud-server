import { courseEntityFactory } from '@modules/course/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { CustomParameterEntryEntity } from '../../common/entity';
import { schoolExternalToolEntityFactory } from '../../school-external-tool/testing/school-external-tool-entity.factory';
import { ContextExternalToolEntity, ContextExternalToolEntityProps, ContextExternalToolType } from '../repo';

export const contextExternalToolEntityFactory = BaseFactory.define<
	ContextExternalToolEntity,
	ContextExternalToolEntityProps
>(ContextExternalToolEntity, () => {
	return {
		contextId: courseEntityFactory.buildWithId().id,
		contextType: ContextExternalToolType.COURSE,
		displayName: 'My Course Tool 1',
		schoolTool: schoolExternalToolEntityFactory.buildWithId(),
		parameters: [new CustomParameterEntryEntity({ name: 'contextMockParameter', value: 'mockValue' })],
	};
});
