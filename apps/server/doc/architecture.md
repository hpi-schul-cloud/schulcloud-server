# Software Architecture

## Goals

Our architecture aims to achieve the following goals:

- Maintainability
  - it should be easy as possible to make changes that do not change the behaviour of the system (refactoring)
  - it should be easy to exchange entire components of the system, without impact on other components.
- Extendability
  - it should be easy to add new functionality to the system
- Agility
  - it should be easy to react to changing requirements during our development process
- Change Security
- it should be easy to determine the correctness of the system after making any changes

## Principles

In order to achieve these goals, we try to follow the principles detailed below.
These principles apply to all layers of our software, from lines of code and methods to modules and architectural layers.

- **Single Responsibility / Seperation of Concerns**
  - each piece of code should have a single layer of abstraction/detail
  - each piece of code should have a single reason to change
- **Open/Closed Principle**
  - design to be open to extension, but closed to modification
  - **Liskov Substitution**
  - the specific input may be more generic than its interface
  - the specific output may be more specialized than its interface
- **Interface Segregation**
  - multiple small interfaces are preferred over big interfaces
- **Dependency Inversion Principle**
  - always depend on interfaces, not implementations
  - higher level parts should not depend on lower level parts.
- **Keep It Simple (KISS)**
  - any piece of code should be simple and readable
  - any logic should be broken down to be trivial
  - beware of overenginiering and premature optimisation
- **You Aint Gonna Need It (YAGNI)**
  - keep decisions open for as long as possible
  - build only what you need to build, stay flexible for future requirements
- **Do Not Repeat Yourself (DRY)**
  - do not solve the same responsability or concern in multiple places
  - beware of things that look similar, but are not. for example, things that change for different reasons should not be combined, even if their code looks the same

## Server Layer Architecture

We generally distinguish three different layers in our server architecture: The API Layer, the Repository Layer, and the Domain Layer.

![Architecture Layers](../../assets/clean-architecture-layers.png)

Note that based on the Dependency Inversion Principle, the Domain Layer does not have any dependencies. Instead, both the API and Repository Layer depend on its abstractions.

### Domain Layer

The Domain Layer contains the business logic of the application. As mentioned above, it is not allowed to know about anything outside the domain layer itself.

![API Layer Dependencies](../../assets/domain-layer.png)

The entry point for any call to the domain layer is always a usecase (UC). A usecase is the description of a single business process within the domain.

A usecase **only does orchestration**

It might:

- make calls to repository or factory interfaces to get the business objects it needs (that are implemented in the repository layer)
- use business objects and domain services to perform actions or get data it needs
- make authorisation checks using the authorisation service
- make calls to services of other modules that are explicitly exported by that module
- make calls to a repository interface to persist changes it made (implemented in the repository layer)
- make calls to a different infra service interface defined in the domain layer (implemented by the repository layer) to perform actions that are implemented outside the domain (like sending an email to a user)
- use a mapper to transform its data into a DTO it wants to return

It should not:

- call other usecases
- perform any logic or data transformations itself
- do any error handling by itself
- make any decisions by itself
- do anything that is not strictly orchestration

As mentioned, the domain layer also contains a number of other objects, services, or type definitions that implement various business logic, as well as interfaces for things it cant implement itself.

### API Layer

The API Layer is responsible for providing the API that is exposed outside the system, and to map the various incoming requests into domain DTOs.

![API Layer Dependencies](../../assets/api-layer.png)

The params.dto and response.dto are used to automatically generate the API Documentation based on openAPI. The params.dto also contains information that is used for input validation.

The controller is responsible for sanitizing and authenticating incoming requests, and to map to and from the format that the domain usecase implementations expect. To this end, mappers are being used.

### Repository Layer

The Repository Layer is responsible for outgoing requests to external services. The most prominent example is accessing the database, but the same principles apply for sending emails or other interactions with external systems.

![Repository Layer Dependencies](../../assets/repository-layer.png)

In order to access these external systems without knowing them, the domain layer may define interfaces that describe how it would like to use external services in its own domain language. The repositories implement these interfaces, recieving and returning exclusively objects or dtos defined in the domain.

The datamodel itself is defined through Entities, that have to be mapped into domain objects before they can be returned to the domain layer. We use MikroORM to create, persist and load the entities and their references among each other.

## Horizontal Architecture

The application is split into different modules that implement different parts of our domain.

The exact split of modules is still work in progress, or left open as implementation detail. Some important considerations are:

- things with high cohesion and coupling should be in the same module
- things with low coupling should be in seperate modules
- the modules define an explicit public interface of usecases and types they expose to other modules
- no module should ever try to access a class of a different module that is not explicitly exported
- no injectable should ever be defined in more than one module
- a module should only export services to be used by other modules.
- a module that other modules might need to import, especially in another mikroservice, should not contain controllers.
