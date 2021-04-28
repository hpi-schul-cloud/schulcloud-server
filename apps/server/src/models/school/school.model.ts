import { Expose } from 'class-transformer';
import { ExposeMongoIdAsString } from '../base';
import { Types } from 'mongoose';

export class School {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	/** the schools name */
	@Expose()
	name: string;
}
