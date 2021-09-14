/* eslint-disable no-console */
import { Command, Console, createSpinner } from 'nestjs-console';

@Console()
export class ServerConsole {
	spinner = createSpinner();

	/** test method for console output */
	@Command({ command: 'test', description: 'sample test output' })
	getHello(): void {
		this.spinner.info('Schulcloud Server API');
	}

	/** test method for console input */
	@Command({ command: 'out <whatever>', description: 'return input args' })
	getInOut(whatever: string): void {
		this.spinner.info(`input was: ${whatever}`);
	}
}
