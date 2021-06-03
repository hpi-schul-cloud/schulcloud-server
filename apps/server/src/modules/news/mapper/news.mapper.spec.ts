import { ObjectId } from '@mikro-orm/mongodb';
import { INewsProperties, NewsTargetModel, SchoolInfo, SchoolNews, UserInfo } from '../entity';
import { NewsMapper } from './news.mapper';
import { NewsResponse, SchoolInfoResponse, UserInfoResponse } from '../controller/dto';

describe('NewsMapper', () => {
	describe('mapToResponse', () => {
		it('should correctly map school news to Dto', () => {
			const newsId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const schoolProps = { name: 'test school', id: schoolId };
			const schoolInfo: SchoolInfo = new SchoolInfo(schoolProps);
			schoolInfo.id = schoolId;
			const creatorId = new ObjectId().toHexString();
			const creatorProps = {
				firstName: 'fname',
				lastName: 'lname',
				id: creatorId,
			};
			const creatorInfo: UserInfo = new UserInfo(creatorProps);
			creatorInfo.id = creatorId;
			const displayAt = new Date();
			const props: INewsProperties = {
				title: 'test news',
				content: 'content',
				displayAt,
				school: schoolInfo.id,
				creator: creatorInfo.id,
				target: schoolInfo.id,
			};
			const schoolNews = new SchoolNews(props);
			schoolNews.school = schoolInfo;
			schoolNews.creator = creatorInfo;
			schoolNews.targetModel = NewsTargetModel.School;
			schoolNews.target = schoolInfo;

			const result = NewsMapper.mapToResponse(schoolNews);
			result.id = newsId;
			const schoolInfoResponse: SchoolInfoResponse = new SchoolInfoResponse();
			Object.assign(schoolInfoResponse, schoolProps);

			const creatorResponse: UserInfoResponse = new UserInfoResponse();
			Object.assign(creatorResponse, creatorProps);
			const expected: NewsResponse = new NewsResponse();
			Object.assign(expected, {
				id: newsId,
				source: undefined,
				targetId: schoolInfo.id,
				targetModel: NewsTargetModel.School,
				title: props.title,
				content: props.content,
				displayAt,
				school: schoolInfoResponse,
				creator: creatorResponse,
				createdAt: displayAt,
				updatedAt: displayAt,
				permissions: [],
			});

			expect(result).toStrictEqual(expected);
		});
	});
});
