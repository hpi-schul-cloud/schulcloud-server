import { CourseNews, NewsProperties, SchoolNews, TeamNews } from '@shared/domain/entity';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';
import { schoolFactory } from './school.factory';
import { teamFactory } from './team.factory';
import { userFactory } from './user.factory';

export const schoolNewsFactory = BaseFactory.define<SchoolNews, NewsProperties>(SchoolNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: schoolFactory.build(),
	};
});

export const courseNewsFactory = BaseFactory.define<CourseNews, NewsProperties>(CourseNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: courseFactory.build(),
	};
});

export const teamNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: teamFactory.build(),
	};
});

export const schoolUnpublishedNewsFactory = BaseFactory.define<SchoolNews, NewsProperties>(
	SchoolNews,
	({ sequence }) => {
		return {
			title: `news ${sequence}`,
			content: `content of news ${sequence}`,
			displayAt: new Date(Date.now() + 86400000),
			school: schoolFactory.build(),
			creator: userFactory.build(),
			target: schoolFactory.build(),
		};
	}
);

export const courseUnpublishedNewsFactory = BaseFactory.define<CourseNews, NewsProperties>(
	CourseNews,
	({ sequence }) => {
		return {
			title: `news ${sequence}`,
			content: `content of news ${sequence}`,
			displayAt: new Date(Date.now() + 86400000),
			school: schoolFactory.build(),
			creator: userFactory.build(),
			target: courseFactory.build(),
		};
	}
);

export const teamUnpublishedNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(Date.now() + 86400000),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: teamFactory.build(),
	};
});
