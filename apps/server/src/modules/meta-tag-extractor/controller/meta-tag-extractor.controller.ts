import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	InternalServerErrorException,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { MetaTagExtractorUc } from '../uc';
import { MetaTagExtractorResponse } from './dto';
import { GetMetaTagDataBody } from './post-link-url.body.params';

@ApiTags('Meta Tag Extractor')
@Authenticate('jwt')
@Controller('meta-tag-extractor')
export class MetaTagExtractorController {
	constructor(private readonly metaTagExtractorUc: MetaTagExtractorUc) {}

	@ApiOperation({ summary: 'Return dummy HTML for testing' })
	@ApiResponse({ status: 201, type: MetaTagExtractorResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 400, type: BadRequestException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('/:url')
	async getData(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: GetMetaTagDataBody
	): Promise<MetaTagExtractorResponse> {
		const result = await this.metaTagExtractorUc.fetchMetaData(currentUser.userId, bodyParams.url);
		const imageUrl = result.image?.url;
		const response = new MetaTagExtractorResponse({ ...result, imageUrl });
		return response;
	}
}
