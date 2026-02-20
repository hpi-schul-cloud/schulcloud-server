import { BoardExternalReference, BoardExternalReferenceType, BoardNodeService, ColumnBoard } from '@modules/board';
import { BoardFeature, ElementReferenceType, ParentNodeInfo } from '@modules/board/domain';
import { CourseService } from '@modules/course';
import { CourseFeatures } from '@modules/course/repo';
import { RoomService } from '@modules/room';
import { SchoolFeature } from '@modules/school/domain';
import { UserService } from '@modules/user';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacySchoolService } from '../legacy-school';
import { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from './board-context.config';

@Injectable()
export class BoardContextApiHelperService {
	constructor(
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly boardNodeService: BoardNodeService,
		private readonly legacySchoolService: LegacySchoolService,
		private readonly userService: UserService,
		@Inject(BOARD_CONTEXT_PUBLIC_API_CONFIG)
		private readonly boardContextConfig: BoardContextPublicApiConfig
	) {}

	private isCourse(type: BoardExternalReferenceType): boolean {
		return type === BoardExternalReferenceType.Course;
	}
	private isRoom(type: BoardExternalReferenceType): boolean {
		return type === BoardExternalReferenceType.Room;
	}
	private isUser(type: BoardExternalReferenceType): boolean {
		return type === BoardExternalReferenceType.User;
	}

	public async isLockedRoom(context: BoardExternalReference): Promise<boolean> {
		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

		}

		return true;
	}

	public async getParentsOfElement(boardId: EntityId): Promise<ParentNodeInfo[]> {
		const columnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId, 0);
		const { type, id } = columnBoard.context;

		const items: ParentNodeInfo[] = [];
		let name: string | undefined;

		if (this.isCourse(type)) {
			const course = await this.courseService.findById(id);
			name = course.name;
		} else if (this.isRoom(type)) {
			const room = await this.roomService.getSingleRoom(id);
			name = room.name;
		} else if (this.isUser(type)) {
			const user = await this.userService.getUserEntityWithRoles(id);
			name = `${user.firstName} ${user.lastName}`;
		} else {
			throw new BadRequestException(`Unsupported board reference type ${type as string}`);
		}

		items.push({
			id,
			name,
			type,
		});
		items.push({ id: columnBoard.id, name: columnBoard.title, type: ElementReferenceType.BOARD });

		return items;
	}

	public async getSchoolIdForBoardNode(nodeId: EntityId): Promise<EntityId> {
		const boardContext = await this.getBoardContext(nodeId);
		const schoolId = await this.getSchoolIdForBoardContext(boardContext);
		return schoolId;
	}

	public async getFeaturesForBoardNode(nodeId: EntityId): Promise<BoardFeature[]> {
		const boardContext = await this.getBoardContext(nodeId);
		const features = await this.getFeaturesForBoardContext(boardContext);
		return features;
	}

	private async getBoardContext(nodeId: EntityId): Promise<BoardExternalReference> {
		const boardNode = await this.boardNodeService.findById(nodeId, 0);
		const columnBoard = await this.boardNodeService.findByClassAndId(ColumnBoard, boardNode.rootId, 0);
		return columnBoard.context;
	}

	private async getSchoolIdForBoardContext(context: BoardExternalReference): Promise<EntityId> {
		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(context.id);

			return course.school.id;
		}

		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

			return room.schoolId;
		}
		/* istanbul ignore next */
		throw new Error(`Unsupported board reference type ${context.type as string}`);
	}

	private async getFeaturesForBoardContext(context: BoardExternalReference): Promise<BoardFeature[]> {
		const features: BoardFeature[] = [];

		if (context.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(context.id);

			if (
				this.isVideoConferenceEnabledForCourse(course.features) &&
				(await this.isVideoConferenceEnabledForSchool(course.school.id)) &&
				this.isVideoConferenceEnabledForConfig()
			) {
				features.push(BoardFeature.VIDEOCONFERENCE);
			}

			return features;
		}

		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

			if ((await this.isVideoConferenceEnabledForSchool(room.schoolId)) && this.isVideoConferenceEnabledForConfig()) {
				features.push(BoardFeature.VIDEOCONFERENCE);
			}

			return features;
		}

		/* istanbul ignore next */
		throw new BadRequestException(`Unsupported board reference type ${context.type as string}`);
	}

	private isVideoConferenceEnabledForCourse(courseFeatures?: CourseFeatures[]): boolean {
		return (courseFeatures ?? []).includes(CourseFeatures.VIDEOCONFERENCE);
	}

	private isVideoConferenceEnabledForSchool(schoolId: EntityId): Promise<boolean> {
		return this.legacySchoolService.hasFeature(schoolId, SchoolFeature.VIDEOCONFERENCE);
	}

	private isVideoConferenceEnabledForConfig(): boolean {
		return (
			this.boardContextConfig.featureColumnBoardVideoconferenceEnabled &&
			this.boardContextConfig.featureVideoconferenceEnabled
		);
	}
}
