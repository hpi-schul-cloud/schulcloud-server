import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { ComponentProperties, LessonEntity } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import { AuthorizationLoaderService } from '@src/modules/authorization';
import { LessonRepo } from '../repository';

// missing interface for dependency inversion over token, or maybe we do not need this when the event is used
@Injectable()
export class LessonService implements AuthorizationLoaderService {
	constructor(
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async deleteLesson(lesson: LessonEntity): Promise<void> {
		// shedule the event
		/*
			This is wrong! Because if we add more parent to filestorage the developer must know that 
			they must modified the parent deletion. For example in user. If we add user as possible parent.

			Expected result:
			filestorage implement a event that listenc "lesson deleted" "user deleted" 
			!!! each delete of a entity bring us to lost a litte bit more connection, than bring us to situation that is harder to cleanup later !!!
			"user deleted" -> remove removeUserFromFileRecord() => for each fileRecord.cretor() 
			"lesson deleted" -> rabbitMQ(apiLayer) > UC no auhtorisation > deletFileRecordsOfParent(lessonId, { deletedAt: Date.now() }) -> delte all fileRecords delete all S3 binary files 
			// -> default deletedAt is 7 days

			!!! important this is the smae between course and lesson for example !!!

			// Question when event "user deleted" event is popup from which instance ? After 14 days this event is shedulled.
			// for filesstorage execution is zero days -> all fine S3 cleanup data and mongoDB too by it self
			// console application sheduled the user deletion event
		*/
		await this.filesStorageClientAdapterService.deleteFilesOfParent(lesson.id);

		await this.lessonRepo.delete(lesson);
	}

	async findById(lessonId: EntityId): Promise<LessonEntity> {
		return this.lessonRepo.findById(lessonId);
	}

	async findByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<LessonEntity[]>> {
		return this.lessonRepo.findAllByCourseIds(courseIds, filters);
	}

	async findAllLessonsByUserId(userId: EntityId): Promise<LessonEntity[]> {
		const lessons = await this.lessonRepo.findByUserId(userId);

		return lessons;
	}

	async deleteUserDataFromLessons(userId: EntityId): Promise<number> {
		// lesson
		//
		//
		const lessons = await this.lessonRepo.findByUserId(userId);

		const updatedLessons = lessons.map((lesson: LessonEntity) => {
			lesson.contents.map((c: ComponentProperties) => {
				if (c.user === userId) {
					c.user = undefined;
				}
				return c;
			});
			return lesson;
		});

		await this.lessonRepo.save(updatedLessons);
		/*
		// 
		} if(lesson.getUserCound()<=1)  {
			// we are in conflict with the same operation in course
			const result = await this.deleteLesson();
			// required event that external systems can be react on it 
			...can do by application or a later cleanup job that remove all what have no user anymore
			// S3 can only came to limits ..deletion request are smaller but should use a batch
			
			if we do not implement the "if" now,
			than the cleanup job for entities without user can only work when events are implemented 
			and they shedule this events.
			But if we lost the user before we can not execute the fileRecord.creator event anymore.
		} */

		return updatedLessons.length;
	}
}
