import { type AnyBoardNode, BoardExternalReferenceType, BoardNodeService, isColumnBoard } from '@modules/board';
import { Group, GroupService } from '@modules/group';
import { CourseService } from '@modules/learnroom';
import { Injectable } from '@nestjs/common';
import { Course } from '@shared/domain/entity';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalToolLaunchable } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoGroupExternalUuidStrategy implements AutoParameterStrategy {
	constructor(
		private readonly courseService: CourseService,
		private readonly groupService: GroupService,
		private readonly boardNodeService: BoardNodeService
	) {}

	async getValue(
		_schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		switch (contextExternalTool.contextRef.type) {
			case ToolContextType.BOARD_ELEMENT: {
				const boardElement: AnyBoardNode = await this.boardNodeService.findById(contextExternalTool.contextRef.id);
				const board: AnyBoardNode = await this.boardNodeService.findRoot(boardElement);

				if (!isColumnBoard(board) || board.context.type !== BoardExternalReferenceType.Course) {
					return undefined;
				}

				const uuid: string | undefined = await this.getExternalUuidFromCourse(board.context.id);

				return uuid;
			}
			case ToolContextType.COURSE: {
				const uuid: string | undefined = await this.getExternalUuidFromCourse(contextExternalTool.contextRef.id);

				return uuid;
			}
			default: {
				return undefined;
			}
		}
	}

	private async getExternalUuidFromCourse(courseId: string): Promise<string | undefined> {
		const course: Course = await this.courseService.findById(courseId);

		const syncedGroup: Group | undefined = await this.getSyncedGroup(course);

		const groupUuid = syncedGroup?.externalSource?.externalId;

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
