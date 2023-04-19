import { Injectable } from '@nestjs/common';
import { PageContentDto } from '../service/dto/page-content.dto';
import { PageContentResponse } from '../controller/dto';

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
