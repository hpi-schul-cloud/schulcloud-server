import { ConsoleWriterService } from '@shared/infra/console';
import { ObjectId } from 'bson';
import { Command, Console } from 'nestjs-console';
import { BoardManagementUc } from '../uc/board-management.uc';

@Console({ command: 'board', description: 'board setup console' })
export class BoardManagementConsole {
	constructor(private consoleWriter: ConsoleWriterService, private boardManagementUc: BoardManagementUc) {}

	@Command({
		command: 'create-board [courseId]',
		description: 'create a multi-column-board',
	})
	async createBoard(courseId: string = ''): Promise<void> {
		if (!ObjectId.isValid(courseId)) {
			this.consoleWriter.info('Error: please provide a valid courseId this board should be assigned to.');
			return;
		}

		const boardId = await this.boardManagementUc.createBoard(courseId);
		if (boardId) {
			this.consoleWriter.info(`Success: board creation is completed! The new boardId is "${boardId ?? ''}"`);
		}
	}
}
