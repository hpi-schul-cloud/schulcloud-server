import { ResolvedAccountDto } from './resolved-account.dto';

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
