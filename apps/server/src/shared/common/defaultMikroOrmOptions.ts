import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		new NotFoundException(
			`The requested ${entityName}${typeof where === 'string' ? `: ${where}` : ''} has not been found.`
		),
};
