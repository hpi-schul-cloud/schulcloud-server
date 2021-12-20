import { ObjectId } from 'mongodb';
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

	bySchoolId(schoolId: string): ImportUserScope {
		// @ts-ignore
		this.addQuery({ schoolId: new ObjectId(schoolId) });
		return this;
	}
}
