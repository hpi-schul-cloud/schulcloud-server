import { ContextExternalTool, CustomParameterEntry, IContextExternalToolProperties } from '@shared/domain';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { schoolExternalToolFactory } from './school-external-tool.factory';
import { ContextExternalToolType } from '../../domain/entity/tools/course-external-tool/context-external-tool-type.enum';
import { courseFactory } from './course.factory';

export const contextExternalToolFactory = BaseFactory.define<ContextExternalTool, IContextExternalToolProperties>(
	ContextExternalTool,
	() => {
		return {
			contextId: courseFactory.buildWithId().id,
			contextType: ContextExternalToolType.COURSE,
			contextToolName: 'My Course Tool 1',
			schoolTool: schoolExternalToolFactory.buildWithId(),
			parameters: [new CustomParameterEntry({ name: 'mockParamater', value: 'mockValue' })],
			toolVersion: 0,
		};
	}
);
