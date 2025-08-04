import { Injectable } from '@nestjs/common';
import { BoardErrorReportBodyParams } from '../controller/dto/board/board-error-report.body.params';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class BoardErrorReportUc {
	public async reportError(userId: EntityId, params: BoardErrorReportBodyParams): Promise<{ reportId: string }> {
		// TODO: Implement error reporting logic (e.g., save to DB, log, etc.)
		// For now, return a dummy reportId
		const data = {
			...params,
			userId: userId,
			schoolId: 'user.school._id',
		};
		console.log(`Reporting board error:`, data);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return { reportId: 'dummy-report-id' };
	}
}
