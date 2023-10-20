import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { MetaData, MetaTagExtractorService } from '../service';

@Injectable()
export class MetaTagExtractorUc {
	constructor(
		// private readonly authorizationService: AuthorizationService,
		private readonly metaTagExtractorService: MetaTagExtractorService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(MetaTagExtractorUc.name);
	}

	async fetchMetaData(userId: EntityId, url: string): Promise<MetaData> {
		this.logger.debug({ action: 'fetchMetaData', userId });

		const result = await this.metaTagExtractorService.fetchMetaData(url);
		// WIP: check permission

		return result;
	}
}
