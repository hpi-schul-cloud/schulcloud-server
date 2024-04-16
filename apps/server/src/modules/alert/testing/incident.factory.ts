import { IncidentDto } from '../adapter/dto';

export const createIncident = (id: number, componentId: number, status: number) =>
	new IncidentDto(
		1,
		componentId,
		'test',
		status,
		'test',
		new Date(),
		new Date(),
		new Date(),
		1,
		false,
		new Date(),
		1,
		false,
		false,
		'test',
		0,
		0,
		'test',
		'test',
		'test',
		0
	);
