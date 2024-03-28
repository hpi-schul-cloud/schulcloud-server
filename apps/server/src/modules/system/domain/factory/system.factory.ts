import { System, SystemProps } from '../system.do';

export class SystemFactory {
	static build(props: SystemProps) {
		return new System(props);
	}
}
