import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserInfo } from './user-info.entity';

@Entity({ tableName: 'files' })
export class FileInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<File>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

    @Property()
    creator: UserInfo
}
