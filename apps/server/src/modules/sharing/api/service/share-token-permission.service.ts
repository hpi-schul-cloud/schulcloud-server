import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ShareTokenContext, ShareTokenContextType, ShareTokenParentType } from '../../domainobject/share-token.do';

@Injectable()
export class ShareTokenPermissionService {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly schoolService: SchoolService
	) {}

	public checkFeatureEnabled(parentType: ShareTokenParentType): void {
		// TODO Configuration.get is the deprecated way to read envirment variables
		switch (parentType) {
			case ShareTokenParentType.Course:
				if (!(Configuration.get('FEATURE_COURSE_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_COURSE_SHARE');
				}
				break;
			case ShareTokenParentType.Lesson:
				if (!(Configuration.get('FEATURE_LESSON_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_LESSON_SHARE');
				}
				break;
			case ShareTokenParentType.Task:
				if (!(Configuration.get('FEATURE_TASK_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_TASK_SHARE');
				}
				break;
			case ShareTokenParentType.ColumnBoard:
				if (!(Configuration.get('FEATURE_COLUMN_BOARD_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_COLUMN_BOARD_SHARE');
				}
				break;
			case ShareTokenParentType.Room:
				if (!(Configuration.get('FEATURE_ROOM_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_ROOM_SHARE');
				}
				break;
			case ShareTokenParentType.Card:
				if (!(Configuration.get('FEATURE_COLUMN_BOARD_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_COLUMN_BOARD_SHARE');
				}
				break;
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}

	public async checkCourseWritePermission(
		user: User,
		courseId: EntityId,
		permission: Permission
	): Promise<{ course: CourseEntity }> {
		const course = await this.courseService.findById(courseId);
		this.authorizationService.checkPermission(user, course, AuthorizationContextBuilder.write([permission]));

		return {
			course,
		};
	}

	public async checkRoomWritePermission(user: User, roomId: EntityId, permissions: Permission[] = []): Promise<void> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);

		this.authorizationService.checkPermission(user, roomAuthorizable, AuthorizationContextBuilder.write(permissions));
	}

	public async checkContextReadPermission(userId: EntityId, context: ShareTokenContext): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (context.contextType === ShareTokenContextType.School) {
			await this.checkSchoolReadPermission(user, context.contextId);
		} else {
			throw new NotImplementedException();
		}
	}

	private async checkSchoolReadPermission(user: User, schoolId: EntityId): Promise<void> {
		const school = await this.schoolService.getSchoolById(schoolId);
		const authorizationContext = AuthorizationContextBuilder.read([]);

		this.authorizationService.checkPermission(user, school, authorizationContext);
	}
}
