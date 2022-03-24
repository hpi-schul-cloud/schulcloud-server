import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};
