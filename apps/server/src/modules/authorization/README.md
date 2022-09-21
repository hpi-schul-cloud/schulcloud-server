# NestJS Authorisation Module

## Summary what we want

Breaking down complexity and isolate it.
One place to solve a specific authorisation for a scope.
One implementation to handle all different situations in our system.
It should not possible to use it in wrong way.
> You should not need to understand the complet system, to know if something is authorised

We also want to avoid any specific code for modules, collections, or something else, in the authorisation module.

## Explanation of Terms

### permissions

The current state is that we have string based permissions.
For examples check "enum Permission".
It include at the moment all avaible permission and is not seperated by concerns and abstaction levels.
The permissions have different implicit scopes like instance, school, or named scope like team and course.

#### (feature flag permissions)

Some others are more feature flags and we want to seperate and move this in future.
Please let not confuse you.

### roles

We have a role collection, where each role has a permissions array that include string based permissions.
The roles can have in the "roles" field other roles to inherit permissions from other roles.
Some of this roles are more technical like user that is only used for inherit.
Some others are scope based with prefix name team*, or course*.

The "real" user roles by name are expert, student, teacher, administrator all are in a school scope and the superhero for the instance.

> In future we want to remove the inherit logic.
> We want to add scopes types to each role.
> Add more technical users for the instance scope.

### entities

The entities are the representation of a single document of the collection, or the type.
It is used for authorisation for now, but should switch to domain object soon.

### domain objects

They are not really introduced. They should mapped between the repository layer and the domain.
> In future they are the base for authorisation and the authorisation service do not know anything about entities anymore.

### scopes

Every what the system, or a user want to do, is executed in a scope.
A scope mean a area like the complet instance, the school, the course, the user it self and so on.
The scopes are highly bind to the real domain objects that we have in our domain.

#### scope actions

If you want to execute something in a scope you have some base actions like they are defined in CRUD operations.
The implicit action you ever need is you must have the authorisation to "read" the scope, otherwise it should not exist for you. :-)
For us we also define that the other possible action is to have write access to the scope.
It is a combination of delete, edit, create from CRUD side for us.
From our current perspective, we need no differents.
But we force that the implementation allow us to add some more.

#### scope permission

We have different situations where it is hard to say you can write/read to the domain scope.
We need the possibility to define differents for a single domain scope, or a single domain object it self.

> Let say the user can edit his own user account, but we want to disallow that they can change his age.
> But a administrator should have the authorisation to do it.

or a other case..
> The student has in one domain object limited permissions, but in a other domain object of the same type they can do a lot more.
> For example teams.

### user(s)

In authorisation scope it can be a system user, or a real user in our application.
Each user has a role with permissions in the scope of the domain object they want to interact.
Each authorisation required a user.

#### system users

We have console operations, or operations based on API_KEYS that are used between internal services for already authorised operations like copy and copy files in file service.
For this we want to use system user and roles with own permissions.
> They are not introduced for now

## Rules

Rules are the location that solve the authorisation for a domain object.
A rule has implement a check for what they should match.
They are called from the authorisation service.
They must be support our actions.

> We highly recoment that every single operation and check in the rule is implement as additional method to keep the logic clean and moveable

## User Permissions vs Scope Based Permissions

It exit for now as free permissions bind to a user without defined scope.
It exist also scope based permissions to solved the situation, that a user can have in different (scope)roles in different (domain)scopes. For example in teams where the student can have teamuser in one team, or teamadminstrator in a other.

> This is not what we want in future.
> For now, we must handle scope permissions, system user and user as seperated special cases and implementations.
> By implementation of user permissions as school scope and others as instance scope we can do it in one way for all situations

## How should you Authorised a Operation?

The only point is in use cases (UC). They must solve the authorisation and orchestrate the logic that should be done in services, or private methods.
You should never implement authorisations on service level, to avoid different authorisation steps.
By calling other micro service for already authorised operations please use API_KEYS.

> Not implemented but coming soon.

## How to use Authorisation Service

### Example 1 - ...

{{ add more }}

### Example 2 - ...

{{ add more }}

### Example 3 - ...

{{ add more }}

## Structure of the Authorisation Components

### feathers-* (legacy/deprecated)

It exist a adapter to call featherJS endpoints that solve authorisations.
> This service is only used in news and should not use on any other place.
> We want to remove it completly.

### Authorisation Module

The authorsation module is the core of authorisation. They collect all needed informations and handle it for you behind a small interface. It export the authoriation service that can be used in your use case over injections.

### Reference.loader

For situations where only the id and the domain object (string) type is knowen, it is possible to use the *ByReferences methodes.
They load the reference directly.
> Please keep in mind that it can be have impact of the performance if you use it wrongly.
> We do it as seperate method to avoid using in areas where the domain object should be exist, but it is easyer to only pass the id.

### shared/domain/rules/*

The location to add new rules for entities / domain objects.

#### permission-context.builder

We export a permission context builder for prepare the parameter for the authorisation service called "authorisation context".
This is optional and not required.
But it enable us to change easy the structure of the authorisation context without touching many different places.

### shared/domain/interface/*

#### rolename.enum

A enum that hold all avaible role names.

#### permission.enum

A enum that hold all avaible permission names. But mixing also all domain scopes atm.

## Working other Internal MicroServices

> Example FileService

{{ add more }}

## Legacy Tech Stack FeatherJS Hooks

{{ add more }}

## Desired Changes in Future

Some small steps are done. But many open steps still exist.
They follow our generell target

### Next Steps

1. implementation of Scope Based Permissions as generell solution instead of User Permissions that has only implicit school scopes for now
    Remove populate logic in reference loader
    Solve eager loading in coursegroups
2. introdurce system users and api-keys ..it is also needed to handle superhero permissions without overhead in future
    Think about hasPermission checks from rules to a generall place.
    Remove jwt decorator and cleanup copy logic.
    Move authorisation-context.builder to authorisation module.
3. roles without inheritens roles to solve permissions, we want to write it explizit into the collection
    Moving role api endpoints to nestjs.
    Fixing of dashboard to do handle roles in the right way as superhero.
4. switching entity based authorisation to domain objects based in steps
5. cleanup of feature flags from user permissions
    move exiting feature flags to rules on places where it make sense
6. introduce instance as scope to come to a one implemenation that handle all scopes/rules/permissions/user types in the same way

### Refactoring Todos

- Task module need full used authorisation service.
- News module need the introduce of the authorisation service.

### Is Needed

- we can introduce a new layer called "policy" that can combine different rules (any of them has his one matching strategy) for a single domain object between authorisation and rule
to reduce complexity in a single rule
- we can switch that rules register it self by the authorisation service