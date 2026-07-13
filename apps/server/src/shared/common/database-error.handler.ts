import { type Dictionary, type IPrimaryKey } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

export const findOneOrFailHandler = (entityName: string, where: Dictionary | IPrimaryKey): NotFoundException =>
	new NotFoundException(
		`The requested ${entityName}${typeof where === 'string' ? `: ${where}` : ''} has not been found.`
	);
