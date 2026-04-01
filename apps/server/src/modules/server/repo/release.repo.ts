import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Release } from '../domain';
import { ReleaseClass } from './release.class';

@Injectable()
export class ReleaseRepo {
	constructor(private readonly em: EntityManager) {}

	public async findReleases(skip?: number, limit?: number): Promise<Release[]> {
		let cursor = this.em.getCollection('releases').find({}).sort({ publishedAt: -1 });

		if (skip) {
			cursor = cursor.skip(skip);
		}

		if (limit) {
			cursor = cursor.limit(limit);
		}

		const docs = await cursor.toArray();
		const releases = docs.map((doc) => {
			const obj = { ...doc, id: String(doc._id) };
			delete (obj as { _id: unknown })._id;
			const release = plainToInstance(ReleaseClass, obj);
			const errors = validateSync(release);
			/* istanbul ignore next */
			if (errors.length) throw new Error('Validation of release document failed');
			return release;
		});

		return releases;
	}
}
