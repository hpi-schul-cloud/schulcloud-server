import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, InternalServerErrorException, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetaTagExtractorUc } from '../uc';
import { MetaTagExtractorResponse } from './dto';
import { GetMetaTagDataBody } from './post-link-url.body.params';

@ApiTags('Meta Tag Extractor')
@JwtAuthentication()
@Controller('meta-tag-extractor')
export class MetaTagExtractorController {
	constructor(private readonly metaTagExtractorUc: MetaTagExtractorUc) {}

	@ApiOperation({ summary: 'return extract meta tags' })
	@ApiResponse({ status: 201, type: MetaTagExtractorResponse })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Post('')
	async getMetaTags(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: GetMetaTagDataBody
	): Promise<MetaTagExtractorResponse> {
		const result = await this.metaTagExtractorUc.getMetaData(currentUser.userId, bodyParams.url);
		const imageUrl = result.image?.url;
		const response = new MetaTagExtractorResponse({ ...result, imageUrl });
		return response;
	}
}
