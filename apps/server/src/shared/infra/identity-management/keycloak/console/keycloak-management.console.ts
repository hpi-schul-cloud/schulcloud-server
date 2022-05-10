import { Command, CommandOption, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@shared/infra/console';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

const defaultError = new Error('IDM is not reachable or authentication failed.');

interface IRetryOptions {
	retryCount: number;
	retryDelay: number;
}

@Console({ command: 'idm', description: 'Prefixes all Identity Management (IDM) related console commands.' })
export class KeycloakConsole {
	constructor(
		private readonly console: ConsoleWriterService,
		private readonly keycloakManagementUc: KeycloakManagementUc
	) {}

	@Command({ command: 'check', description: 'Test the connection to the IDM.' })
	async check(): Promise<void> {
		if (await this.keycloakManagementUc.check()) {
			this.console.info('Connected to IDM');
		} else {
			throw defaultError;
		}
	}

	@Command({
		command: 'clean',
		description: 'Remove all users from the IDM.',
	})
	async clean(): Promise<void> {
		try {
			const count = await this.keycloakManagementUc.clean();
			this.console.info(`Cleaned ${count} users from IDM`);
		} catch {
			throw defaultError;
		}
	}

	@Command({
		command: 'seed',
		description: 'Add all seed users to the IDM.',
	})
	async seed(): Promise<void> {
		try {
			const count = await this.keycloakManagementUc.seed();
			this.console.info(`Seeded ${count} users from IDM`);
		} catch {
			throw defaultError;
		}
	}
}
