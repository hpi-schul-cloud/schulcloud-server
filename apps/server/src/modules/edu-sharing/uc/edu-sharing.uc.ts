import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { EduSharingService } from '../service/edu-sharing.service';

@Injectable()
export class EduSharingUC {
	constructor(private readonly logger: LegacyLogger, private readonly eduSharingService: EduSharingService) {
		this.logger.setContext(EduSharingUC.name);
	}

	public async getTicketForUser(username: string): Promise<string> {
		return this.eduSharingService.getTicketForUser(username);
	}
}
