// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { courseEntityFactory } from '@modules/course/testing';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { schoolEntityFactory } from '@modules/school/testing';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { teamFactory } from '@modules/team/testing';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { CourseNews, NewsProperties, SchoolNews, TeamNews } from '../repo';

export const schoolNewsFactory = BaseFactory.define<SchoolNews, NewsProperties>(SchoolNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolEntityFactory.build(),
		creator: userFactory.build(),
		target: schoolEntityFactory.build(),
	};
});

export const courseNewsFactory = BaseFactory.define<CourseNews, NewsProperties>(CourseNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolEntityFactory.build(),
		creator: userFactory.build(),
		target: courseEntityFactory.build(),
	};
});

export const teamNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolEntityFactory.build(),
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
			school: schoolEntityFactory.build(),
			creator: userFactory.build(),
			target: schoolEntityFactory.build(),
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
			school: schoolEntityFactory.build(),
			creator: userFactory.build(),
			target: courseEntityFactory.build(),
		};
	}
);

export const teamUnpublishedNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(Date.now() + 86400000),
		school: schoolEntityFactory.build(),
		creator: userFactory.build(),
		target: teamFactory.build(),
	};
});
