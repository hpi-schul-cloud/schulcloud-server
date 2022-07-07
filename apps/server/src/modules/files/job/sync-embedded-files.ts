/* istanbul ignore file */

import { Command, Console } from 'nestjs-console';
import { SyncEmbeddedFilesUc } from '../uc/sync-embedded-files.uc';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Console({ command: 'sync-embedded-files' })
export class SyncEmbeddedFilesConsole {
	constructor(private syncEmbeddedFilesUc: SyncEmbeddedFilesUc) {}

	@Command({ command: 'lessons' })
	async syncFilesForLessons() {}
}
