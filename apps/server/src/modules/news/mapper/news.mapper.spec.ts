import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity } from '@shared/domain';
import {
	CourseNews,
	INewsProperties,
	NewsTargetModel,
	SchoolInfo,
	CourseInfo,
	SchoolNews,
	UserInfo,
	News,
	TeamNews,
	TeamInfo,
	NewsTargetModelValue,
} from '../entity';
import { NewsMapper } from './news.mapper';
import { NewsResponse, SchoolInfoResponse, UserInfoResponse } from '../controller/dto';

const createDataInfo = <T extends BaseEntity>(props, Type: { new (props): T }): T => {
	const id = new ObjectId().toHexString();
	const dataInfo = new Type(props);
	dataInfo.id = id;
	return dataInfo;
};

const getTargetModel = (news: News): NewsTargetModelValue => {
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

const createNews = <T extends News>(
	newsProps,
	NewsType: { new (props: INewsProperties): T },
	schoolInfo: SchoolInfo,
	creatorInfo: UserInfo,
	target: BaseEntity
): T => {
	const newsId = new ObjectId().toHexString();
	const now = new Date();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const props: INewsProperties = {
		id: newsId,
		displayAt: now,
		updatedAt: now,
		createdAt: now,
		school: schoolInfo.id,
		creator: creatorInfo.id,
		target: target.id,
		...newsProps,
	};
	const resultNews = new NewsType(props);
	resultNews.school = schoolInfo;
	resultNews.creator = creatorInfo;
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
		targetId: target.id,
		targetModel: getTargetModel(news),
		title: newsProps.title,
		content: newsProps.content,
		displayAt: news.updatedAt,
		school: schoolInfoResponse,
		creator: creatorResponse,
		createdAt: news.createdAt,
		updatedAt: news.displayAt,
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
});
