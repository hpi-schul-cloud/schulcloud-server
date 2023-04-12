# NestJS Authorization Module

## Objectives

Breaking down complexity and isolate it.
One place to solve a specific authorization for a scope.
One implementation to handle all different situations in our system.
It should not be possible to use it in a wrong way.

> You should not need to understand the complete system, to know if something is authorized

We also want to avoid any specific code for modules, collections, or something else, in the authorization module.

## Explanation of Terms

### Permissions

We have string based permissions.
For examples check "enum Permission".
It includes all available permissions and is not seperated by concerns or abstraction levels.
The permissions have different implicit scopes like instance, school, or named scope like team and course.

#### (Feature Flag Permissions)

Some of the permissions are used like feature flags. We want to seperate and move these in the future.
Please keep that in mind, while becoming familiar with permissions.

### Roles

We have a role collection, where each role has a permissions array that includes string based permissions.
Roles inherit permissions from the roles they have in their "roles" field.
Like the "user" role, some of these roles are abstract and only used for inheritance.
Some others are scope based with a prefix name like team*, or course*.

The "real" user roles by name are expert, student, teacher and administrator. All of these are in the school scope and the superhero is in the scope of an instance.

> In future we want to remove the inherit logic.
> We want to add scope types to each role.
> Add more technical users for the instance scope.

### Entities

The entities are the representation of a single document of the collection, or the type.
They are used for authorization for now, but should be replaced by domain objects soon.

### Domain Objects

They are not really introduced. They should map between the repository layer and the domain.

> In future they are the base for authorization and the authorization service doesn't know anything about entities anymore.

### Scopes

Everything what the system, or a user wants to do, is executed in a scope.
A scope means an area like the complete instance, the school, the course, the user itself and so on.
The scopes are highly bind to the real domain objects that we have in our domain.

#### Scope Actions

The permission for a base action, like they are defined in CRUD operations, is needed to execute something in a scope.
The most implicit action you ever need is the "read" action. That means, you must have the authorization to "read" the scope, otherwise it should not exist for you. :-)
The other possible action is to have write access to the scope.
It is a combination of delete, edit, create from CRUD side.

> From our current perspective, we need no differentiation.
> But we force the implementation in a way, that allows us to add some more.

#### Scope Permission

We have different situations where it is hard to say you can write/read to the domain scope.
We need the possibility to define different permissions for a single domain scope, or a single domain object it self.

> Let say the user can edit his own user account, but we want to disallow that they can change his age.
> But an administrator should have the authorization to do it.

or a other case..

> A student has limited permissions in a team, where he is only a member, but would have more permissions in a team, where he is the owner. So at this point, we need to distingush between instances of domain objects.

### User(s)

In authorization scope it can be a system user, or a real user in our application.
Each user has a role with permissions in the scope of the domain object they want to interact with.
Each authorization requires a user.

#### System Users

We have console operations, or operations based on API_KEYS that are used between internal services for already authorized operations like copy and copy files in file service.
For this we want to use system user and roles with own permissions.

> They are not introduced for now

## Rules

The rules are implemented with a strategy pattern and are called from the authorization service.
The implementation should solve the authorization for a domain object based on the executed action.
It implements a check for which domain object, entity, or additional conditions should be used.

> The rule must validate our scope actions.
> We highly recommend that every single operation and check in the rule is implemented as a additional method to keep the logic clean and moveable.

## User (Role) Permissions vs Scope Based Permissions

The permissions of the user come from his role.
This permissions have no explicit scope. But _implicitly_ the roles expert, student, teacher and administrator are in the school scope. The superhero is _implicitly_ in the scope of the instance.

It exists also scope based permissions. A user can have different (scope)roles in different (domain)scopes. For example in teams where the student can have team member role in one team, or team adminstrator in another.

> In future we want to switch the implicit scope of the user role permissions to explicit scopes like in teams.
> At the moment we must handle scope-, user- and system-user-permissions as seperated special cases in our implementation.
> By implementing user role permissions bind to scopes, we can do it in one way for all situations.

## How should you Authorize an Operation?

Authorization must be handled in use cases (UC). They solve the authorization and _orchestrate_ the logic that should be done in services, or private methods.
You should never implement authorization on service level, to avoid different authorization steps.
When calling other internal micro service for already authorized operations please use a queue based on RabbitMQ.

> Not implemented but coming soon.

## How to use Authorization Service

> Please avoid to catch the errors of the authorization in UC.
> We set empty array as required for passing permissions to make it visible that no string base permission is needed.

### Example 1 - Execute a Single Operation

```javascript
   this.authorizationService.checkIfAuthorized(user, course, AuthorizationContextBuilder.write([])
   // or
   this.authorizationService.isAuthorized(user, course, AuthorizationContextBuilder.write([])
   // next orchestration steps
```

