import { AccountSearchType } from '../../domain/type/account-search-type';

export class AccountSearchDto {
	public type!: AccountSearchType;

	public value!: string;

	public skip?: number = 0;

	public limit?: number = 10;

	constructor(search: AccountSearchDto) {
		this.type = search.type;
		this.value = search.value;
		this.skip = search.skip;
		this.limit = search.limit;
	}
}
