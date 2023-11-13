import { Body, Controller, InternalServerErrorException, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserInterface } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { MetaTagExtractorUc } from '../uc';
import { MetaTagExtractorResponse } from './dto';
import { GetMetaTagDataBody } from './post-link-url.body.params';

@ApiTags('Meta Tag Extractor')
@Authenticate('jwt')
@Controller('meta-tag-extractor')
export class MetaTagExtractorController {
	constructor(private readonly metaTagExtractorUc: MetaTagExtractorUc) {}

	@ApiOperation({ summary: 'return extract meta tags' })
	@ApiResponse({ status: 201, type: MetaTagExtractorResponse })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('')
	async getData(
		@CurrentUser() currentUser: CurrentUserInterface,
		@Body() bodyParams: GetMetaTagDataBody
	): Promise<MetaTagExtractorResponse> {
		const result = await this.metaTagExtractorUc.fetchMetaData(currentUser.userId, bodyParams.url);
		const imageUrl = result.image?.url;
		const response = new MetaTagExtractorResponse({ ...result, imageUrl });
		return response;
	}
}
