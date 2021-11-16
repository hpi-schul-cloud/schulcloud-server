import { ObjectId } from '@mikro-orm/mongodb';
import {
	CourseNews,
	INewsProperties,
	News,
	School,
	SchoolNews,
	Team,
	TeamNews,
	User,
	NewsTargetModel,
	INewsScope,
	ICreateNews,
	IUpdateNews,
	NewsTarget,
} from '@shared/domain';
import { courseFactory, schoolFactory, userFactory, setupEntities } from '@shared/testing';
import { NewsMapper } from './news.mapper';
import {
	CreateNewsParams,
	NewsFilterQuery,
	NewsResponse,
	SchoolInfoResponse,
	UpdateNewsParams,
	UserInfoResponse,
} from '../controller/dto';
import { TargetInfoResponse } from '../controller/dto/target-info.response';

const getTargetModel = (news: News): NewsTargetModel => {
	if (news instanceof SchoolNews) {
		return NewsTargetModel.School;
	}
	if (news instanceof CourseNews) {
		return NewsTargetModel.Course;
	}
	if (news instanceof TeamNews) {
		return NewsTargetModel.Team;
	}
	throw Error('Unknown news type');
};
const date = new Date(2021, 1, 1, 0, 0, 0);

const createNews = <T extends News>(
	newsProps,
	NewsType: { new (props: INewsProperties): T },
	school: School,
	creator: User,
	target: NewsTarget
): T => {
	const newsId = new ObjectId().toHexString();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const props: INewsProperties = {
		id: newsId,
		displayAt: date,
		updatedAt: date,
		createdAt: date,
		school: school.id,
		creator: creator.id,
		updater: creator.id,
		target: target.id,
		...newsProps,
	};
	const resultNews = new NewsType(props);
	resultNews.school = school;
	resultNews.creator = creator;
	resultNews.updater = creator;
	resultNews.target = target;
	resultNews.targetModel = getTargetModel(resultNews);
	return resultNews;
};

const getExpectedNewsResponse = (
	school: School,
	creator: User,
	news: News,
	newsProps: { title: string; content: string },
	target: NewsTarget
): NewsResponse => {
	const schoolInfoResponse = Object.create(SchoolInfoResponse.prototype) as SchoolInfoResponse;
	const schoolProps = (({ id, name }) => ({ id, name }))(school);
	Object.assign(schoolInfoResponse, schoolProps);
	const creatorResponse = Object.create(UserInfoResponse.prototype) as UserInfoResponse;
	const creatorProps = {
		id: creator.id,
		firstName: creator.firstName,
		lastName: creator.lastName,
	};
	Object.assign(creatorResponse, creatorProps);
	const targetResponse = Object.create(TargetInfoResponse.prototype) as TargetInfoResponse;
	const targetProps = {
		id: target.id,
		name: target.name,
	};
	Object.assign(targetResponse, targetProps);
	const expected = new NewsResponse({
		id: news.id,
		source: undefined,
		sourceDescription: undefined,
		targetId: target.id,
		targetModel: getTargetModel(news),
		target: targetResponse,
		title: newsProps.title,
		content: newsProps.content,
		displayAt: date,
		school: schoolInfoResponse,
		creator: creatorResponse,
		updater: creatorResponse,
		createdAt: news.createdAt,
		updatedAt: news.updatedAt,
		permissions: [],
	});
	return expected;
};

describe('NewsMapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToResponse', () => {
		it('should correctly map school news to Dto', () => {
			const school = schoolFactory.build();
			const creator = userFactory.build();
			const newsProps = { title: 'test title', content: 'test content' };
			const schoolNews = createNews(newsProps, SchoolNews, school, creator, school);

			const result = NewsMapper.mapToResponse(schoolNews);
			const expected = getExpectedNewsResponse(school, creator, schoolNews, newsProps, school);
			expect(result).toStrictEqual(expected);
		});
		it('should correctly map course news to dto', () => {
			const school = schoolFactory.build();
			const creator = userFactory.build();
			const course = courseFactory.build({ school });
			const newsProps = { title: 'test title', content: 'test content' };
			const courseNews = createNews(newsProps, CourseNews, school, creator, course);

			const result = NewsMapper.mapToResponse(courseNews);
			const expected = getExpectedNewsResponse(school, creator, courseNews, newsProps, course);

			expect(result).toStrictEqual(expected);
		});
		it('should correctly map team news to dto', () => {
			const school = schoolFactory.build();
			const team = new Team({ name: 'team #1' });
			const creator = userFactory.build();
			const newsProps = { title: 'test title', content: 'test content' };
			const teamNews = createNews(newsProps, TeamNews, school, creator, team);

			const result = NewsMapper.mapToResponse(teamNews);
			const expected = getExpectedNewsResponse(school, creator, teamNews, newsProps, team);

			expect(result).toStrictEqual(expected);
		});
	});
	describe('mapNewsScopeToDomain', () => {
		it('should correctly map news query with target without unpublished to dto', () => {
			const targetId = new ObjectId().toHexString();
			const newsFilterQuery = new NewsFilterQuery();
			Object.assign(newsFilterQuery, {
				targetModel: NewsTargetModel.School,
				targetId,
			});
			const result = NewsMapper.mapNewsScopeToDomain(newsFilterQuery);
			const expected: INewsScope = {};
			Object.assign(expected, {
				target: {
					targetModel: newsFilterQuery.targetModel,
					targetId: newsFilterQuery.targetId,
				},
			});
			expect(result).toStrictEqual(expected);
		});
		it('should correctly map news query with unpublished and target to dto', () => {
			const targetId = new ObjectId().toHexString();
			const newsFilterQuery = new NewsFilterQuery();
			Object.assign(newsFilterQuery, {
				targetModel: NewsTargetModel.School,
				targetId,
				unpublished: true,
			});
			const result = NewsMapper.mapNewsScopeToDomain(newsFilterQuery);
			const expected: INewsScope = {};
			Object.assign(expected, {
				target: {
					targetModel: newsFilterQuery.targetModel,
					targetId: newsFilterQuery.targetId,
				},
				unpublished: newsFilterQuery.unpublished,
			});
			expect(result).toStrictEqual(expected);
		});
	});
	describe('mapCreateNewsToDomain', () => {
		it('should correctly map params to dto', () => {
			const targetId = new ObjectId().toHexString();
			const targetModel = NewsTargetModel.School;
			const params: CreateNewsParams = {
				title: 'test title',
				content: 'test content',
				displayAt: date,
				targetModel,
				targetId,
			};
			const result: ICreateNews = NewsMapper.mapCreateNewsToDomain(params);
			const expected: ICreateNews = {
				title: params.title,
				content: params.content,
				displayAt: date,
				target: {
					targetModel,
					targetId,
				},
			};
			expect(result).toStrictEqual(expected);
		});
	});
	describe('mapUpdateNewsToDomain', () => {
		it('should correctly map params to dto', () => {
			const params: UpdateNewsParams = {
				title: 'test title',
				content: 'test content',
				displayAt: date,
			};
			const result: IUpdateNews = NewsMapper.mapUpdateNewsToDomain(params);
			const expected: IUpdateNews = {
				title: params.title,
				content: params.content,
				displayAt: date,
			};
			expect(result).toStrictEqual(expected);
		});
	});
});
