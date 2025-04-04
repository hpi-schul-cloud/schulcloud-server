import { Course, CourseDoService, CourseSyncService } from '@modules/course';
import {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryFactory,
	CourseSynchronizationHistoryService,
} from '@modules/course-synchronization-history';
import { Group } from '@modules/group';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CourseSyncHistoryGroupExternalSourceMissingLoggableException } from '../../../loggable';
import type { ProvisioningConfig } from '../../../provisioning.config';

@Injectable()
export class SchulconnexCourseSyncService {
	constructor(
		private readonly courseSyncService: CourseSyncService,
		private readonly courseService: CourseDoService,
		private readonly courseSynchronizationHistoryService: CourseSynchronizationHistoryService,
		private readonly configService: ConfigService<ProvisioningConfig, true>
	) {}

	public async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		await this.courseSyncService.synchronizeCourseWithGroup(newGroup, oldGroup);
	}

	public async synchronizeCourseFromHistory(group: Group): Promise<void> {
		const externalGroupId = group.externalSource?.externalId;
		if (!externalGroupId) {
			return;
		}

		const syncHistories: CourseSynchronizationHistory[] =
			await this.courseSynchronizationHistoryService.findByExternalGroupId(externalGroupId);
		if (!syncHistories.length) {
			return;
		}

		const courses: Course[] = await Promise.all(
			syncHistories.map(async (history: CourseSynchronizationHistory): Promise<Course> => {
				const courseFromHistory = await this.courseService.findById(history.synchronizedCourse);
				courseFromHistory.excludeFromSync = history.excludeFromSync;

				return courseFromHistory;
			})
		);

		const coursesWithoutSync: Course[] = courses.filter((course: Course) => !course.syncedWithGroup);

		if (coursesWithoutSync.length) {
			await this.courseSyncService.synchronize(coursesWithoutSync, group);
		}

		await this.courseSynchronizationHistoryService.delete(syncHistories);
	}

	public async desyncCoursesAndCreateHistories(group: Group, courses: Course[]): Promise<void> {
		const externalGroupId: string | undefined = group.externalSource?.externalId;
		if (!externalGroupId) {
			throw new CourseSyncHistoryGroupExternalSourceMissingLoggableException(group.id);
		}

		const expirationInSeconds: number = this.configService.getOrThrow<number>(
			'SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS'
		);
		const expiresAt = new Date(Date.now() + expirationInSeconds * 1000);

		const histories: CourseSynchronizationHistory[] = [];
		courses.forEach((course: Course) => {
			histories.push(
				CourseSynchronizationHistoryFactory.build({
					externalGroupId,
					expiresAt,
					synchronizedCourse: course.id,
				})
			);

			course.syncedWithGroup = undefined;
			course.excludeFromSync = undefined;
		});

		await this.courseSynchronizationHistoryService.saveAll(histories);
		await this.courseService.saveAll(courses);
	}
}
