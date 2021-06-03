# Domain driven design

While [DDD](https://khalilstemmler.com/articles/domain-driven-design-intro/) is not enforced, we still try to follow its goals:

- Discover the domain model by interacting with domain experts and agreeing upon a common set of terms to refer to processes, actors and any other phenomenon that occurs in the domain.
- Take those newly discovered terms and embed them in the code, creating a rich domain model that reflects the actual living, breathing business and it's rules.
- Protect that domain model from all the other technical intricacies involved in creating a web application.

## Clean Architecture

![](https://khalilstemmler.com/img/blog/ddd-intro/clean.jpg) "The Clean Architecture from the golden Uncle Bob archives"

For the 3-layer architecture this means we have to protect the business layer and domain models from the outside world and infrastructure to keep it clean, fast, testable, ready for changes.

## Concepts

### Entities

NestJS does not cover how to persist entities, the heart of our application. We need a solution that not only transfers data like mongoose, instead we want to define business rules on objects with strong typing added.

Instead of Interface, Model and Schema which describe the view on data, now we define Entities, that get a DRY possibility to be created, loaded, and persisted using en entity manager. The definition of how an entity relates with others or how it is persisted can be added using decorators.

See https://github.com/mikro-orm/mikro-orm#-core-features for further details.

### Domain Services

Domain Services are most often executed by application layer Application Services / Use Cases. Because Domain Services are a part of the Domain Layer and adhere to the dependency rule, Domain Services aren't allowed to depend on infrastructure layer concerns like Repositories to get access to the domain entities that they interact with. Application Services fetch the necessary entities, then pass them to domain services to run allow them to interact.

Sample: Within of a use case we not depend on a user context from outside while for logging, error handling or in a repository it might be used. Like we see in the clean architecture schema.

#### Use Cases

Beside Concepts NestJS introduces, own services like [repositories](https://khalilstemmler.com/articles/domain-driven-design-intro/#Repository) or use-cases might be created.

Use cases either return entities (data) to the user through a query (CRUD) or apply a command (do ... ok/err).
Further reading: https://khalilstemmler.com/articles/oop-design-principles/command-query-separation/

They focus on providing business use cases and should only contain higher logical function calls, that are well-tested and hide their implementation inside of a use-case.

```TypeScript
    /**
     * Let an existing user create a new user (on same school).
     * @throws: USER_ALREADY_EXISTS, API_VALIDATION_ERROR
     * @throws: FORBIDDEN, BAD_REQUEST, INTERNAL_SERVER_ERROR, ...
     */
	async registerNewUser(creatorId: EntityId, schoolId: EntityId, props: INewUserProps): Promise<User> {
		this.logger.log(`create new user called by ${creatorId}`);

        // check creator has permission in school to create user
		await this.authorizationService.checkEntityPermissions(creatorId, School, schoolId, ['USER_CREATE']);

        // check user not exists
        await this.userService.checkUserNotExistByEmail(props.email)

		const user = new User(props);
		await this.userRepo.save(user);

        if(enableUserActivation){
            // call other service which creates pin and sends email
        }

        if(sendWelcomeEmailToUser){
            await this.userEmailService.sendWelcomeMessage(user);
        }

		this.logger.log(`user ${user.id} created by user ${creatorId}`);

		return user;
	}


    // ... userService

    checkUserNotExistByEmail(email: string){
        // todo email is not empty
        const existingUser = await this.userRepo.findByEmail(props.email);
        if(existingUser.length > 0) {
            throw new UserAlreadyExistError();
        }
    }
```

How to structure a use case? When creating a use case, care of

- the general business goal
- preconditions
- actors, in-put & out-put data
- post conditions to be well-known
- the normal case (step by step)
- all (handled) exception-cases (to be handled in a client application)

##### Clean Code principles

A use case should consist only of business-rules and decisions (functional requirements), while the final implementation is part of functions that are called from the use case. There, we no more see any details about the functional requirements.

### Domain events

Events have to be handled very carefully or in best case not to be used. Like hooks around services might lead into separating the business logic into independend untestable workflows, the events task and data must be defined clearly and should only be used for independent tasks.
