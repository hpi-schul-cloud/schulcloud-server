import { ImportUser } from '@shared/domain';
import { Scope } from '../scope';

export class ImportUserScope extends Scope<ImportUser> {
	byFirstName(firstName: string): ImportUserScope {
		this.addQuery({ firstName });
		return this;
	}

	byLastName(lastName: string): ImportUserScope {
		this.addQuery({ lastName });
		return this;
	}
}
