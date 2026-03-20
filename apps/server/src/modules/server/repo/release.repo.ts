import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Release } from '../domain';
import { ReleaseClass } from './release.class';

@Injectable()
export class ReleaseRepo {
	constructor(private readonly em: EntityManager) {}

	public async findReleases(skip?: number, limit?: number): Promise<Release[]> {
		let cursor = this.em.getCollection('releases').find({}).sort({ publishedAt: -1 });

		if (skip !== undefined) {
			cursor = cursor.skip(skip);
		}

		if (limit !== undefined) {
			cursor = cursor.limit(limit);
		}

		const docs = await cursor.toArray();
		const releases = docs.map((doc) => {
			const obj = { ...doc, id: doc._id.toString() };
			delete (obj as { _id: unknown })._id;
			const release = plainToInstance(ReleaseClass, obj);
			// const errors = validateSync(release);
			// if (errors.length) throw new Error('Validation or release transformation failed');
			return release;
		});

		return releases;
	}
}
