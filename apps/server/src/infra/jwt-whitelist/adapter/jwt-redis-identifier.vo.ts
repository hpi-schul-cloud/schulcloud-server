export class JwtWhitelistIdentifier {
	private readonly _value: string;

	private constructor(accountId: string, jti: string) {
		this._value = `jwt:${accountId}:${jti}`;
	}

	public static forJti(accountId: string, jti: string): JwtWhitelistIdentifier {
		return new JwtWhitelistIdentifier(accountId, jti);
	}

	public static forAccount(accountId: string): JwtWhitelistIdentifier {
		return new JwtWhitelistIdentifier(accountId, '*');
	}

	public toString(): string {
		return this._value;
	}
}
