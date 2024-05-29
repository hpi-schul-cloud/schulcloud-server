import { AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { TicketParams } from '../controller/dto';
import { EduSharingService } from '../service/edu-sharing.service';

@Injectable()
export class EduSharingUC {
	constructor(
		@Inject(forwardRef(() => AuthorizationService))
		protected readonly authorizationService: AuthorizationService,
		private readonly logger: LegacyLogger,
		private readonly eduSharingService: EduSharingService
	) {}

	public async getTicketForUser(userId: EntityId): Promise<string> {
		this.logger.debug({ action: 'getTicketForUser', userId });

		const user = await this.authorizationService.getUserWithPermissions(userId);

		// TODO: permission check?

		const userName = `${user.firstName}.${user.lastName}`;

		const ticket = await this.eduSharingService.getTicketForUser(userName);

		return ticket;
	}

	public async getTicketAuthenticationInfo(params: TicketParams): Promise<any> {
		const ticketInfo = await this.eduSharingService.getTicketAuthenticationInfo(params.ticket);

		return ticketInfo;
	}

	public getEduAppXMLData(): string {
		const xmlData = this.eduSharingService.getEduAppXMLData();

		return xmlData;
	}
}
