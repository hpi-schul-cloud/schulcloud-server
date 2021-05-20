# Conventions

## Naming Conventions

In TypeScript files: for Classes we use `PascalCase` (names start with uppercase letter), variables use lowercase for the first letter `camelCase`.

When assigning names, they may end with a concept name:

- A Concept might be a known term which is widely used. Samples from NestJS: Controller, Provider, Module, Middleware, Exception, Pipe, Guard, Interceptor.

- Beside we have own concepts like comparator, validator (generic ones should not be part of a modules (and located in shared folder btw) or repo, use-case which might be owned by a module.

In file names, we use lowercase and minus in the beginning and end with `.<concept>.ts`

### Samples

| File name               | Class name        | Concept    | Location          |
| ----------------------- | ----------------- | ---------- | ----------------- |
| login-user.uc.ts        | LoginUserUc       | use case   | module/uc         |
| text.validator.ts       | TextValidator     | validator  | shared/validators |
| user.repo.ts            | UserRepo          | repository | module/repo       |
| parse-object-id.pipe.ts | ParseObjectIdPipe | pipe       | shared/pipes      |

## Programming Conventions

### Programming principles

This project should try following the...

- Object-Oriented Programming Basics
- Object-Oriented Programming Design Principles (composition > inheritance, referring to abstractions, SOLID Principles)
- General Design Principles (YAGNI, KISS, DRY)

### Domain driven design

While [DDD](https://khalilstemmler.com/articles/domain-driven-design-intro/) is not enforced, we still try to follow its goals:

- Discover the domain model by interacting with domain experts and agreeing upon a common set of terms to refer to processes, actors and any other phenomenon that occurs in the domain.
- Take those newly discovered terms and embed them in the code, creating a rich domain model that reflects the actual living, breathing business and it's rules.
- Protect that domain model from all the other technical intricacies involved in creating a web application.

### 3 layer architecture

For the 3-layer architecture this means we have to protect the business layer and domain models from the outside world and infrastructure to keep it clean, fast, testable, ready for changes.

### Concepts

Beside Concepts NestJS introduces, own services like [repositories](https://khalilstemmler.com/articles/domain-driven-design-intro/#Repository) might be created. We prefer using use-cases to step in the application over CRUD.

### Domain Services

Domain Services (logic which depends on multiple entities, think about a state machine) are most often executed by application layer Application Services / Use Cases. Because Domain Services are a part of the Domain Layer and adhere to the dependency rule, Domain Services aren't allowed to depend on infrastructure layer concerns like Repositories to get access to the domain entities that they interact with. Application Services fetch the necessary entities, then pass them to domain services to run allow them to interact.

Sample: Within of a use case we not depend on a user context from outside while for logging, error handling or in a repository it might be used. Like we see in the clean architecture schema.

![](https://khalilstemmler.com/img/blog/ddd-intro/clean.jpg) "The Clean Architecture from the golden Uncle Bob archives"

### Domain events

Events have to be handled very carefully. Like hooks around services might lead into separating the business logic into independend untestable workflows, the events task and data must be defined clearly and should only be used for independent tasks.
