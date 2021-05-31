import { CreateNewsParams, NewsFilterQuery, NewsResponse } from '../controller/dto';
import { News, NewsTargetModelValue } from '../entity';
import { ICreateNews, INewsScope } from '../uc';
import { SchoolInfoMapper } from './school-info.mapper';
import { UserInfoMapper } from './user-info.mapper';

export class NewsMapper {
	static mapToResponse(news: News): NewsResponse {
		const dto = new NewsResponse();
		dto.id = news.id;
		dto.title = news.title;
		dto.content = news.content;
		dto.displayAt = news.displayAt;
		dto.source = news.source;
		dto.targetId = news.target?.id;
		dto.targetModel = news.targetModel;
		dto.school = SchoolInfoMapper.mapToResponse(news.school);
		dto.creator = UserInfoMapper.mapToResponse(news.creator);
		if (news.updater) {
			dto.updater = UserInfoMapper.mapToResponse(news.updater);
		}
		dto.createdAt = news.createdAt;
		dto.updatedAt = news.updatedAt;
		dto.permissions = news.permissions;
		return dto;
	}

	static mapNewsScopeToDomain(query: NewsFilterQuery): INewsScope {
		const dto: INewsScope = {};
		if (query.targetModel) {
			if (query.targetModel === 'school') {
				dto.target = { targetModel: query.targetModel };
			} else {
				dto.target = {
					targetModel: query.targetModel as NewsTargetModelValue,
					targetId: query.targetId,
				};
			}
		}
		if ('unpublished' in query) {
			dto.unpublished = query.unpublished;
		}
		return dto;
	}

	static mapCreateNewsToDomain(params: CreateNewsParams): ICreateNews {
		const dto = {
			title: params.title,
			content: params.body,
			displayAt: params.displayAt,
		};
		return dto;
	}
}
