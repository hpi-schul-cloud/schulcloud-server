import { Group } from '@modules/group';
import { CourseSyncService } from '@modules/learnroom';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchulconnexCourseSyncService {
	constructor(private readonly courseSyncService: CourseSyncService) {}

	async synchronizeCourseWithGroup(group: Group): Promise<void> {
		await this.courseSyncService.synchronizeCourseWithGroup(group);
	}
}
