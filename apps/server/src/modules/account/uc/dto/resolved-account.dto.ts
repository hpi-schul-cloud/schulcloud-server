export class ResolvedAccountDto {
	id: string;

	username: string;

	userId?: string;

	activated?: boolean;

	updatedAt?: Date;

	constructor(account: ResolvedAccountDto) {
		this.id = account.id;
		this.username = account.username;
		this.userId = account.userId as string;
		this.activated = account.activated as boolean;
		this.updatedAt = account.updatedAt as Date;
	}
}
