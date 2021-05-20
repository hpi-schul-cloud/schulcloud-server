import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<any, Types.ObjectId> {
	transform(value: any): Types.ObjectId {
		const validObjectId = Types.ObjectId.isValid(value);

		if (!validObjectId) {
			throw new BadRequestException('Invalid ObjectId');
		}

		return value;
	}
}
