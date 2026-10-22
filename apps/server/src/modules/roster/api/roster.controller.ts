import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { type UserGroupsResponse, RosterUc } from './roster.uc';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Roster')
@JwtAuthentication()
@Controller('roster')
export class RosterController {
	constructor(private readonly rosterUc: RosterUc) {}

	@Get('user-groups')
	public async getUserGroups(
		@CurrentUser() currentUser: ICurrentUser,
		@Query('pseudonym') pseudonym?: string,
		@Query('oauth2ClientId') oauth2ClientId?: string
	): Promise<UserGroupsResponse> {
		if (!pseudonym || !oauth2ClientId) {
			throw new BadRequestException('Both pseudonym and oauth2ClientId query parameters are required.');
		}

		const userGroups = await this.rosterUc.getUserGroups(currentUser.userId, pseudonym, oauth2ClientId);

		return userGroups;
	}
}
