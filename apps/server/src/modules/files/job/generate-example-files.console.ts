import { LegacyLogger } from '@infra/logger';
import { Command, Console } from 'nestjs-console';
import { GenerateExampleFilesUc } from './generate-example-files.uc';

@Console({ command: 'files', description: 'example file generation console' })
export class GenerateExampleFilesConsole {
	constructor(
		private readonly generateExampleFilesUc: GenerateExampleFilesUc,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(GenerateExampleFilesConsole.name);
	}

	@Command({
		command: 'generate-example-files <configPath>',
		description:
			'generates example files (personal, course, teams; some broken on purpose) for existing users, courses and teams, using the JSON config at <configPath>',
		options: [
			{
				flags: '-r, --remove',
				required: false,
				description: 'remove previously generated files (identified by the configured name prefix) instead',
			},
		],
	})
	public async generateExampleFiles(configPath: string, options?: { remove?: boolean }): Promise<void> {
		if (options?.remove) {
			await this.generateExampleFilesUc.remove(configPath);
		} else {
			await this.generateExampleFilesUc.generate(configPath);
		}
		this.logger.log('example file generation finished');
	}
}
