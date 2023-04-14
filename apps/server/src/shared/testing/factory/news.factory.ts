import { SchoolNews, CourseNews, TeamNews, INewsProperties } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { courseFactory } from './course.factory';
import { schoolFactory } from './school.factory';
import { teamFactory } from './team.factory';
import { userFactory } from './user.factory';

export const schoolNewsFactory = BaseEntityTestFactory.define<SchoolNews, INewsProperties>(SchoolNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: schoolFactory.build(),
	};
});

export const courseNewsFactory = BaseEntityTestFactory.define<CourseNews, INewsProperties>(CourseNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: courseFactory.build(),
	};
});

export const teamNewsFactory = BaseEntityTestFactory.define<TeamNews, INewsProperties>(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: teamFactory.build(),
	};
});
