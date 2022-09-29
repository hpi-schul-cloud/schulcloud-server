# NestJS Authorisation Module

## Objectives

Breaking down complexity and isolate it.
One place to solve a specific authorisation for a scope.
One implementation to handle all different situations in our system.
It should not be possible to use it in a wrong way.
> You should not need to understand the complete system, to know if something is authorised

We also want to avoid any specific code for modules, collections, or something else, in the authorisation module.

## Explanation of Terms

### permissions

We have string based permissions.
For examples check "enum Permission".
It includes all available permissions and is not seperated by concerns or abstraction levels.
The permissions have different implicit scopes like instance, school, or named scope like team and course.

#### (feature flag permissions)

Some of the permissions are used like feature flags. We want to seperate and move these in the future.
Please keep that in mind, while becoming familiar with permissions.

### roles

We have a role collection, where each role has a permissions array that includes string based permissions.
The roles can have in the "roles" field other roles to inherit permissions from other roles.
Like the "user" role, some of these roles are abstract and only used for inheritance.
Some others are scope based with a prefix name like team*, or course*.

The "real" user roles by name are expert, student, teacher and administrator. All of these are in the school scope and the superhero is in the scope of an instance.

> In future we want to remove the inherit logic.
> We want to add scopes types to each role.
> Add more technical users for the instance scope.

### entities

The entities are the representation of a single document of the collection, or the type.
They are used for authorisation for now, but should be replaced by domain objects soon.

### domain objects

They are not really introduced. They should mapped between the repository layer and the domain.
> In future they are the base for authorisation and the authorisation service doesn't know anything about entities anymore.

### scopes

Everything what the system, or a user wants to do, is executed in a scope.
A scope means an area like the complete instance, the school, the course, the user itself and so on.
The scopes are highly bind to the real domain objects that we have in our domain.

#### scope actions

The permission for a base action, like they are defined in CRUD operations, is needed to execute something in a scope.
The most implicit action you ever need is the "read" action. That means, you must have the authorisation to "read" the scope, otherwise it should not exist for you. :-)
The other possible action is to have write access to the scope.
It is a combination of delete, edit, create from CRUD side.

> From our current perspective, we need no differentiation.
> But we force the implementation in a way, that allows us to add some more.

#### scope permission

We have different situations where it is hard to say you can write/read to the domain scope.
We need the possibility to define differents for a single domain scope, or a single domain object it self.

> Let say the user can edit his own user account, but we want to disallow that they can change his age.
> But an administrator should have the authorisation to do it.

or a other case..
> A student has limited permissions in a team, where he is only a member, but would have more permissions in a team, where he is the owner. So at this point, we need to distingush between instances of domain objects.

### user(s)

In authorisation scope it can be a system user, or a real user in our application.
Each user has a role with permissions in the scope of the domain object they want to interact with.
Each authorisation requires a user.

#### system users

We have console operations, or operations based on API_KEYS that are used between internal services for already authorised operations like copy and copy files in file service.
For this we want to use system user and roles with own permissions.
> They are not introduced for now

## Rules

A rule is the implementation that solves the authorisation for a domain object based on the executed action.
A rule has implement a check for what they should match. Mostly the entities, or the domain object.
They are called from the authorisation service.

> We highly recommend that every single operation and check in the rule is implemented as a additional method to keep the logic clean and moveable.

## User (Role) Permissions vs Scope Based Permissions

We have user permission they are added from the role of the user.
This permissions have no explicit scope. But *implicit* the roles expert, student, teacher and administrator are in the school scope. The superhero is in the scope of the instance.

It exist also scope based permissions to solved the situation, that a user can have in different (scope)roles in different (domain)scopes. For example in teams where the student can have teamuser in one team, or teamadminstrator in a other.

> In future we want to switch the implicit scope of the user role permissions to explicit scopes like in teams.
> At the moment we must handle scope-, user- and system-user-permissions as seperated special cases in the implementation.
> By implementation of user role permissions bind to scopes, we can do it in one way for all situations

## How should you Authorise an Operation?

Authorisation must be handled in use cases (UC). They solve the authorisation and *orchestrate* the logic that should be done in services, or private methods.
You should never implement authorisation on service level, to avoid different authorisation steps.
When calling other internal micro service for already authorised operations please use a queue based on RabbitMQ.

> Not implemented but coming soon.

## How to use Authorisation Service

> Please avoid to catch the errors of the authorisation in UC.

### Example 1 - Execute a single operation

``` javascript
    this.authorizationService.hasPermission(user, course, PermissionContextBuilder.write([])
    // next orechstration steps
```

### Example 2 - Execute a single operation with loading ressouces

``` javascript
    this.checkPermission(userId, ReferenceEntityType.course, courseId, PermissionContextBuilder.read([]));
    // next orechstration steps
```

