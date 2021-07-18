// Important move to learnRoum area if they are established.
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '../../../shared/domain';
import { LessonTaskInfo } from '../entity';

// TODO: add schoolId as filter vs shd operations?
@Injectable()
export class LessonRepo {
	constructor(private readonly em: EntityManager) {}

	async getPublishedLessonsIdsByCourseIds(courseIds: EntityId[]): Promise<EntityId[]> {
		const publishedLessons = await this.em.find(LessonTaskInfo, {
			courseId: { $in: courseIds },
			hidden: false,
		});

		const publishedLessonsIds = publishedLessons.map(({ id }) => id);
		return publishedLessonsIds;
	}
}
