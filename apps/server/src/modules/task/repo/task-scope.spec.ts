import { FilterQuery } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { EmptyResultQuery } from '@shared/repo/query';
import { TaskScope } from './task-scope';
import { Task } from './task.entity';

describe(TaskScope.name, () => {
	describe('when build scope query', () => {
		const setup = () => {
			const scope = new TaskScope();
			const creatorId = new ObjectId().toHexString();

			const expected = {
				$and: [
					{
						creator: creatorId,
					},
					{
						$or: [
							{
								course: { $ne: null },
							},
							{
								lesson: { $ne: null },
							},
						],
					},
				],
			} as FilterQuery<Task>;

			return { scope, creatorId, expected };
		};
		it('should create valid query returning no results for empty scope', () => {
			const { scope } = setup();
			const result = scope.query;

			expect(result).toBe(EmptyResultQuery);
		});
		it('should create correct query for byCreatorIdWithCourseAndLesson', () => {
			const { scope, creatorId, expected } = setup();
			scope.byCreatorIdWithCourseAndLesson(creatorId);
			const result = scope.query;

			expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
		});
	});
});