### Example 3 - Set permission(s) of user as required

``` javascript
    // Multiple permissions can be added. For a sussesful authorisation, the user need all of them.
    await this.hasPermission(userId, course, PermissionContextBuilder.read([Permissions. COURSE_VIEW]));
    // next orechstration steps
```

### Example 4 - Define context for multiple places

``` javascript
/** const **/
export const PermissionContexts = {
    create: PermissionContextBuilder.write([Permission.FILESTORAGE_CREATE]),
    read: PermissionContextBuilder.read([Permission.FILESTORAGE_VIEW]),
    update: PermissionContextBuilder.write([Permission.FILESTORAGE_EDIT]),
    delete: PermissionContextBuilder.write([Permission.FILESTORAGE_REMOVE]),
};

/** UC **/
this.hasPermission(userId, course, PermissionContexts.create);
// do other orechstration steps

```

## Structure of the Authorisation Components

### feathers-* (legacy/deprecated)

It exists a adapter to call featherJS endpoints that solve authorisations.
> This service is only used in news and should not be used in any other place.
> We want to remove it completly.

### Authorisation Module

The authorisation module is the core of authorisation. It collects all needed information and handles it behind a small interface. It exports the authoriation service that can be used in your use case over injections.

### Reference.loader

For situations where only the id and the domain object (string) type is known, it is possible to use the *ByReferences methods.
They load the reference directly.
> Please keep in mind that it can be have an impact on the performance if you use it wrongly.
> We keep it as a seperate method to avoid the usage in areas where the domain object should exist, because we see the risk that a developer could be tempted by the ease of only passing the id.

### shared/domain/rules/*

The location to add new rules for entities / domain objects.

#### permission-context.builder

We export a permission context builder to prepare the parameter for the authorisation service called "authorisation context".
This is optional and not required.
But it enables us to easily change the structure of the authorisation context without touching many different places.

### shared/domain/interface/*

#### rolename.enum

An enum that holds all avaible role names.

#### permission.enum

A enum that hold all avaible permission names, however it's mixing all domain scopes atm.

## Working other Internal MicroServices

> Example FilesStorageService

We have the files storage service application that are a bundle of modules of this repository.
The application is startet as additional micro service.
It exists the need that the server application can call the file service.
We add a files storage client module to the server.
This module export a service to call with the file service.

For the communication it used http calls, but it is switching to RabbitMQ soon.
Every operation must already authorised in the UC of the server. It exist no need to do it again in files storage service.
For this we want that the consumer of the RabbitMQ call the files storage service, services directly without authorisation.

## Legacy Tech Stack FeatherJS Hooks

In featherJS all the authorisation is done in hooks. Mostly before hooks and sometimes in after hooks.
Before and after means before, or after the database operation. For self writen services before, or after the call of the operation that should be executed.
They work similar to express middleware and bring is own request context.

It exists hooks can be for all http(s) calls, or for specific type based on CRUD operations.
Additional it exist the find operations that is a http(s) GET without ID of a specific element.
Each function that add to the hooks will executed in order. Hooks for all methods first, then hooks for specific methodes.

Each hooks exist for a featherJS service that exposed directly the api endpoints. Additional it exist a global hook pattern for the whole application.

Example: <https://github.com/hpi-schul-cloud/schulcloud-server/blob/main/src/services/lesson/hooks/index.js#L232>

## Desired Changes in Future

Some small steps are done. But many next steps still exist.
They follow our general target.

### Next Steps

1. Implementation of Scope Based Permissions as generell solution instead of User Permissions that has only implicit school scopes for now.
    Remove populate logic in reference loader.
    Solve eager loading in coursegroups.
2. Introduce RabbitMQ. Splitting Service(logic) from UC, that we can call services over the consumer for internal communication between micro services of already authorised operations.
    Think about: Move hasPermission checks from rules to a more generic place.
    Remove jwt decorator and cleanup copy logic.
    Move authorisation-context.builder to authorisation module.
3. Remove inheritance from roles, because we want to write it explizitly into the collection documents.
    Moving role api endpoints to nestjs.
    Fixing of dashboard to handle roles in the right way as superhero.
4. Switching entity based authorisation to domain objects based in steps.
5. Cleanup of feature flags from user permissions.
    Add existing feature flags to rules on places where it make sense.
6. Introduce instance as a scope to have an implemenation that handles all scopes/rules/permissions/user types in the same way.

### Refactoring Todos

- Task module should fully use authorisation service.
- News module should start to use authorisation service.

### Is Needed

- We can introduce a new layer called "policy" that combine different rules (any of them has their own matching strategy) for a single domain object between authorisation and rule to reduce complexity in a single rule.
- We can switch to a behaviour where rules register themself at the authorisation service than.
