import { ErrorLogMessage, Loggable } from '@core/logger';
import { CopyContentParams, H5pEditorEvents } from '@infra/h5p-editor-client';
import { UnprocessableEntityException } from '@nestjs/common';

export class H5pEditorExchangeInvalidParamsLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly exchangeEvent: H5pEditorEvents, private readonly params: CopyContentParams) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: 'H5P_EDITOR_EXCHANGE_INVALID_PARAMS',
			stack: this.stack,
			data: {
				exchangeEvent: this.exchangeEvent.valueOf(),
				params: JSON.stringify(this.params),
			},
		};
	}
}
