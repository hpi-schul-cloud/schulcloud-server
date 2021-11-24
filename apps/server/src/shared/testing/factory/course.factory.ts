import { Course, ICourseProperties } from '@shared/domain';
import { schoolFactory } from './school.factory';
import { BaseFactory } from './base.factory';

export const courseFactory = BaseFactory.define<Course, ICourseProperties>(Course, ({ sequence }) => {
	return {
		name: `course #${sequence}`,
		description: `course #${sequence} description`,
		color: '#FFFFFF',
		school: schoolFactory.build(),
	};
});
