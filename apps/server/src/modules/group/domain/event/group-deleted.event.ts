import { Group } from '../group';

export class GroupDeletedEvent {
	target: Group;

	constructor(target: Group) {
		this.target = target;
	}
}
