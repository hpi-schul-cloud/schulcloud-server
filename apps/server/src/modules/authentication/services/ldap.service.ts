import { Injectable, UnauthorizedException } from '@nestjs/common';
import { System } from '@shared/domain';
import { Client, createClient } from 'ldapjs';
import { LegacyLogger } from '@src/core/logger';
import { LdapConnectionError } from '../errors/ldap-connection.error';

@Injectable()
export class LdapService {
	constructor(private readonly logger: LegacyLogger) {
		this.logger.setContext(LdapService.name);
	}

	async checkLdapCredentials(system: System, username: string, password: string): Promise<void> {
		const connection = await this.connect(system, username, password);
		if (connection.connected) {
			connection.unbind();
			return;
		}
		throw new UnauthorizedException('User could not authenticate');
	}

	private connect(system: System, username: string, password: string): Promise<Client> {
		const { ldapConfig } = system;
		if (!ldapConfig) {
			throw Error(`no LDAP config found in system ${system.id}`);
		}
		const client: Client = createClient({
			url: ldapConfig.url,
			reconnect: {
				initialDelay: 100,
				maxDelay: 300,
				failAfter: 3,
			},
		});
		return new Promise((resolve, reject) => {
			client.on('connect', () => {
				client.bind(username, password, (err) => {
					if (err) {
						this.logger.debug(err);
						reject(new UnauthorizedException(err, 'User could not authenticate'));
					} else {
						this.logger.debug('[LDAP] Bind successful');
						resolve(client);
					}
				});
			});
			client.on('error', (err) => {
				reject(new LdapConnectionError({ error: err }));
			});
		});
	}
}
