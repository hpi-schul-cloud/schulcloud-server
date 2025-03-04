import { CourseSyncService } from '@modules/course';
import { Group } from '@modules/group';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SchulconnexCourseSyncService {
	constructor(private readonly courseSyncService: CourseSyncService) {}

	async synchronizeCourseWithGroup(newGroup: Group, oldGroup?: Group): Promise<void> {
		await this.courseSyncService.synchronizeCourseWithGroup(newGroup, oldGroup);
	}
}
