import { Logger } from '@core/logger';
import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BoardErrorReportBodyParams } from '../controller/dto/board/board-error-report.body.params';
import { BoardErrorLoggableException } from '../loggable/board-error-loggable-exception';

@Injectable()
export class BoardErrorReportUc {
	constructor(private readonly authorizationService: AuthorizationService, private readonly logger: Logger) {}

	public async reportError(userId: EntityId, params: BoardErrorReportBodyParams): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const errorData = {
			...params,
			userId: userId,
			schoolId: user.school.id,
		};

		const loggable = new BoardErrorLoggableException(
			errorData.message,
			errorData.type,
			errorData.url,
			errorData.boardId,
			errorData.schoolId,
			errorData.userId,
			errorData.retryCount
		);
		this.logger.warning(loggable);
	}
}
