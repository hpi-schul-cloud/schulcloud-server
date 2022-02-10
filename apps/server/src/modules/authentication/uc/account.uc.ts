import { Injectable } from '@nestjs/common';
import { AccountRepo } from '@shared/repo/account';

@Injectable()
export class AccountUc {
	constructor(private accountRepo: AccountRepo) {}

	find() {
		// TODO
		throw new Error('Not implemented');
	}

	get() {
		// TODO
		throw new Error('Not implemented');
	}

	create() {
		// TODO
		throw new Error('Not implemented');
	}

	update() {
		// TODO
		throw new Error('Not implemented');
	}

	patch() {
		// TODO
		throw new Error('Not implemented');
	}

	remove() {
		// TODO
		throw new Error('Not implemented');
	}
}
