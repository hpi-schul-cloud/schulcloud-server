import { Entity, Property } from '@mikro-orm/core';
import { ITemporaryFile, IFileStats } from '@lumieducation/h5p-server';
import { BaseEntity } from '@shared/domain';

@Entity({ tableName: 'h5p-editor-temp-file' })
export class TemporaryFile extends BaseEntity implements ITemporaryFile, IFileStats {
	/**
	 * The name by which the file can be identified; can be a path including subdirectories (e.g. 'images/xyz.png')
	 */
	@Property()
	filename: string;

	@Property()
	expiresAt: Date;

	@Property()
	ownedByUserId: string;

	@Property()
	birthtime: Date;

	@Property()
	size: number;

	constructor(filename: string, ownedByUserId: string, expiresAt: Date, birthtime: Date, size: number) {
		super();
		this.filename = filename;
		this.ownedByUserId = ownedByUserId;
		this.expiresAt = expiresAt;
		this.birthtime = birthtime;
		this.size = size;
	}
}
