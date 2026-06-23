import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsString } from 'class-validator';

@ValueObject()
export class JwtWhitelistIdentifier {
	@IsString()
	public readonly value: string;

	constructor(accountId: string, jti: string) {
		this.value = `jwt:${accountId}:${jti}`;
	}

	public static forJti(accountId: string, jti: string): JwtWhitelistIdentifier {
		return new JwtWhitelistIdentifier(accountId, jti);
	}

	public static forAccount(accountId: string): JwtWhitelistIdentifier {
		return new JwtWhitelistIdentifier(accountId, '*');
	}
}
