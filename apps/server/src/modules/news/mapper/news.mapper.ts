import { CreateNewsParams, NewsResponse } from '../controller/dto';
import { News } from '../entity';
import { ICreateNews } from '../uc';
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
		dto.target = news.target;
		dto.targetModel = news.targetModel;
		dto.school = SchoolInfoMapper.mapToResponse(news.school);
		dto.creator = UserInfoMapper.mapToResponse(news.creator);
		dto.updater = UserInfoMapper.mapToResponse(news.updater);
		dto.createdAt = news.createdAt;
		dto.updatedAt = news.updatedAt;
		dto.permissions = news.permissions;
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
