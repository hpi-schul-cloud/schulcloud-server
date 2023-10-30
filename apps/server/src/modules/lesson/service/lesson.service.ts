import { Injectable } from '@nestjs/common';
import { IComponentProperties, LessonEntity } from '@shared/domain/entity/lesson.entity';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client/service/files-storage-client.service';

@Injectable()
export class LessonService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async deleteLesson(lesson: LessonEntity): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(lesson.id);

		await this.lessonRepo.delete(lesson);
	}

	async findById(lessonId: EntityId): Promise<LessonEntity> {
		return this.lessonRepo.findById(lessonId);
	}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<LessonEntity[]>> {
		return this.lessonRepo.findAllByCourseIds(courseIds);
	}

	async findAllLessonsByUserId(userId: EntityId): Promise<LessonEntity[]> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		return lessons;
	}

	async deleteUserDataFromLessons(userId: EntityId): Promise<number> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		const updatedLessons = lessons.map((lesson: LessonEntity) => {
			lesson.contents.map((c: IComponentProperties) => {
				if (c.user === userId) {
					c.user = '';
				}
				return c;
			});
			return lesson;
		});

		await this.lessonRepo.save(updatedLessons);

		return updatedLessons.length;
	}
}
