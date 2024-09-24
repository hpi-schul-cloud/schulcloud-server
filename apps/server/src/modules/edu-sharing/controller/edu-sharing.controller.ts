import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	NotAcceptableException,
	NotFoundException,
	Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto';
import { EduSharingUC } from '../uc';
import { TicketParams } from './dto';

@ApiTags('edu-sharing')
@Controller('edu-sharing')
export class EduSharingController {
	constructor(private readonly eduSharingUC: EduSharingUC) {}

	@JwtAuthentication()
	@ApiOperation({
		summary: 'Fetches the edu-sharing ticket for a given user name.',
	})
	@ApiResponse({ status: 200, type: String })
	@ApiResponse({ status: 206, type: String })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/')
	async getTicketForUser(@CurrentUser() currentUser: ICurrentUser): Promise<string | undefined> {
		const ticket = await this.eduSharingUC.getTicketForUser(currentUser.userId);

		return ticket;
	}

	@JwtAuthentication()
	@ApiOperation({
		summary:
			'Gets detailed information about a ticket. Will throw an exception if the given ticket is not valid anymore.',
	})
	@ApiResponse({ status: 200, type: String })
	@ApiResponse({ status: 206, type: String })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/validate/:ticket')
	async getTicketAuthenticationInfo(@Param() params: TicketParams): Promise<LoginDto> {
		const result = await this.eduSharingUC.getTicketAuthenticationInfo(params);

		return result;
	}

	@ApiOperation({
		summary: 'Returns the required XML for registering the service against an edu-sharing repository.',
	})
	@ApiResponse({ status: 200, type: String })
	@ApiResponse({ status: 206, type: String })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiResponse({ status: 406, type: NotAcceptableException })
	@ApiResponse({ status: 500, type: InternalServerErrorException })
	@Get('/register')
	getEduAppXMLData(): string {
		const xmlData = this.eduSharingUC.getEduAppXMLData();

		return xmlData;
	}
}
