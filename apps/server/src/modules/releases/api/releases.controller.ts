import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ErrorResponse } from '@infra/error';
import {
	Controller,
	ForbiddenException,
	Get,
	Header,
	NotFoundException,
	Param,
	Query,
	StreamableFile,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { PaginationParams } from '@shared/controller/dto';
import { ReleaseImageParams, ReleaseItemResponse, ReleaseListResponse } from './dto';
import { ReleasesUc } from './releases.uc';

@ApiTags('Release')
@JwtAuthentication()
@Controller('releases')
export class ReleasesController {
	constructor(private readonly releasesUc: ReleasesUc) {}

	@ApiOperation({ summary: 'Get the list of available releases' })
	@ApiResponse({ status: 200, type: ReleaseListResponse, description: 'Returns a list of releases.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Bad Request' })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get()
	public async getReleases(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: PaginationParams
	): Promise<ReleaseListResponse> {
		const [releases, total] = await this.releasesUc.getReleases(currentUser.userId, pagination);
		const items = releases.map((release) => new ReleaseItemResponse(release));
		const response = new ReleaseListResponse(items, total, pagination.skip, pagination.limit);

		return response;
	}

	@ApiOperation({ summary: 'Fetch the latest releases from the configured remote repository' })
	@ApiResponse({ status: 200, description: 'Returns the status of fetched releases.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Bad Request' })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@Get('fetch')
	public async fetchReleases(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.releasesUc.fetchReleases(currentUser.userId);
	}

	@ApiOperation({ summary: 'Get a single image embedded in a release' })
	@ApiResponse({ status: 200, description: 'Returns the binary image.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Bad Request' })
	@ApiResponse({ status: 401, type: UnauthorizedException })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	// stored images are never updated, only created or deleted, so the content behind an id never changes
	@Header('Cache-Control', 'private, max-age=31536000, immutable')
	@Get('images/:imageId')
	public async getImage(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ReleaseImageParams
	): Promise<StreamableFile> {
		const image = await this.releasesUc.getImage(currentUser.userId, params.imageId);
		const file = new StreamableFile(image.data, { type: image.mimeType, length: image.size });

		return file;
	}
}
