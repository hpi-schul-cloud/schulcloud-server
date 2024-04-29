import { FeathersServiceProvider } from '@infra/feathers/feathers-service.provider';
import { LegacyLogger } from '@src/core/logger';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type TldrawResponse = { id: string; publicLink: string };

@Injectable()
export class TldrawService {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: LegacyLogger) {}

	async createTldraw(
		userId: EntityId,
		title: string,
	): Promise<{ board: string; url: string } | false> {
		const data = {
			title,
		};
		try {
			const service = this.feathersServiceProvider.getService('/tldraw/roomName');
			const tldraw = (await service.create(data, { account: { userId } })) as TldrawResponse;
			return { board: tldraw.id, url: tldraw.publicLink };
		} catch (error) {
			this.logger.error('Could not create new Tldraw', error);
			return false;
		}
	}
}