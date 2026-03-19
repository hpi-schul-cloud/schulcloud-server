import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

export const findOneOrFailHandler = (entityName: string, where: Dictionary | IPrimaryKey): NotFoundException =>
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	new NotFoundException(
		`The requested ${entityName}${typeof where === 'string' ? `: ${where}` : ''} has not been found.`
	);
