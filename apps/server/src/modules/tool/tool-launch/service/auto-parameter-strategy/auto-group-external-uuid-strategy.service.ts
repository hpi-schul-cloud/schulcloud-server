import { Injectable } from '@nestjs/common';
import { CourseService } from '@modules/learnroom';
import { Group, GroupService } from '@modules/group';
import { Course } from '@shared/domain/entity';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoGroupExternalUuidStrategy implements AutoParameterStrategy {
	constructor(private readonly courseService: CourseService, private readonly groupService: GroupService) {}

	async getValue(
		_schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		if (contextExternalTool.contextRef.type !== ToolContextType.COURSE) {
			return undefined;
		}

		const courseId = contextExternalTool.contextRef.id;
		const course: Course = await this.courseService.findById(courseId);

		const syncedGroup: Group | undefined = await this.getSyncedGroup(course);
		if (!syncedGroup) {
			return undefined;
		}

		const groupUuid = syncedGroup.externalSource?.externalId;
		if (!groupUuid) {
			return undefined;
		}

		return groupUuid;
	}

	private async getSyncedGroup(course: Course): Promise<Group | undefined> {
		const syncedGroupId = course.syncedWithGroup?.id;
		if (!syncedGroupId) {
			return undefined;
		}

		const syncedGroup = await this.groupService.findById(syncedGroupId);
		return syncedGroup;
	}
}