### Example 2 - Execute a Single Operation with Loading Resources

```javascript
// If you don't have an entity but an entity type and id, you can check permission by reference
await this.checkIfAuthorizedByReferences(userId, AllowedEntity.course, courseId, AuthorizationContextBuilder.read([]));
// or
await this.isAuthorizedByReferences(userId, AllowedEntity.course, courseId, AuthorizationContextBuilder.read([]));
// next orchestration steps
```

### Example 3 - Set Permission(s) of User as Required

```javascript
// Multiple permissions can be added. For a successful authorization, the user need all of them.
await this.isAuthorized(userId, course, AuthorizationContextBuilder.read([Permissions.COURSE_VIEW]));
// next orchestration steps
```

### Example 4 - Define Context for Multiple Places

```javascript
/** const **/
export const PermissionContexts = {
   create: AuthorizationContextBuilder.write([Permission.FILESTORAGE_CREATE]),
   read: AuthorizationContextBuilder.read([Permission.FILESTORAGE_VIEW]),
   update: AuthorizationContextBuilder.write([Permission.FILESTORAGE_EDIT]),
   delete: AuthorizationContextBuilder.write([Permission.FILESTORAGE_REMOVE]),
};

/** UC **/
this.isAuthorized(userId, course, PermissionContexts.create);
// do other orchestration steps
```

## How to use in our use cases

### Example - Create a school by **superhero**

```ts
async createSchoolBySuperhero(userId: EntityId, params: { name: string }) {

    const user = this.authorizationService.getUserWithPermissions(userId);
    this.authorizationService.hasAllPermissions(user, [Permission.SCHOOL_CREATE]);

    const school = new School(params);

    await this.schoolService.save(school);

    return true;
}

```

### Example - Create user by **admin**

```ts

async createUserByAdmin(userId: EntityId, params: { email: string, firstName: string, lastName: string, schoolId: EntityId }) {

    const user = this.authorizationService.getUserWithPermissions(userId);

   await this.checkIfAuthorizedByReferences(userId, AllowedEntity.school, schoolId, AuthorizationContextBuilder.write([Permission.INSTANCE, Permission.CREATE_USER]));

    const newUser = new User(params)

    await this.userService.save(newUser);

    return true;
}

```

### Example - Edit course by **admin**

```ts
// admin
async editCourseByAdmin(userId: EntityId, params: { courseId: EntityId, description: string }) {

    const course = this.courseService.getCourse(params.courseId);
    const user = this.authorizationService.getUserWithPermissions(userId);

   const school = course.school

    this.authorizationService.hasPermissions(user, school, [Permission.INSTANCE, Permission.COURSE_EDIT]);

    course.description = params.description;

    await this.courseService.save(course);

    return true;
}

```

### Example - Create a Course

```ts
// User can create a course in scope a school, you need to check if he can it by school
async createCourse(userId: EntityId, params: { schoolId: EntityId }) {
   const user = this.authorizationService.getUserWithPermissions(userId);
   const school = this.schoolService.getSchool(params.schoolId);

        this.authorizationService.checkIfAuthorized(user, school
            {
                action: Actions.write,
                requiredPermissions: [Permission.COURSE_CREATE],
            }
        );

    const course = new Course({ school });

    await this.courseService.saveCourse(course);

    return course;
}

```

### Example - Create a Lesson

```ts
// User can create a lesson to course, so you have a courseId
async createLesson(userId: EntityId, params: { courseId: EntityId }) {
    const course = this.courseService.getCourse(params.courseId);
    const user = this.authorizationService.getUserWithPermissions(userId);
         // check permission for user and course
        this.authorizationService.checkIfAuthorized(user, course
            {
                action: Actions.write,
                requiredPermissions: [Permission.COURSE_EDIT],
            }
        );

    const lesson = new Lesson({course});

    await this.lessonService.saveLesson(lesson);

    return true;
}
```

## How to write a rule

So a rule must validate our scope actions. For example we have a _news_ for the school or course. The news has a creator and target model.

> Attention: The target model must be populated

