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
	const school = schoolEntityFactory.buildWithId();
	const user = userFactory.buildWithId({ school });

	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school,
		creator: user,
		target: school.id,
	};
});

export const courseNewsFactory = BaseFactory.define<CourseNews, NewsProperties>(CourseNews, ({ sequence }) => {
	const school = schoolEntityFactory.buildWithId();
	const user = userFactory.buildWithId({ school });
	const course = courseEntityFactory.buildWithId({ school });

	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school,
		creator: user,
		target: course.id,
	};
});

export const teamNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	const school = schoolEntityFactory.buildWithId();
	const user = userFactory.buildWithId({ school });
	const team = teamFactory.buildWithId();

	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school,
		creator: user,
		target: team.id,
	};
});

export const schoolUnpublishedNewsFactory = BaseFactory.define<SchoolNews, NewsProperties>(
	SchoolNews,
	({ sequence }) => {
		const school = schoolEntityFactory.buildWithId();
		const user = userFactory.buildWithId({ school });

		return {
			title: `news ${sequence}`,
			content: `content of news ${sequence}`,
			displayAt: new Date(Date.now() + 86400000),
			school,
			creator: user,
			target: school.id,
		};
	}
);

export const courseUnpublishedNewsFactory = BaseFactory.define<CourseNews, NewsProperties>(
	CourseNews,
	({ sequence }) => {
		const school = schoolEntityFactory.buildWithId();
		const user = userFactory.buildWithId({ school });
		const course = courseEntityFactory.buildWithId({ school });

		return {
			title: `news ${sequence}`,
			content: `content of news ${sequence}`,
			displayAt: new Date(Date.now() + 86400000),
			school,
			creator: user,
			target: course.id,
		};
	}
);

export const teamUnpublishedNewsFactory = BaseFactory.define<TeamNews, NewsProperties>(TeamNews, ({ sequence }) => {
	const school = schoolEntityFactory.buildWithId();
	const user = userFactory.buildWithId({ school });
	const team = teamFactory.buildWithId();

	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(Date.now() + 86400000),
		school,
		creator: user,
		target: team.id,
	};
});
