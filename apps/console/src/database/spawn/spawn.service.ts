import { Injectable, Logger } from '@nestjs/common';

import { spawn } from 'child_process';
import { EOL } from 'os';
import { SpawnCommand } from './spawn-command.interface';

@Injectable()
export class SpawnService {
	private encoding: BufferEncoding = 'utf-8';

	private logger: Logger;

	constructor() {
		this.logger = new Logger(SpawnService.name);
	}

	exec(spanCommand: SpawnCommand, callback: (stdout: string, code: number | null) => any): void {
		this.logger.log('start process execution...');
		const child = spawn(spanCommand.command, spanCommand.args, spanCommand.options);
		const output: string[] = [];

		child.stdout.setEncoding(this.encoding);
		child.stdout.on('data', (data: string) => {
			this.logger.log(data);
			output.push(data);
		});

		child.stderr.setEncoding(this.encoding);
		child.stderr.on('data', (data: string) => {
			this.logger.error(data);
		});

		child.on('close', (code) => {
			if (code === 0) this.logger.log(`finished execution with code ${code}`);
			else this.logger.error(`finished execution with code ${code || 'NO_EXIT_CODE_PROVIDED'}`);

			callback(output.join(EOL), code);
		});
	}
}
