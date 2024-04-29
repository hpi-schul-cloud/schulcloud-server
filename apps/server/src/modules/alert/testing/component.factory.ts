import { ComponentDto } from '../adapter/dto';

export const createComponent = (id: number, groupId: number) =>
	new ComponentDto(id, 'test', 'test', 'test', 1, 0, groupId, new Date(), new Date(), new Date(), true, 'test');
