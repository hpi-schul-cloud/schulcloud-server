import { Logger } from '@core/logger';
import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { DeleteContentParams, H5pEditorEvents, H5pEditorExchange } from '@infra/rabbitmq';
import { H5PEditor, IUser as LumiIUser } from '@lumieducation/h5p-server';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { H5pEditorContentDeletionSuccessfulLoggable } from '../../loggable';

@Injectable()
export class H5pEditorConsumer {
	constructor(private readonly logger: Logger, private readonly h5pEditor: H5PEditor, private readonly orm: MikroORM) {
		this.logger.setContext(H5pEditorConsumer.name);
	}

	@RabbitSubscribe({
		exchange: H5pEditorExchange,
		routingKey: H5pEditorEvents.DELETE_CONTENT,
		queue: H5pEditorEvents.DELETE_CONTENT,
	})
	@UseRequestContext()
	public async deleteContent(@RabbitPayload() payload: DeleteContentParams): Promise<void> {
		const user: LumiIUser = {
			email: '',
			id: '',
			name: '',
			type: '',
		};

		await this.h5pEditor.deleteContent(payload.contentId, user);

		this.logger.info(new H5pEditorContentDeletionSuccessfulLoggable(payload.contentId));
	}
}
