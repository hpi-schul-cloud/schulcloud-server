import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { MetaData, MetaTagExtractorService } from '../service';

@Injectable()
export class MetaTagExtractorUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly metaTagExtractorService: MetaTagExtractorService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(MetaTagExtractorUc.name);
	}

	async fetchMetaData(userId: EntityId, url: string): Promise<MetaData> {
		this.logger.debug({ action: 'fetchMetaData', userId });

		try {
			await this.authorizationService.getUserWithPermissions(userId);
		} catch (error) {
			throw new UnauthorizedException();
		}

		const result = await this.metaTagExtractorService.fetchMetaData(url);
		return result;
	}
}
