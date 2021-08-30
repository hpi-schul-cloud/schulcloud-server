/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-multi-str */
import { Logger, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SpawnService } from './spawn/spawn.service';
import { DATABASE_URL, SEED_DATA_DIRECTORY } from './constants';

@Injectable()
export class DatabaseService {
	private logger: Logger;

	constructor(private spawnService: SpawnService) {
		this.logger = new Logger(DatabaseService.name, true);
	}

	public async seedDatabase(): Promise<string> {
		this.logger.log('start resetting and seeding the database...');
		// todo set cwd correctly

		if (typeof DATABASE_URL !== 'string') {
			throw new InternalServerErrorException('missing DATABASE_URL in configuration');
		}
		const byFileAction = `mongoimport --uri ${DATABASE_URL} $file --jsonArray --drop`;

		return new Promise((resolve) => {
			this.spawnService.exec(
				{
					command: `for file in *; do ${byFileAction}; done`,
					options: { cwd: SEED_DATA_DIRECTORY, shell: 'bash' },
				},
				(stdout) => {
					this.logger.log('resetting the database done');
					resolve(stdout);
				}
			);
		});
	}
}
