export class ResolvedAccountDto {
	id: string;

	username: string;

	userId?: string;

	activated?: boolean;

	updatedAt?: Date;

	constructor(account: ResolvedAccountDto) {
		this.id = account.id;
		this.username = account.username;
		this.userId = account.userId;
		this.activated = account.activated;
		this.updatedAt = account.updatedAt;
	}
}

export class ResolvedSearchListAccountDto {
	data: ResolvedAccountDto[];
	total: number;
	skip?: number;
	limit?: number;

	constructor(data: ResolvedAccountDto[], total: number, skip?: number, limit?: number) {
		this.data = data;
		this.total = total;
		this.skip = skip;
		this.limit = limit;
	}
}