```ts
@Injectable()
export class NewsRule extends BasePermission<News> {
   constructor(private readonly schoolRule: SchoolRule, private readonly courseRule: CourseRule) {
         super();
   }

   // Is used to select the matching rule in the permission manager. Therefore we keep the condition to which case the rule
   // applies in the rule itself. In future we expect more complex conditions that could apply here.
   public isApplicable(user: User, entity: News): boolean {
      const isMatched = entity instanceof News;

      return isMatched;
   }

   public hasPermission(user: User, entity: News, context: AuthorizationContext): boolean {
      const { action, requiredPermissions } = context;

      // check required permissions passed by UC
      const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
      // check access to entity by property
      const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);
      let hasNewsPermission = false;

      if (action === Actions.read) {
         hasNewsPermission = this.parentPermission(user, entity, action);
      } else if (action === Actions.write) {
         hasNewsPermission = isCreator;
      }

      const result = hasPermission && hasNewsPermission;

      return result;
   }

   private parentPermission(user: User, entity: News, action: Actions): boolean {
      let hasParentPermission = false;
      // check by parentRule, because the schoolRule can contain extra logic
      // e.g. school is offline
      // or courseRule has complex permissions-resolves
      if (entity.targetModel === NewsTargetModel.School) {
         hasParentPermission = this.schoolRule.isAuthorized(user, entity.target, { action, requiredPermissions: [] });
      } else if (entity.targetModel === NewsTargetModel.Course) {
         hasParentPermission = this.courseRule.isAuthorized(user, entity.target, { action, requiredPermissions: [] });
      }

      return hasParentPermission;
   }
}

```
## Structure of the Authorization Components

### feathers-\* (legacy/deprecated)

It exists a adapter to call featherJS endpoints that solve authorizations.

> This service is only used in news and should not be used in any other place.
> We want to remove it completly.

### Authorization Module

The authorization module is the core of authorization. It collects all needed information and handles it behind a small interface. It exports the authoriation service that can be used in your use case over injections.

### Reference.loader

For situations where only the id and the domain object (string) type is known, it is possible to use the \*ByReferences methods.
They load the reference directly.

> Please keep in mind that it can have an impact on the performance if you use it wrongly.
> We keep it as a seperate method to avoid the usage in areas where the domain object should exist, because we see the risk that a developer could be tempted by the ease of only passing the id.

### shared/domain/rules/\*

The location to add new rules for entities / domain objects.

#### authorization-context.builder

We export a authorization context builder to prepare the parameter for the authorization service called "authorization context".
This is optional and not required.
But it enables us to easily change the structure of the authorization context without touching many different places.

### shared/domain/interface/\*

#### rolename.enum

An enum that holds all avaible role names.

#### permission.enum

A enum that holds all avaible permission names, however it's mixing all domain scopes atm.

## Working other Internal MicroServices

> Example FilesStorageService

We have the files storage service application that is a bundle of modules of this repository.
The application is startet as additional micro service.
It exists the need that the server application can call the file service.
We add a files storage client module to the server.
This module exports a service to communicate with the file service.

For communication it uses RabbitMQ.
Every operation must already be authorized in the UC of the server. There is no need to do it again in files storage service.
For this reason, we want the consumer of the RabbitMQ item to call the files storage service directly without authorization.

## Legacy Tech Stack FeatherJS Hooks

In featherJS all the authorization is done in hooks. Mostly before hooks and sometimes in after hooks.
Before and after means before, or after the database operation. For self writen services before, or after the call of the operation that should be executed.
They work similar to express middleware and bring their own request context.

It exists hooks that can be used for all http(s) calls, or for specific type based on CRUD operations.
Additionally it also exists the find operations that are a http(s) GET requests without the ID of a specific element.
Each function that adds to the hooks will be executed in order. Hooks for all methods first, then hooks for specific methodes.

Each hooks exists for a featherJS service that exposes directly the api endpoints directly. Additional it exists a global hook pattern for the whole application.

Example: <https://github.com/hpi-schul-cloud/schulcloud-server/blob/main/src/services/lesson/hooks/index.js#L232>

## Desired Changes in Future

Some small steps are done. But many next steps still exist.
They follow our general target.

### Next Steps

1. Implementation of Scope Based Permissions as generell solution instead of User Permissions that has only implicit school scopes for now.
   Remove populate logic in reference loader.
   Solve eager loading in coursegroups.
2. Introduce RabbitMQ. Splitting Service(logic) from UC, that we can call services over the consumer for internal communication between micro services of already authorized operations.
   Think about: Move hasPermission checks from rules to a more generic place.
   Remove jwt decorator and cleanup copy logic.
   Move authorization-context.builder to authorization module.
3. Remove inheritance from roles, because we want to write it explicitly into the collection documents.
   Moving role api endpoints to nestjs.
   Fixing of dashboard to handle roles in the right way as superhero.
4. Switching entity based authorization to domain objects based in steps.
5. Cleanup of feature flags from user permissions.
   Add existing feature flags to rules on places where it make sense.
6. Introduce instance as a scope to have an implemenation that handles all scopes/rules/permissions/user types in the same way.

### Refactoring Todos

- Task module should fully use authorization service.
- News module should start to use authorization service.

### Is Needed

- We can introduce a new layer called "policy" that combines different rules (any of them has their own matching strategy) for a single domain object between authorization and rule to reduce complexity in a single rule.
- We can switch to a behaviour where rules register themself at the authorization service than.
