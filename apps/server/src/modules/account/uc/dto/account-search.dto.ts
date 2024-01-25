import { AccountSearchType } from '../../controller/dto';

export class AccountSearchDto {
	type!: AccountSearchType;

	value!: string;

	skip?: number = 0;

	limit?: number = 10;

	constructor(search: AccountSearchDto) {
		this.type = search.type;
		this.value = search.value;
		this.skip = search.skip;
		this.limit = search.limit;
	}
}
