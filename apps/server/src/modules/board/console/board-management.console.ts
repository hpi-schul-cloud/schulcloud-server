import { ConsoleWriterService } from '@shared/infra/console';
import { Command, Console } from 'nestjs-console';
import { BoardManagementUc } from '../uc/board-management.uc';

@Console({ command: 'board', description: 'board setup console' })
export class BoardManagementConsole {
	constructor(private consoleWriter: ConsoleWriterService, private boardManagementUc: BoardManagementUc) {}

	@Command({
		command: 'create-boards',
		options: [],
		description: 'create some boards',
	})
	async createBoards(): Promise<string> {
		const boardId = await this.boardManagementUc.createBoards();
		const report = `creation of boards is completed (${boardId})`;
		this.consoleWriter.info(report);
		return report;
	}
}
