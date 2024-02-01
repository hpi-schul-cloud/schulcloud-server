import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, ForbiddenException, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';

@ApiTags('ActivationEmil')
@Authenticate('jwt')
@Controller('activation/email')
export class EmailActivationController {
	@ApiOperation({ summary: 'Create a new activation email.' })
	@ApiResponse({ status: 201 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post()
	async createActivationEmail(@Param() urlParams, @CurrentUser() currentUser: ICurrentUser) {}
}
