import { groupFactory } from '@shared/testing/factory';
import { courseFactory } from '../../testing';
import { CourseSynchronizationStoppedLoggable } from './course-synchronization-stopped.loggable';

describe(CourseSynchronizationStoppedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const course = courseFactory.build();
			const group = groupFactory.build();

			const loggable: CourseSynchronizationStoppedLoggable = new CourseSynchronizationStoppedLoggable(
				[course, course],
				group
			);

			return {
				loggable,
				course,
				group,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, course, group } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message: expect.any(String),
				data: {
					courseIds: `${course.id}, ${course.id}`,
					groupId: group.id,
				},
			});
		});
	});
});
