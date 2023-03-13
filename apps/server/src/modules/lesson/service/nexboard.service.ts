import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { LegacyLogger } from '@src/core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type NexboardResponse = { id: string; publicLink: string };

@Injectable()
export class NexboardService {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: LegacyLogger) {}

	async createNexboard(
		userId: EntityId,
		title: string,
		description: string
	): Promise<{ board: string; url: string } | false> {
		const data = {
			title,
			description,
		};
		try {
			const service = this.feathersServiceProvider.getService('/nexboard/boards');
			const nexBoard = (await service.create(data, { account: { userId } })) as NexboardResponse;
			return { board: nexBoard.id, url: nexBoard.publicLink };
		} catch (error) {
			this.logger.error('Could not create new Nexboard', error);
			return false;
		}
	}
}
