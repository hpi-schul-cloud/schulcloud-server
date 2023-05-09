import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { LegacyLogger } from '@src/core/logger';

export type PadResponse = { data: { padID: string } };

@Injectable()
export class EtherpadService {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: LegacyLogger) {}

	async createEtherpad(userId: EntityId, courseId: string, title: string): Promise<string | false> {
		const data = {
			courseId,
			padName: title,
		};
		try {
			const service = this.feathersServiceProvider.getService('/etherpad/pads');
			const pad = (await service.create(data, { account: { userId } })) as PadResponse;
			return pad.data.padID;
		} catch (error) {
			this.logger.error('Could not create new Etherpad', error);
			return false;
		}
	}
}
