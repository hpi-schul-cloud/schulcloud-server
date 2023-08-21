import { ConsoleWriterService } from '@shared/infra/console/console-writer/console-writer.service';
import { Command, Console } from 'nestjs-console';
import { H5PEditorUc } from '../uc/h5p.uc';

@Console({ command: 'h5p', description: 'h5p-editor commands' })
export class DatabaseManagementConsole {
	constructor(private consoleWriter: ConsoleWriterService, private h5pEditorUc: H5PEditorUc) {}

	@Command({
		command: 'test',
		options: [],
		description: 'test dummy command',
	})
	syncIndexes(): void {
		this.h5pEditorUc.dummyFunction();
		this.consoleWriter.info('END');
	}
}
