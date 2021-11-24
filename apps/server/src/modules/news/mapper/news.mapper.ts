import { News, ICreateNews, INewsScope, IUpdateNews, NewsTargetModel } from '@shared/domain';
import { CreateNewsParams, NewsFilterQuery, NewsResponse, UpdateNewsParams } from '../controller/dto';
import { SchoolInfoMapper } from './school-info.mapper';
import { TargetInfoMapper } from './target-info.mapper';
import { UserInfoMapper } from './user-info.mapper';

export class NewsMapper {
	static mapToResponse(news: News): NewsResponse {
		const target = TargetInfoMapper.mapToResponse(news.target);
		const school = SchoolInfoMapper.mapToResponse(news.school);
		const creator = UserInfoMapper.mapToResponse(news.creator);

		const dto = new NewsResponse({
			id: news.id,
			title: news.title,
			content: news.content,
			displayAt: news.displayAt,
			source: news.source,
			sourceDescription: news.sourceDescription,
			targetId: news.target.id,
			targetModel: news.targetModel,
			target,
			school,
			creator,
			createdAt: news.createdAt,
			updatedAt: news.updatedAt,
			permissions: news.permissions,
		});

		if (news.updater) {
			dto.updater = UserInfoMapper.mapToResponse(news.updater);
		}

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
