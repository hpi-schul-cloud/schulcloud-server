import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

export const findOneOrFailHandler = (entityName: string, where: Dictionary | IPrimaryKey): NotFoundException =>
	new NotFoundException(`The requested params are not been found.`, {
		cause: new Error(`The requested ${entityName}: ${JSON.stringify(where)} has not been found.`),
	});
