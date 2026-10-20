import { ErrorUtils } from '@infra/error';
import { InternalServerErrorException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class BoardNodeCopyFailedLoggableException extends InternalServerErrorException implements Loggable {
	private readonly causeError?: Error;

	constructor(
		private readonly boardNodeId: EntityId,
		private readonly boardNodeType: string,
		error: unknown
	) {
		const options = ErrorUtils.createHttpExceptionOptions(error);
		super(options);
		this.causeError = options.cause as Error | undefined;
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'BOARD_NODE_COPY_FAILED',
			error: this.causeError,
			stack: this.stack,
			data: {
				boardNodeId: this.boardNodeId,
				boardNodeType: this.boardNodeType,
			},
		};
	}
}
