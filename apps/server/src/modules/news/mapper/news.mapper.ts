import { CreateNewsParams, NewsFilterQuery, NewsResponse, UpdateNewsParams } from '../controller/dto';
import { ICreateNews, INewsScope, IUpdateNews, News, NewsTargetModel } from '../entity';
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
		dto.sourceDescription = news.sourceDescription;
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
			dto.target = {
				targetModel: query.targetModel as NewsTargetModel,
				targetId: query.targetId,
			};
		}
		if ('unpublished' in query) {
			dto.unpublished = query.unpublished;
		}
		return dto;
	}

	static mapCreateNewsToDomain(params: CreateNewsParams): ICreateNews {
		const dto = {
			title: params.title,
			content: params.content,
			displayAt: params.displayAt,
			target: {
				targetModel: params.targetModel as NewsTargetModel,
				targetId: params.targetId,
			},
		};
		return dto;
	}

	static mapUpdateNewsToDomain(params: UpdateNewsParams): IUpdateNews {
		const dto = {
			title: params.title,
			content: params.content,
			displayAt: params.displayAt,
		};
		return dto;
	}
}
