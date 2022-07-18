import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { Logger } from '@src/core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type PadResponse = { data: { padID: string } };

@Injectable()
export class EtherpadService {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: Logger) {}

	async createEtherpad(
		userId: EntityId,
		courseId: string,
		title: string,
		description: string
	): Promise<string | false> {
		const data = {
			courseId,
			padName: title,
			text: description,
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
