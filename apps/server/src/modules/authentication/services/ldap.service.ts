import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SystemEntity } from '@shared/domain';
import { ErrorUtils } from '@src/core/error/utils';
import { LegacyLogger } from '@src/core/logger';
import { Client, createClient } from 'ldapjs';
import { LdapConnectionError } from '../errors/ldap-connection.error';

@Injectable()
export class LdapService {
	constructor(private readonly logger: LegacyLogger) {
		this.logger.setContext(LdapService.name);
	}

	async checkLdapCredentials(system: SystemEntity, username: string, password: string): Promise<void> {
		const connection = await this.connect(system, username, password);
		if (connection.connected) {
			connection.unbind();
			return;
		}
		throw new UnauthorizedException('User could not authenticate');
	}

	private connect(system: SystemEntity, username: string, password: string): Promise<Client> {
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
						reject(
							new UnauthorizedException(
								'User could not authenticate',
								ErrorUtils.createHttpExceptionOptions(err, 'LdapService:connect')
							)
						);
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
