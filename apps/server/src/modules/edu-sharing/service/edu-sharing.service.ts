import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LegacyLogger } from '@src/core/logger';
import { EduSharingConfig } from '../edu-sharing.config';

@Injectable()
export class EduSharingService {
	constructor(private readonly configService: ConfigService<EduSharingConfig, true>, private logger: LegacyLogger) {
		this.logger.setContext(EduSharingService.name);
	}

	public async getTicketForUser(username: string): Promise<string> {
		const ticket = `here is your ticket, ${username}!`;

		// Simulate some async operation
		await Promise.resolve();

		return ticket;
	}
}
