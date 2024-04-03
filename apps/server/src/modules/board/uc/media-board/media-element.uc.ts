import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { type AnyMediaContentElementDo, type MediaLine } from '@shared/domain/domainobject';
import type { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaElementService, type MediaLineService } from '../../service';

@Injectable()
export class MediaElementUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaLineService: MediaLineService,
		private readonly mediaElementService: MediaElementService
	) {}

	public async moveElement(
		userId: EntityId,
		elementId: EntityId,
		targetLineId: EntityId,
		targetPosition: number
	): Promise<void> {
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const targetLine: MediaLine = await this.mediaLineService.findById(targetLineId);

		const element: AnyMediaContentElementDo = await this.mediaElementService.findById(elementId);

		await this.mediaElementService.move(element, targetLine, targetPosition);
	}
}
