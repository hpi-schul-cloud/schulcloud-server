import {
	ContextExternalTool,
	ContextExternalToolType,
	CustomParameterEntry,
	IContextExternalToolProperties,
} from '@shared/domain';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { courseFactory } from './course.factory';
import { schoolExternalToolFactory } from './school-external-tool.factory';

export const contextExternalToolFactory = BaseFactory.define<ContextExternalTool, IContextExternalToolProperties>(
	ContextExternalTool,
	() => {
		return {
			contextId: courseFactory.buildWithId().id,
			contextType: ContextExternalToolType.COURSE,
			displayName: 'My Course Tool 1',
			schoolTool: schoolExternalToolFactory.buildWithId(),
			parameters: [new CustomParameterEntry({ name: 'mockParamater', value: 'mockValue' })],
			toolVersion: 1,
		};
	}
);
