import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ClassesRepo } from '../repo';
import { Class } from '../domain';

@Injectable()
export class ClassService {
	constructor(private readonly classesRepo: ClassesRepo) {}

	public async findUserDataFromClasses(userId: EntityId): Promise<Class[]> {
		const classes = await this.classesRepo.findAllByUserId(userId);

		return classes;
	}

	public async deleteUserDataFromClasses(userId: EntityId): Promise<number> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const domainObjects = await this.classesRepo.findAllByUserId(userId);

		const updatedClasses: Class[] = domainObjects.map((domainObject) => {
			if (domainObject.userIds !== undefined) {
				domainObject.removeUser(userId);
			}
			return domainObject;
		});

		await this.classesRepo.updateMany(updatedClasses);

		return updatedClasses.length;
	}
}
