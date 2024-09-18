import { ObjectID } from 'bson';
import { Class, ClassProps } from './class.do';

export class ClassFactory {
	public static create(props: Partial<ClassProps> = {}): Class {
		const baseProps = this.getBaseProps();
		const classProps = { ...baseProps, ...props };

		return new Class(classProps);
	}

	private static getBaseProps(): ClassProps {
		return {
			id: new ObjectID().toHexString(),
			name: '',
			schoolId: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			userIds: [],
			teacherIds: [],
		};
	}
}
