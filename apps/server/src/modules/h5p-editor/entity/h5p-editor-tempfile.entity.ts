import { IFileStats, ITemporaryFile } from '@lumieducation/h5p-server';
import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';

export interface TemporaryFileProperties {
	filename: string;
	ownedByUserId: string;
	expiresAt: Date;
	birthtime: Date;
	size: number;
}

@Entity({ tableName: 'h5p-editor-temp-file' })
export class H5pEditorTempFile extends BaseEntityWithTimestamps implements ITemporaryFile, IFileStats {
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

	constructor({ filename, ownedByUserId, expiresAt, birthtime, size }: TemporaryFileProperties) {
		super();
		this.filename = filename;
		this.ownedByUserId = ownedByUserId;
		this.expiresAt = expiresAt;
		this.birthtime = birthtime;
		this.size = size;
	}
}
