import { Injectable } from '@nestjs/common';
import { CourseService } from '@modules/learnroom';
import { ToolContextType } from '../../../common/enum';
import { MissingToolParameterValueLoggableException } from '../../error';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoMoinSchuleGroupUuidStrategy implements AutoParameterStrategy {
	constructor(private readonly courseService: CourseService) {}

	async getValue(
		_schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		if (contextExternalTool.contextRef.type !== ToolContextType.COURSE) {
			return undefined;
		}

		const courseId = contextExternalTool.contextRef.id;
		const courseEntity = await this.courseService.findById(courseId);
		const syncedGroup = courseEntity.syncedWithGroup;

		if (!syncedGroup) {
			return undefined;
		}

		const uuid = syncedGroup.externalSource?.externalId;

		if (!uuid) {
			// TODO: think if a new special error is needed for this case
			throw new MissingToolParameterValueLoggableException(contextExternalTool, []);
		}

		return uuid;
	}
}
