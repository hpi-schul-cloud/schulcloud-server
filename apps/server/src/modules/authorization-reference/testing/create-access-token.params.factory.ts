import { AuthorizableReferenceType, AuthorizationContextBuilder } from '@modules/authorization';
import { ObjectId } from '@mikro-orm/mongodb';
import { CreateAccessTokenParams } from '../api/dto';

class CreateAccessTokenParamsTestBuilder {
	private props: CreateAccessTokenParams = {
		referenceId: new ObjectId().toHexString(),
		referenceType: AuthorizableReferenceType.User,
		context: AuthorizationContextBuilder.read([]),
		payload: {},
		tokenTtlInSeconds: 3600, // Default TTL of 1 hour
	};

	public withPayload(payload: Record<string, unknown>): this {
		this.props.payload = payload;

		return this;
	}

	public withWriteAccess(): this {
		this.props.context = AuthorizationContextBuilder.write([]);

		return this;
	}

	public withReferenceId(referenceId: string): this {
		this.props.referenceId = referenceId;

		return this;
	}

	public build(): CreateAccessTokenParams {
		return this.props;
	}
}

export const createAccessTokenParamsTestFactory = (): CreateAccessTokenParamsTestBuilder =>
	new CreateAccessTokenParamsTestBuilder();
