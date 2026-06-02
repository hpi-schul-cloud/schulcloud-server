export class JwtRedisIdentifier {
	private readonly _value: string;

	private constructor(accountId: string, jti: string) {
		this._value = `jwt:${accountId}:${jti}`;
	}

	public static forJti(accountId: string, jti: string): JwtRedisIdentifier {
		return new JwtRedisIdentifier(accountId, jti);
	}

	public static forAccount(accountId: string): JwtRedisIdentifier {
		return new JwtRedisIdentifier(accountId, '*');
	}

	public toString(): string {
		return this._value;
	}
}
