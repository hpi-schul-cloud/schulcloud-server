import { DomainObjectFactory } from '@testing/factory/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { Course, CourseProps } from '../domain';

export const courseFactory = DomainObjectFactory.define<Course, CourseProps>(Course, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `course #${sequence}`,
		features: new Set(),
		schoolId: new ObjectId().toHexString(),
		studentIds: [],
		teacherIds: [],
		substitutionTeacherIds: [],
		groupIds: [],
		classIds: [],
		courseGroupIds: [],
		description: 'description',
		color: '#ACACAC',
	};
});
