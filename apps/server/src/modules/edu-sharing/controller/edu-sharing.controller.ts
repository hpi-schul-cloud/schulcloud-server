import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import {
	Controller,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { EduSharingUC } from '../uc';

@ApiTags('edu-sharing')
@Authenticate('jwt')
@Controller('edu-sharing')
export class EduSharingController {
	constructor(private readonly eduSharingUC: EduSharingUC) {}

	@ApiOperation({ summary: 'Returns the required XML for registering the service against an edu-sharing repository.' })
	@ApiResponse({ status: 200, type: String })
	@ApiResponse({ status: 206, type: String })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/register')
	getEduAppXMLData(): string {
		const xmlData = this.eduSharingUC.getEduAppXMLData();

		return xmlData;
	}

	@ApiOperation({ summary: 'Fetches the edu-sharing ticket for a given username.' })
	@ApiResponse({ status: 200, type: String })
	@ApiResponse({ status: 206, type: String })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/')
	async getTicketForUser(@CurrentUser() currentUser: ICurrentUser): Promise<string> {
		const ticket = await this.eduSharingUC.getTicketForUser(currentUser.userId);

		return ticket;
	}
}
