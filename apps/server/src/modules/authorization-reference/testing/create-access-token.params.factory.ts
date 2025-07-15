import { AuthorizableReferenceType, AuthorizationContextBuilder } from '@modules/authorization';
import { CreateAccessTokenParams } from '../api/dto';
import { ObjectId } from 'bson';

class CreateAccessTokenParamsTestBuilder {
	private props: CreateAccessTokenParams = {
		referenceId: new ObjectId().toHexString(),
		referenceType: AuthorizableReferenceType.User,
		context: AuthorizationContextBuilder.read([]),
		payload: {},
		tokenTtl: 3600, // Default TTL of 1 hour
	};

	public withWriteAccess(): this {
		this.props.context = AuthorizationContextBuilder.write([]);

		return this;
	}

	public build(referenceId: string): CreateAccessTokenParams {
		this.props.referenceId = referenceId;

		return this.props;
	}
}

export const createAccessTokenParamsTestFactory = (): CreateAccessTokenParamsTestBuilder =>
	new CreateAccessTokenParamsTestBuilder();
