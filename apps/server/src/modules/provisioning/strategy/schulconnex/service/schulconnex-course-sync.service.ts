import { Course, CourseDoService, CourseSyncService } from '@modules/course';
import {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryFactory,
	CourseSynchronizationHistoryService,
} from '@modules/course-synchronization-history';
import { Group } from '@modules/group';
import { Inject, Injectable } from '@nestjs/common';
import { CourseSyncHistoryGroupExternalSourceMissingLoggableException } from '../../../loggable';
import { PROVISIONING_CONFIG_TOKEN, type ProvisioningConfig } from '../../../provisioning.config';

@Injectable()
export class SchulconnexCourseSyncService {
	constructor(
		private readonly courseDoService: CourseDoService,
		private readonly courseSyncService: CourseSyncService,
		private readonly courseSynchronizationHistoryService: CourseSynchronizationHistoryService,
		@Inject(PROVISIONING_CONFIG_TOKEN)
		private readonly config: ProvisioningConfig
	) {}

	public async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		await this.courseSyncService.synchronizeCourseWithGroup(newGroup, oldGroup);
	}

	public async synchronizeCoursesFromHistory(group: Group): Promise<void> {
		const externalGroupId = group.externalSource?.externalId;
		if (!externalGroupId) {
			return;
		}

		const courseSyncHistories: CourseSynchronizationHistory[] =
			await this.courseSynchronizationHistoryService.findByExternalGroupId(externalGroupId);
		if (!courseSyncHistories.length) {
			return;
		}

		const courses: Course[] = await Promise.all(
			courseSyncHistories.map(async (history: CourseSynchronizationHistory): Promise<Course> => {
				const courseFromHistory = await this.courseDoService.findById(history.synchronizedCourse);
				courseFromHistory.excludeFromSync = history.excludeFromSync;

				return courseFromHistory;
			})
		);

		const coursesWithoutSync: Course[] = courses.filter((course: Course) => !course.syncedWithGroup);

		if (coursesWithoutSync.length) {
			await this.courseSyncService.synchronize(coursesWithoutSync, group);
		}

		await this.courseSynchronizationHistoryService.delete(courseSyncHistories);
	}

	public async desyncCoursesAndCreateHistories(group: Group, courses: Course[]): Promise<void> {
		const externalGroupId: string | undefined = group.externalSource?.externalId;
		if (!externalGroupId) {
			throw new CourseSyncHistoryGroupExternalSourceMissingLoggableException(group.id);
		}

		const expirationInSeconds: number = this.config.schulconnexCourseSyncHistoryExpirationSeconds;
		const expiresAt = new Date(Date.now() + expirationInSeconds * 1000);

		const histories: CourseSynchronizationHistory[] = [];
		courses.forEach((course: Course) => {
			histories.push(
				CourseSynchronizationHistoryFactory.build({
					externalGroupId,
					expiresAt,
					synchronizedCourse: course.id,
					excludeFromSync: course.excludeFromSync,
				})
			);
		});

		await this.courseSyncService.stopSynchronizations(courses);
		await this.courseSynchronizationHistoryService.saveAll(histories);
	}
}
