import { BoardExternalReference, BoardExternalReferenceType, BoardNodeService, ColumnBoard } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { RoomService } from '@modules/room';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CourseFeatures } from '@shared/domain/entity';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { BoardFeature } from '../board/domain';
import { LegacySchoolService } from '../legacy-school';
import { VideoConferenceConfig } from '../video-conference';

@Injectable()
export class BoardContextApiHelperService {
	constructor(
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly boardNodeService: BoardNodeService,
		private readonly legacySchoolService: LegacySchoolService,
		private readonly configService: ConfigService<VideoConferenceConfig, true>
	) {}

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
				this.isVideoConferenceEnabledForCourse(course.features) ||
				(await this.isVideoConferenceEnabledForSchool(course.school.id)) ||
				this.isVideoConferenceEnabledForConfig()
			) {
				features.push(BoardFeature.VIDEOCONFERENCE);
			}

			return features;
		}

		if (context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(context.id);

			if ((await this.isVideoConferenceEnabledForSchool(room.schoolId)) || this.isVideoConferenceEnabledForConfig()) {
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
		return this.configService.get('FEATURE_VIDEOCONFERENCE_ENABLED');
	}
}
