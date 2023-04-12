import { ConsoleWriterService } from '@shared/infra/console';
import { Logger } from '@src/core/logger';
import { Command, CommandOption, Console } from 'nestjs-console';
import { KeycloakConfigurationUc } from '../uc/keycloak-configuration.uc';

const defaultError = new Error('IDM is not reachable or authentication failed.');

interface IRetryOptions {
	retryCount?: number;
	retryDelay?: number;
}

interface IMigrationOptions {
	skip?: number;
	query?: string;
	verbose?: boolean;
}
@Console({ command: 'idm', description: 'Prefixes all Identity Management (IDM) related console commands.' })
export class KeycloakConsole {
	constructor(
		private readonly console: ConsoleWriterService,
		private readonly keycloakConfigurationUc: KeycloakConfigurationUc,
		private readonly logger: Logger
	) {
		this.logger.setContext(KeycloakConsole.name);
	}

	static retryFlags: CommandOption[] = [
		{
			flags: '-rc, --retry-count <value>',
			description: 'If the command fails, it will be retried this number of times. Default is no retry.',
			required: false,
			defaultValue: 1,
		},
		{
			flags: '-rd, --retry-delay <value>',
			description: 'If "retry" is active, this delay is used between each retry. Default is 10 seconds.',
			required: false,
			defaultValue: 10,
		},
	];

	/**
	 * For local development. Checks if connection to IDM is working.
	 */
	@Command({ command: 'check', description: 'Test the connection to the IDM.' })
	async check(): Promise<void> {
		if (await this.keycloakConfigurationUc.check()) {
			this.console.info('Connected to IDM');
		} else {
			throw defaultError;
		}
	}

	/**
	 * For local development. Cleans user from IDM
	 *
	 * @param options
	 */
	@Command({
		command: 'clean',
		description: 'Remove all users from the IDM.',
		options: KeycloakConsole.retryFlags,
	})
	async clean(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'clean',
			async () => {
				const count = await this.keycloakConfigurationUc.clean();
				this.console.info(`Cleaned ${count} users into IDM`);
				return count;
			},
			options.retryCount,
			options.retryDelay
		);
	}

	/**
	 * For local development. Seeds user into IDM
	 * @param options
	 */
	@Command({
		command: 'seed',
		description: 'Add all seed users to the IDM.',
		options: KeycloakConsole.retryFlags,
	})
	async seed(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'seed',
			async () => {
				const count = await this.keycloakConfigurationUc.seed();
				this.console.info(`Seeded ${count} users into IDM`);
				return count;
			},
			options.retryCount,
			options.retryDelay
		);
	}

	/**
	 * Used in production and for local development to transfer configuration to keycloak.
	 *
	 */
	@Command({
		command: 'configure',
		description: 'Configures Keycloak identity providers.',
		options: [...KeycloakConsole.retryFlags],
	})
	async configure(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'configure',
			async () => {
				const count = await this.keycloakConfigurationUc.configure();
				this.console.info(`Configured ${count} identity provider(s).`);
			},
			options.retryCount,
			options.retryDelay
		);
	}

	/**
	 * For migration purpose. Moves all database accounts to the IDM
	 * @param options
	 */
	@Command({
		command: 'migrate',
		description: 'Add all database users to the IDM.',
		options: [
			...KeycloakConsole.retryFlags,
			{
				flags: '-s, --skip',
				description: 'Skip the first "s" accounts during migration. Default 0.',
				required: false,
				defaultValue: undefined,
			},
			{
				flags: '-v, --verbose',
				description: 'Log all events. Default is false.',
				required: false,
				defaultValue: false,
			},
		],
	})
	async migrate(options: IRetryOptions & IMigrationOptions): Promise<void> {
		await this.repeatCommand(
			'migrate',
			async () => {
				const count = await this.keycloakConfigurationUc.migrate(Number(options.skip), Boolean(options.verbose));
				this.console.info(`Migrated ${count} users into IDM`);
				return count;
			},
			options.retryCount,
			options.retryDelay
		);
	}

	private async repeatCommand<T>(commandName: string, command: () => Promise<T>, count = 1, delay = 10): Promise<T> {
		let repetitions = 0;
		let error = new Error('error could be thrown if count is < 1');
		while (repetitions < count) {
			repetitions += 1;
			try {
				// eslint-disable-next-line no-await-in-loop
				return await command();
			} catch (err) {
				if (err instanceof Error) {
					error = err;
				} else {
					error = new Error(JSON.stringify(err));
				}

				if (repetitions < count) {
					this.console.info(
						`Command '${commandName}' failed, error: ${error.message}. retry in ${delay} seconds. Execution ${repetitions} / ${count}`
					);
					// eslint-disable-next-line no-await-in-loop
					await this.delay(delay * 1000);
				} else {
					break;
				}
			}
		}
		throw error;
	}

	private delay(ms: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
