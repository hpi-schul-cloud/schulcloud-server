import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Lesson } from '@shared/domain';
import { ExtendedLessonMapper } from '../mapper/extended-lesson-mapper';
import { ExtendedLesson } from '../types/extended-lesson';

const lessonsQuery = [
	{
		$unwind: '$contents',
	},
	{
		$match: {
			'contents.component': {
				$eq: 'text',
			},
		},
	},
	{
		$match: {
			'contents.content.text': {
				$regex: /src="(https?:\/\/[^"]*)?\/files\/file\?/,
				$options: 'i',
			},
		},
	},
	{
		$set: {
			course: { $arrayElemAt: ['$courses', 0] },
		},
	},
	{
		$set: {
			schoolId: '$course.schoolId',
		},
	},
];

@Injectable()
export class EmbeddedFilesRepo {
	constructor(protected readonly _em: EntityManager) {}

	async findEmbeddedFilesForLessons(): Promise<ExtendedLesson[]> {
		const results = await this._em.aggregate(Lesson, lessonsQuery);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const extendedLessons = results.map((result) => ExtendedLessonMapper.mapToExtendedLesson(result));

		return extendedLessons;
	}
}
