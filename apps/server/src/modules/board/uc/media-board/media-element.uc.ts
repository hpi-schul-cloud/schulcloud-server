import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { type AnyMediaContentElementDo, type MediaLine } from '@shared/domain/domainobject';
import type { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaElementService, MediaLineService } from '../../service';

@Injectable()
export class MediaElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaLineService: MediaLineService,
		private readonly mediaElementService: MediaElementService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetLineId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.write([]));

		const targetLine: MediaLine = await this.mediaLineService.findById(targetLineId);

		const element: AnyMediaContentElementDo = await this.mediaElementService.findById(elementId);

		await this.mediaElementService.move(element, targetLine, targetPosition);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
