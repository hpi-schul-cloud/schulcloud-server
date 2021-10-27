import { DeepPartial } from 'fishery';
import moment from 'moment';
import { BaseFactory } from './base.factory';
import { SchoolNews, CourseNews, TeamNews, INewsProperties } from '../entity/news.entity';
import { courseFactory } from './course.factory';
import { schoolFactory } from './school.factory';
import { teamFactory } from './team.factory';
import { userFactory } from './user.factory';

const displayAtParams = (unpublished: boolean): DeepPartial<INewsProperties> => {
	const displayAt = unpublished ? moment().add(1, 'days').toDate() : moment().subtract(1, 'days').toDate();
	return { displayAt };
};

class SchoolNewsFactory extends BaseFactory<SchoolNews, INewsProperties> {
	unpublished(unpublished = true) {
		return this.params(displayAtParams(unpublished));
	}
}

export const schoolNewsFactory = SchoolNewsFactory.define(SchoolNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: schoolFactory.build(),
	};
});

class CourseNewsFactory extends BaseFactory<CourseNews, INewsProperties> {
	unpublished(unpublished = true) {
		return this.params(displayAtParams(unpublished));
	}
}

export const courseNewsFactory = CourseNewsFactory.define(CourseNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: courseFactory.build(),
	};
});

class TeamNewsFactory extends BaseFactory<TeamNews, INewsProperties> {
	unpublished(unpublished = true) {
		return this.params(displayAtParams(unpublished));
	}
}

export const teamNewsFactory = TeamNewsFactory.define(TeamNews, ({ sequence }) => {
	return {
		title: `news ${sequence}`,
		content: `content of news ${sequence}`,
		displayAt: new Date(),
		school: schoolFactory.build(),
		creator: userFactory.build(),
		target: teamFactory.build(),
	};
});
