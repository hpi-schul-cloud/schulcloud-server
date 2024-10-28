import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { GroupService } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { SyncAttribute } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseDoService, CourseSyncService } from '../service';

@Injectable()
export class CourseSyncUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseService: CourseDoService,
		private readonly courseSyncService: CourseSyncService,
		private readonly groupService: GroupService
	) {}

	public async stopSynchronization(userId: EntityId, courseId: EntityId): Promise<void> {
		const [course, user] = await Promise.all([
			this.courseService.findById(courseId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		await this.courseSyncService.stopSynchronization(course);
	}

	public async startSynchronization(
		userId: string,
		courseId: string,
		groupId: string,
		excludedFields?: SyncAttribute[]
	) {
		const [course, group, user] = await Promise.all([
			this.courseService.findById(courseId),
			this.groupService.findById(groupId),
			this.authorizationService.getUserWithPermissions(userId),
		]);

		this.authorizationService.checkPermission(
			user,
			course,
			AuthorizationContextBuilder.write([Permission.COURSE_EDIT])
		);

		await this.courseSyncService.startSynchronization(course, group, excludedFields);
	}
}
