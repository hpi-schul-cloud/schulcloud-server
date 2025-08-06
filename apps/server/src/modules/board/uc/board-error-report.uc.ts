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

	public async reportError(userId: EntityId, params: BoardErrorReportBodyParams): Promise<{ reportId: string }> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const errorData = {
			...params,
			userId: userId,
			schoolId: user.school.id,
		};

		this.logger.warning(
			new BoardErrorLoggableException(
				errorData.message,
				errorData.type,
				errorData.url,
				errorData.contextType,
				errorData.contextId,
				errorData.schoolId,
				errorData.userId,
				errorData.retryCount
			)
		);
		console.log(`Reporting board error:`, errorData);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return { reportId: 'dummy-report-id' };
	}
}
