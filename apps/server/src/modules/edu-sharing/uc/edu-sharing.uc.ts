import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { TicketParams, UserNameParams } from '../controller/dto';
import { EduSharingService } from '../service/edu-sharing.service';

@Injectable()
export class EduSharingUC {
	constructor(private readonly logger: LegacyLogger, private readonly eduSharingService: EduSharingService) {}

	public async getTicketForUser(params: UserNameParams): Promise<string> {
		return this.eduSharingService.getTicketForUser(params.userName);
	}

	public async getTicketAuthenticationInfo(params: TicketParams): Promise<any> {
		return this.eduSharingService.getTicketAuthenticationInfo(params.ticket);
	}

	public getEduAppXMLData(): string {
		return this.eduSharingService.getEduAppXMLData();
	}
}
