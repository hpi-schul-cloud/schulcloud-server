import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity } from '@shared/domain';
import {
	CourseNews,
	INewsProperties,
	SchoolInfo,
	CourseInfo,
	SchoolNews,
	UserInfo,
	News,
	TeamNews,
	TeamInfo,
	NewsTargetModel,
	INewsScope,
	ICreateNews,
	IUpdateNews,
} from '../entity';
import { NewsMapper } from './news.mapper';
import {
	CreateNewsParams,
	NewsFilterQuery,
	NewsResponse,
	SchoolInfoResponse,
	UpdateNewsParams,
	UserInfoResponse,
} from '../controller/dto';

const createDataInfo = <T extends BaseEntity>(props, Type: { new (props): T }): T => {
	const id = new ObjectId().toHexString();
	const dataInfo = new Type(props);
	dataInfo.id = id;
	return dataInfo;
};

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
	schoolInfo: SchoolInfo,
	creatorInfo: UserInfo,
	target: BaseEntity
): T => {
	const newsId = new ObjectId().toHexString();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const props: INewsProperties = {
		id: newsId,
		displayAt: date,
		updatedAt: date,
		createdAt: date,
		school: schoolInfo.id,
		creator: creatorInfo.id,
		updater: creatorInfo.id,
		target: target.id,
		...newsProps,
	};
	const resultNews = new NewsType(props);
	resultNews.school = schoolInfo;
	resultNews.creator = creatorInfo;
	resultNews.updater = creatorInfo;
	resultNews.target = target;
	resultNews.targetModel = getTargetModel(resultNews);
	return resultNews;
};

const getExpectedNewsResponse = (
	schoolInfo: SchoolInfo,
	creatorInfo: UserInfo,
	news: News,
	newsProps: { title: string; content: string },
	target: BaseEntity
): NewsResponse => {
	const schoolInfoResponse: SchoolInfoResponse = new SchoolInfoResponse();
	Object.assign(schoolInfoResponse, schoolInfo);

	const creatorResponse: UserInfoResponse = new UserInfoResponse();
	Object.assign(creatorResponse, creatorInfo);
	const expected: NewsResponse = new NewsResponse();
	Object.assign(expected, {
		id: news.id,
		source: undefined,
		sourceDescription: undefined,
		targetId: target.id,
		targetModel: getTargetModel(news),
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
	describe('mapToResponse', () => {
		it('should correctly map school news to Dto', () => {
			const schoolInfo: SchoolInfo = createDataInfo({ name: 'test school' }, SchoolInfo);
			const creatorInfo: UserInfo = createDataInfo({ firstName: 'fname', lastName: 'lname' }, UserInfo);
			const newsProps = { title: 'test title', content: 'test content' };
			const schoolNews = createNews(newsProps, SchoolNews, schoolInfo, creatorInfo, schoolInfo);

			const result = NewsMapper.mapToResponse(schoolNews);
			const expected = getExpectedNewsResponse(schoolInfo, creatorInfo, schoolNews, newsProps, schoolInfo);
			expect(result).toStrictEqual(expected);
		});
		it('should correctly map course news to dto', () => {
			const schoolInfo = createDataInfo({ name: 'test school' }, SchoolInfo);
			const courseInfo = createDataInfo({ name: 'test course' }, CourseInfo);
			const creatorInfo = createDataInfo({ firstName: 'fname', lastName: 'lname' }, UserInfo);
			const newsProps = { title: 'test title', content: 'test content' };
			const courseNews = createNews(newsProps, CourseNews, schoolInfo, creatorInfo, courseInfo);

			const result = NewsMapper.mapToResponse(courseNews);
			const expected = getExpectedNewsResponse(schoolInfo, creatorInfo, courseNews, newsProps, courseInfo);

			expect(result).toStrictEqual(expected);
		});
		it('should correctly map team news to dto', () => {
			const schoolInfo = createDataInfo({ name: 'test school' }, SchoolInfo);
			const teamInfo = createDataInfo({ name: 'test course' }, TeamInfo);
			const creatorInfo = createDataInfo({ firstName: 'fname', lastName: 'lname' }, UserInfo);
			const newsProps = { title: 'test title', content: 'test content' };
			const teamNews = createNews(newsProps, TeamNews, schoolInfo, creatorInfo, teamInfo);

			const result = NewsMapper.mapToResponse(teamNews);
			const expected = getExpectedNewsResponse(schoolInfo, creatorInfo, teamNews, newsProps, teamInfo);

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
