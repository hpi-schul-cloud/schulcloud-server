import { Injectable } from '@nestjs/common';
import { PageContentResponse } from '../controller/dto/response/page-content.response';
import { PageContentDto } from '../service/dto/page-content.dto';

@Injectable()
export class PageContentMapper {
	mapDtoToResponse(dto: PageContentDto): PageContentResponse {
		const response: PageContentResponse = new PageContentResponse({
			proceedButtonUrl: dto.proceedButtonUrl,
			cancelButtonUrl: dto.cancelButtonUrl,
		});

		return response;
	}
}
