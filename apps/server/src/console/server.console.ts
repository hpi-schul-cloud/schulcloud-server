/* eslint-disable no-console */
import { Command, Console } from 'nestjs-console';
import { ConsoleWriter } from './console-writer/console-writer.service';

@Console({ command: 'server', description: 'sample server console' })
export class ServerConsole {
	constructor(private consoleWriter: ConsoleWriter) {}

	/** test method for console output */
	@Command({ command: 'test', description: 'sample test output' })
	getHello(): void {
		this.consoleWriter.info('Schulcloud Server API');
	}

	/** test method for console input */
	@Command({ command: 'out <whatever>', description: 'return input args' })
	getInOut(whatever: string): void {
		this.consoleWriter.info(`input was: ${whatever}`);
	}
}
