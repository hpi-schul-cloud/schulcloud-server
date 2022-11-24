import { Injectable, UnauthorizedException } from '@nestjs/common';
import { System } from '@shared/domain';
import { Client, createClient } from 'ldapjs';
import { Logger } from '@src/core/logger';
import { LdapConnectionError } from '../errors/ldap-connection.error';

@Injectable()
export class LdapService {
	constructor(private logger: Logger) {
		this.logger.setContext(LdapService.name);
	}

	async authenticate(system: System, username: string, password: string) {
		const connection = await this.connect(system, username, password);
		if (connection.connected) {
			connection.unbind();
			return true;
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
						reject(new UnauthorizedException('Wrong credentials'));
					} else {
						this.logger.debug('[LDAP] Bind successful');
						resolve(client);
					}
				});
			});
			client.on('error', (err) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				this.logger.error('Error during LDAP operation', { error: err });
				reject(new LdapConnectionError());
			});
		});
	}
}
