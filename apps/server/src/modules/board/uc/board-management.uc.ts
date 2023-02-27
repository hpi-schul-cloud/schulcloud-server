import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { CardSkeleton, Course, User } from '@shared/domain';
import { courseFactory, lessonFactory, taskFactory } from '@shared/testing';
import { cardSkeletonFactory } from '@shared/testing/factory/board-card-skeleton.factory';
import { columnFactory } from '@shared/testing/factory/board-column.factory';
import { columnBoardFactory } from '@shared/testing/factory/column-board.factory';
import { legacyLessonContentElementFactory } from '@shared/testing/factory/legacy-lesson-content-element.factory';
import { legacyLessonReferenceCardFactory } from '@shared/testing/factory/legacy-lesson-reference-card.factory';
import { legacyTaskContentElementFactory } from '@shared/testing/factory/legacy-task-content-element.factory';
import { legacyTaskReferenceCardFactory } from '@shared/testing/factory/legacy-task-reference-card.factory';

@Injectable()
export class BoardManagementUc {
	constructor(private em: EntityManager) {}

	async createBoards(): Promise<void> {
		// hard-coded id of Cord Carl
		const userId = '0000d231816abba584714c9e';

		const teacher = await this.em.findOneOrFail(User, { id: userId });
		await this.em.populate(teacher, ['school']);
		const course = courseFactory.build({ school: teacher.school, teachers: [teacher] });

		const columns = columnFactory.buildList(6, { cardSkeletons: this.generateCardSkeletons(teacher, course) });

		const board = columnBoardFactory.build({ columns });

		this.em.persist([course, board]);

		await this.em.flush();
	}

	private generateCardSkeletons(creator: User, course: Course): CardSkeleton[] {
		const count = this.generateRandomNumber(10, 60);

		const skeletons = Array(count)
			.fill(0)
			.map(() =>
				Math.random() < 0.5
					? this.generateTaskCardSkeleton(creator, course)
					: this.generateLessonCardSkeleton(creator, course)
			);

		return skeletons;
	}

	private generateTaskCardSkeleton(creator: User, course: Course): CardSkeleton {
		const card = legacyTaskReferenceCardFactory.buildWithId({
			elements: [
				legacyTaskContentElementFactory.build({
					task: taskFactory.build({ school: creator.school, creator, course }),
				}),
			],
			creator,
		});
		this.em.persist(card);
		const taskCardSkeleton = cardSkeletonFactory.build({
			cardId: card.id,
		});

		return taskCardSkeleton;
	}

	private generateLessonCardSkeleton(creator: User, course: Course): CardSkeleton {
		const card = legacyLessonReferenceCardFactory.buildWithId({
			elements: [legacyLessonContentElementFactory.build({ lesson: lessonFactory.build({ course }) })],
			creator,
		});
		this.em.persist(card);
		const lessonCardSkeleton = cardSkeletonFactory.build({
			height: this.generateRandomNumber(30, 300),
			cardId: card.id,
		});

		return lessonCardSkeleton;
	}

	private generateRandomNumber(min: number, max: number): number {
		return Math.floor(Math.random() * (max + min - 1) + min);
	}
}
