import { Expose } from 'class-transformer';
import { ExposeMongoIdAsString } from '../../../core/repo/entity/base.entity';
import { Types } from 'mongoose';

export class User {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	@Expose()
	firstName: string;
	@Expose()
	lastName: string;
	@Expose()
	get fullName() {
		return this.firstName + ' ' + this.lastName;
	}
}
