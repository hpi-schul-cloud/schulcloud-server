'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">schulcloud-server documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                        <li class="link">
                            <a href="todo.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>TODO
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#additional-pages"'
                            : 'data-bs-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/nestjs-application.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#additional-page-6c9c42e30cd6b8d60fdff2ecc91e88cd862077ada8a1f35cac276997dbfd2ac96efe1207f4762c4df4900fb7f5417aa723e20c1b8800a02c8405f9d1a29d9196"' : 'data-bs-target="#xs-additional-page-6c9c42e30cd6b8d60fdff2ecc91e88cd862077ada8a1f35cac276997dbfd2ac96efe1207f4762c4df4900fb7f5417aa723e20c1b8800a02c8405f9d1a29d9196"' }>
                                                <span class="link-name">NestJS Application</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-6c9c42e30cd6b8d60fdff2ecc91e88cd862077ada8a1f35cac276997dbfd2ac96efe1207f4762c4df4900fb7f5417aa723e20c1b8800a02c8405f9d1a29d9196"' : 'id="xs-additional-page-6c9c42e30cd6b8d60fdff2ecc91e88cd862077ada8a1f35cac276997dbfd2ac96efe1207f4762c4df4900fb7f5417aa723e20c1b8800a02c8405f9d1a29d9196"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/software-architecture.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Software Architecture</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/file-structure.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">File Structure</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/api-design.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">API Design</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/logging.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Logging</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/exception-handling.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Exception Handling</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/domain-object-validation.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Domain Object Validation</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/testing.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Testing</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/vscode.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">VSCode</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/git.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Git</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/keycloak.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Keycloak</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/rocket.chat.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Rocket.Chat</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/configuration.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Configuration</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/authorisation.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Authorisation</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/code-style.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Code Style</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/nestjs-application/s3clientmodule.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">S3ClientModule</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AccountApiModule.html" data-type="entity-link" >AccountApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' : 'data-bs-target="#xs-controllers-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' :
                                            'id="xs-controllers-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' }>
                                            <li class="link">
                                                <a href="controllers/AccountController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' : 'data-bs-target="#xs-injectables-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' :
                                        'id="xs-injectables-links-module-AccountApiModule-58f722267a6dacf7f981a662a66da295d036fe5deb068f4233493f39d593b16c255f20eedde2156c6e74de70cebe48e1d0d9d3368f21ef45061b6d8a30c366bf"' }>
                                        <li class="link">
                                            <a href="injectables/AccountUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PermissionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AccountModule.html" data-type="entity-link" >AccountModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AccountModule-fb00e0b204c21434fc3bcc86a3a8656f2f8201535e0702169f9c804fa299d9f88e36e2bf6b7f0d04f9529702eb85b5a2b6e64fc98769d3ce7986d062cd72880c"' : 'data-bs-target="#xs-injectables-links-module-AccountModule-fb00e0b204c21434fc3bcc86a3a8656f2f8201535e0702169f9c804fa299d9f88e36e2bf6b7f0d04f9529702eb85b5a2b6e64fc98769d3ce7986d062cd72880c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AccountModule-fb00e0b204c21434fc3bcc86a3a8656f2f8201535e0702169f9c804fa299d9f88e36e2bf6b7f0d04f9529702eb85b5a2b6e64fc98769d3ce7986d062cd72880c"' :
                                        'id="xs-injectables-links-module-AccountModule-fb00e0b204c21434fc3bcc86a3a8656f2f8201535e0702169f9c804fa299d9f88e36e2bf6b7f0d04f9529702eb85b5a2b6e64fc98769d3ce7986d062cd72880c"' }>
                                        <li class="link">
                                            <a href="injectables/AccountLookupService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountLookupService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AccountRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AccountService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AccountServiceDb.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountServiceDb</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AccountServiceIdm.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountServiceIdm</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AccountValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccountValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySystemRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySystemRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PermissionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdminApiServerModule.html" data-type="entity-link" >AdminApiServerModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AdminApiServerTestModule.html" data-type="entity-link" >AdminApiServerTestModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AntivirusModule.html" data-type="entity-link" >AntivirusModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AuthenticationApiModule.html" data-type="entity-link" >AuthenticationApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' : 'data-bs-target="#xs-controllers-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' :
                                            'id="xs-controllers-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' }>
                                            <li class="link">
                                                <a href="controllers/LoginController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' : 'data-bs-target="#xs-injectables-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' :
                                        'id="xs-injectables-links-module-AuthenticationApiModule-adbbdaac7a8d8139993fcee36414a17a56fbc160313bdd8ff744fc58920a7954db11ed518f3566f5365aa75932b15d23b68df7a2ae3467095e51a41ca2b77247"' }>
                                        <li class="link">
                                            <a href="injectables/LoginUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthenticationModule.html" data-type="entity-link" >AuthenticationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthenticationModule-b23ef3b642d58464a86c38cca79893bf5398e8c02a34f33a5c71b46189011ebb29af274416d4d5fb0c334532cddbaca7d1485e383894233c9fec9924645d939a"' : 'data-bs-target="#xs-injectables-links-module-AuthenticationModule-b23ef3b642d58464a86c38cca79893bf5398e8c02a34f33a5c71b46189011ebb29af274416d4d5fb0c334532cddbaca7d1485e383894233c9fec9924645d939a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthenticationModule-b23ef3b642d58464a86c38cca79893bf5398e8c02a34f33a5c71b46189011ebb29af274416d4d5fb0c334532cddbaca7d1485e383894233c9fec9924645d939a"' :
                                        'id="xs-injectables-links-module-AuthenticationModule-b23ef3b642d58464a86c38cca79893bf5398e8c02a34f33a5c71b46189011ebb29af274416d4d5fb0c334532cddbaca7d1485e383894233c9fec9924645d939a"' }>
                                        <li class="link">
                                            <a href="injectables/AuthenticationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthenticationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtValidationAdapter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtValidationAdapter</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LdapService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LdapService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LdapStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LdapStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySystemRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySystemRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LocalStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocalStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Oauth2Strategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Oauth2Strategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/XApiKeyStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >XApiKeyStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthorizationModule.html" data-type="entity-link" >AuthorizationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthorizationModule-6a5377d50e60f871b3594916e2e6b46bf24342a35277b2da572e85a7b334bc37f3f3a3c427ed670dcdf9ce636e1a3a13379c26597f2054f20a137a1c338bdc4f"' : 'data-bs-target="#xs-injectables-links-module-AuthorizationModule-6a5377d50e60f871b3594916e2e6b46bf24342a35277b2da572e85a7b334bc37f3f3a3c427ed670dcdf9ce636e1a3a13379c26597f2054f20a137a1c338bdc4f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthorizationModule-6a5377d50e60f871b3594916e2e6b46bf24342a35277b2da572e85a7b334bc37f3f3a3c427ed670dcdf9ce636e1a3a13379c26597f2054f20a137a1c338bdc4f"' :
                                        'id="xs-injectables-links-module-AuthorizationModule-6a5377d50e60f871b3594916e2e6b46bf24342a35277b2da572e85a7b334bc37f3f3a3c427ed670dcdf9ce636e1a3a13379c26597f2054f20a137a1c338bdc4f"' }>
                                        <li class="link">
                                            <a href="injectables/AuthorizationHelper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorizationHelper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthorizationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorizationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardDoRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardDoRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseGroupRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseGroupRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeathersAuthProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeathersAuthProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeathersAuthorizationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeathersAuthorizationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GroupRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RuleManager.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RuleManager</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolSystemOptionsRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSystemOptionsRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SystemRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserLoginMigrationRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationRule</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRule.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRule</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthorizationReferenceModule.html" data-type="entity-link" >AuthorizationReferenceModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthorizationReferenceModule-b6382ba99450c60969f9f9ab4507a0cbed1b00c8ecd6999817a4e9245ecbe1edf32502bfaf7f0767dc52968c160496db36e702c46f73fb6eccb5b51ae779c53e"' : 'data-bs-target="#xs-injectables-links-module-AuthorizationReferenceModule-b6382ba99450c60969f9f9ab4507a0cbed1b00c8ecd6999817a4e9245ecbe1edf32502bfaf7f0767dc52968c160496db36e702c46f73fb6eccb5b51ae779c53e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthorizationReferenceModule-b6382ba99450c60969f9f9ab4507a0cbed1b00c8ecd6999817a4e9245ecbe1edf32502bfaf7f0767dc52968c160496db36e702c46f73fb6eccb5b51ae779c53e"' :
                                        'id="xs-injectables-links-module-AuthorizationReferenceModule-b6382ba99450c60969f9f9ab4507a0cbed1b00c8ecd6999817a4e9245ecbe1edf32502bfaf7f0767dc52968c160496db36e702c46f73fb6eccb5b51ae779c53e"' }>
                                        <li class="link">
                                            <a href="injectables/AuthorizationHelper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorizationHelper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AuthorizationReferenceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthorizationReferenceService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseGroupRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseGroupRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ReferenceLoader.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReferenceLoader</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamsRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/BoardApiModule.html" data-type="entity-link" >BoardApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' : 'data-bs-target="#xs-controllers-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' :
                                            'id="xs-controllers-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' }>
                                            <li class="link">
                                                <a href="controllers/BoardController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/BoardSubmissionController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardSubmissionController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/CardController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CardController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ColumnController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ElementController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ElementController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' : 'data-bs-target="#xs-injectables-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' :
                                        'id="xs-injectables-links-module-BoardApiModule-e0aebd2891ca900462fdcb04972ddae4d91f095157e743c408948993d9c7e0d14a3e83b881c4547a0aab2a44f8b62c2b5df38a9439b71ef519f7b7583df114b6"' }>
                                        <li class="link">
                                            <a href="injectables/BoardUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CardUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CardUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ColumnUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ElementUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ElementUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionItemUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionItemUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/BoardModule.html" data-type="entity-link" >BoardModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-BoardModule-80a7be8018c1707faf94782ecc07b25c2b35573ee646f728f5622eb96707969515dee6caa918e2a26f1457e682584252c4cd8147a0c5ef2ccf935630217f903e"' : 'data-bs-target="#xs-injectables-links-module-BoardModule-80a7be8018c1707faf94782ecc07b25c2b35573ee646f728f5622eb96707969515dee6caa918e2a26f1457e682584252c4cd8147a0c5ef2ccf935630217f903e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-BoardModule-80a7be8018c1707faf94782ecc07b25c2b35573ee646f728f5622eb96707969515dee6caa918e2a26f1457e682584252c4cd8147a0c5ef2ccf935630217f903e"' :
                                        'id="xs-injectables-links-module-BoardModule-80a7be8018c1707faf94782ecc07b25c2b35573ee646f728f5622eb96707969515dee6caa918e2a26f1457e682584252c4cd8147a0c5ef2ccf935630217f903e"' }>
                                        <li class="link">
                                            <a href="injectables/BoardDoAuthorizableService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardDoAuthorizableService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardDoCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardDoCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardDoRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardDoRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardDoService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardDoService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardNodeRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardNodeRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CardService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CardService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ColumnBoardCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnBoardCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ColumnBoardService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnBoardService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ColumnService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContentElementFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContentElementFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContentElementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContentElementService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RecursiveDeleteVisitor.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RecursiveDeleteVisitor</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolSpecificFileCopyServiceFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSpecificFileCopyServiceFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionItemService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionItemService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CacheWrapperModule.html" data-type="entity-link" >CacheWrapperModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CacheWrapperModule-eca37a7be7cd971dd19125be3d7f413d784698bd7c7e5baf48dabac834eb2af61f5c2854457ba877271238c0bf66cf34dceccdf807610d2a608e0807b71f5bd0"' : 'data-bs-target="#xs-injectables-links-module-CacheWrapperModule-eca37a7be7cd971dd19125be3d7f413d784698bd7c7e5baf48dabac834eb2af61f5c2854457ba877271238c0bf66cf34dceccdf807610d2a608e0807b71f5bd0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CacheWrapperModule-eca37a7be7cd971dd19125be3d7f413d784698bd7c7e5baf48dabac834eb2af61f5c2854457ba877271238c0bf66cf34dceccdf807610d2a608e0807b71f5bd0"' :
                                        'id="xs-injectables-links-module-CacheWrapperModule-eca37a7be7cd971dd19125be3d7f413d784698bd7c7e5baf48dabac834eb2af61f5c2854457ba877271238c0bf66cf34dceccdf807610d2a608e0807b71f5bd0"' }>
                                        <li class="link">
                                            <a href="injectables/CacheService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CacheService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CalendarModule.html" data-type="entity-link" >CalendarModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CalendarModule-6ac63e99aa5b7e86b0a15a77b4885311b350764e3d81688cdc8d945979cf2c754625e39ecbc7d387f929804601196d8f3538f6b2cd2bb1fd944542ff1891b9dd"' : 'data-bs-target="#xs-injectables-links-module-CalendarModule-6ac63e99aa5b7e86b0a15a77b4885311b350764e3d81688cdc8d945979cf2c754625e39ecbc7d387f929804601196d8f3538f6b2cd2bb1fd944542ff1891b9dd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CalendarModule-6ac63e99aa5b7e86b0a15a77b4885311b350764e3d81688cdc8d945979cf2c754625e39ecbc7d387f929804601196d8f3538f6b2cd2bb1fd944542ff1891b9dd"' :
                                        'id="xs-injectables-links-module-CalendarModule-6ac63e99aa5b7e86b0a15a77b4885311b350764e3d81688cdc8d945979cf2c754625e39ecbc7d387f929804601196d8f3538f6b2cd2bb1fd944542ff1891b9dd"' }>
                                        <li class="link">
                                            <a href="injectables/CalendarMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CalendarMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CalendarService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CalendarService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ClassModule.html" data-type="entity-link" >ClassModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ClassModule-728dda59920c18b127c3eaf688dd37315256dec469d2fba9accb156a979e3cc05bb6c5475cdcbcd35d7ad8fa38853283ec8771c6ff17420da0ddc5f85ac6d385"' : 'data-bs-target="#xs-injectables-links-module-ClassModule-728dda59920c18b127c3eaf688dd37315256dec469d2fba9accb156a979e3cc05bb6c5475cdcbcd35d7ad8fa38853283ec8771c6ff17420da0ddc5f85ac6d385"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ClassModule-728dda59920c18b127c3eaf688dd37315256dec469d2fba9accb156a979e3cc05bb6c5475cdcbcd35d7ad8fa38853283ec8771c6ff17420da0ddc5f85ac6d385"' :
                                        'id="xs-injectables-links-module-ClassModule-728dda59920c18b127c3eaf688dd37315256dec469d2fba9accb156a979e3cc05bb6c5475cdcbcd35d7ad8fa38853283ec8771c6ff17420da0ddc5f85ac6d385"' }>
                                        <li class="link">
                                            <a href="injectables/ClassService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ClassService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ClassesRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ClassesRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CollaborativeStorageAdapterModule.html" data-type="entity-link" >CollaborativeStorageAdapterModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CollaborativeStorageAdapterModule-e9dafec1023e89cfd05a0715d8eafb31bbcb3e248a289a44bfba4ca8df8683afe6532b6f37746aac1613cf9760b96e91a3f4f7723ac4f58ce7b9bf48b645684c"' : 'data-bs-target="#xs-injectables-links-module-CollaborativeStorageAdapterModule-e9dafec1023e89cfd05a0715d8eafb31bbcb3e248a289a44bfba4ca8df8683afe6532b6f37746aac1613cf9760b96e91a3f4f7723ac4f58ce7b9bf48b645684c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CollaborativeStorageAdapterModule-e9dafec1023e89cfd05a0715d8eafb31bbcb3e248a289a44bfba4ca8df8683afe6532b6f37746aac1613cf9760b96e91a3f4f7723ac4f58ce7b9bf48b645684c"' :
                                        'id="xs-injectables-links-module-CollaborativeStorageAdapterModule-e9dafec1023e89cfd05a0715d8eafb31bbcb3e248a289a44bfba4ca8df8683afe6532b6f37746aac1613cf9760b96e91a3f4f7723ac4f58ce7b9bf48b645684c"' }>
                                        <li class="link">
                                            <a href="injectables/CollaborativeStorageAdapter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollaborativeStorageAdapter</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CollaborativeStorageAdapterMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollaborativeStorageAdapterMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LtiToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LtiToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NextcloudClient.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NextcloudClient</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NextcloudStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NextcloudStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CollaborativeStorageModule.html" data-type="entity-link" >CollaborativeStorageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' : 'data-bs-target="#xs-controllers-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' :
                                            'id="xs-controllers-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' }>
                                            <li class="link">
                                                <a href="controllers/CollaborativeStorageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollaborativeStorageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' : 'data-bs-target="#xs-injectables-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' :
                                        'id="xs-injectables-links-module-CollaborativeStorageModule-84222649bf936aa2bd097e48c63f7d5ebc39d80e26e7acb683203ba86e8627b7aa68f0c16a3a4724172e80f5e2d57df67050888b7f0f5eaa054fbfae9c0d4431"' }>
                                        <li class="link">
                                            <a href="injectables/CollaborativeStorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollaborativeStorageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CollaborativeStorageUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollaborativeStorageUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamPermissionsMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamPermissionsMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamsRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CommonToolModule.html" data-type="entity-link" >CommonToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CommonToolModule-e11285a3f641dc89e42d862c356483ee4b000b4bc446db41cfd1b9fcd2f5d28857018026af2f21434cd8a6e44c6266b70fc3e4b696de92ee4610adfa47653284"' : 'data-bs-target="#xs-injectables-links-module-CommonToolModule-e11285a3f641dc89e42d862c356483ee4b000b4bc446db41cfd1b9fcd2f5d28857018026af2f21434cd8a6e44c6266b70fc3e4b696de92ee4610adfa47653284"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CommonToolModule-e11285a3f641dc89e42d862c356483ee4b000b4bc446db41cfd1b9fcd2f5d28857018026af2f21434cd8a6e44c6266b70fc3e4b696de92ee4610adfa47653284"' :
                                        'id="xs-injectables-links-module-CommonToolModule-e11285a3f641dc89e42d862c356483ee4b000b4bc446db41cfd1b9fcd2f5d28857018026af2f21434cd8a6e44c6266b70fc3e4b696de92ee4610adfa47653284"' }>
                                        <li class="link">
                                            <a href="injectables/CommonToolMetadataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonToolMetadataService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CommonToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonToolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CommonToolValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonToolValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ConsoleWriterModule.html" data-type="entity-link" >ConsoleWriterModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ConsoleWriterModule-fde97a53bb9fb961eae116b90895a61fa3a1626cbd313c46afd0e7d39bb580eabc8b3829ec9b7f49c6cd7d2d2895f2c805b14da32cd5d58c6ca7ddeed2453cff"' : 'data-bs-target="#xs-injectables-links-module-ConsoleWriterModule-fde97a53bb9fb961eae116b90895a61fa3a1626cbd313c46afd0e7d39bb580eabc8b3829ec9b7f49c6cd7d2d2895f2c805b14da32cd5d58c6ca7ddeed2453cff"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ConsoleWriterModule-fde97a53bb9fb961eae116b90895a61fa3a1626cbd313c46afd0e7d39bb580eabc8b3829ec9b7f49c6cd7d2d2895f2c805b14da32cd5d58c6ca7ddeed2453cff"' :
                                        'id="xs-injectables-links-module-ConsoleWriterModule-fde97a53bb9fb961eae116b90895a61fa3a1626cbd313c46afd0e7d39bb580eabc8b3829ec9b7f49c6cd7d2d2895f2c805b14da32cd5d58c6ca7ddeed2453cff"' }>
                                        <li class="link">
                                            <a href="injectables/ConsoleWriterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConsoleWriterService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ContextExternalToolModule.html" data-type="entity-link" >ContextExternalToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ContextExternalToolModule-41126e48dc9093ee4ffb45063f00f4a19b64e12a5e88f889ae34b9eba0c569abb61c596f93368ab5456b96248d1dcaa2fe6c6a1c9840c3bfcfd34f50f011b4dd"' : 'data-bs-target="#xs-injectables-links-module-ContextExternalToolModule-41126e48dc9093ee4ffb45063f00f4a19b64e12a5e88f889ae34b9eba0c569abb61c596f93368ab5456b96248d1dcaa2fe6c6a1c9840c3bfcfd34f50f011b4dd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ContextExternalToolModule-41126e48dc9093ee4ffb45063f00f4a19b64e12a5e88f889ae34b9eba0c569abb61c596f93368ab5456b96248d1dcaa2fe6c6a1c9840c3bfcfd34f50f011b4dd"' :
                                        'id="xs-injectables-links-module-ContextExternalToolModule-41126e48dc9093ee4ffb45063f00f4a19b64e12a5e88f889ae34b9eba0c569abb61c596f93368ab5456b96248d1dcaa2fe6c6a1c9840c3bfcfd34f50f011b4dd"' }>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolAuthorizableService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolAuthorizableService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolReferenceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolReferenceService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolVersionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolVersionService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CopyHelperModule.html" data-type="entity-link" >CopyHelperModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CopyHelperModule-ec54b8d9f36d91d2d7e3716dcc95544311a9afe4b60b53d8a27e7e7be6ff43be43ad7ec38702779348dd1898854776bd47a984a42d73386a6417da8d08055d98"' : 'data-bs-target="#xs-injectables-links-module-CopyHelperModule-ec54b8d9f36d91d2d7e3716dcc95544311a9afe4b60b53d8a27e7e7be6ff43be43ad7ec38702779348dd1898854776bd47a984a42d73386a6417da8d08055d98"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CopyHelperModule-ec54b8d9f36d91d2d7e3716dcc95544311a9afe4b60b53d8a27e7e7be6ff43be43ad7ec38702779348dd1898854776bd47a984a42d73386a6417da8d08055d98"' :
                                        'id="xs-injectables-links-module-CopyHelperModule-ec54b8d9f36d91d2d7e3716dcc95544311a9afe4b60b53d8a27e7e7be6ff43be43ad7ec38702779348dd1898854776bd47a984a42d73386a6417da8d08055d98"' }>
                                        <li class="link">
                                            <a href="injectables/CopyHelperService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CopyHelperService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link" >CoreModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseManagementModule.html" data-type="entity-link" >DatabaseManagementModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DatabaseManagementModule-c061b93d7fb22c1eb1030ec009f71ff6f52f24ba69337c185eebad6ee79fee2f4df0f9537f7323e53995c61c6acf2825d27cfa726b071ed359f14a0964b74f76"' : 'data-bs-target="#xs-injectables-links-module-DatabaseManagementModule-c061b93d7fb22c1eb1030ec009f71ff6f52f24ba69337c185eebad6ee79fee2f4df0f9537f7323e53995c61c6acf2825d27cfa726b071ed359f14a0964b74f76"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DatabaseManagementModule-c061b93d7fb22c1eb1030ec009f71ff6f52f24ba69337c185eebad6ee79fee2f4df0f9537f7323e53995c61c6acf2825d27cfa726b071ed359f14a0964b74f76"' :
                                        'id="xs-injectables-links-module-DatabaseManagementModule-c061b93d7fb22c1eb1030ec009f71ff6f52f24ba69337c185eebad6ee79fee2f4df0f9537f7323e53995c61c6acf2825d27cfa726b071ed359f14a0964b74f76"' }>
                                        <li class="link">
                                            <a href="injectables/DatabaseManagementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseManagementService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeletionApiModule.html" data-type="entity-link" >DeletionApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' : 'data-bs-target="#xs-controllers-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' :
                                            'id="xs-controllers-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' }>
                                            <li class="link">
                                                <a href="controllers/DeletionExecutionsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionExecutionsController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/DeletionRequestsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionRequestsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' : 'data-bs-target="#xs-injectables-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' :
                                        'id="xs-injectables-links-module-DeletionApiModule-26712b33aebfbd91be37be61c5d750569043a0a486593fe6f0467afe714742b20476c346f23347184d905c74b997b7c870ebd8bf09dea4536a96c67bc5ca966e"' }>
                                        <li class="link">
                                            <a href="injectables/DeletionRequestUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionRequestUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeletionConsoleModule.html" data-type="entity-link" >DeletionConsoleModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DeletionConsoleModule-3b263a0ebeb14485112045603ca67e9c7709545a1e2eaf682efb648c0a5b513d5a9c32f6e7fafcb7dff59d86f42b505ca677be692aee1198c8d9fb3157802acb"' : 'data-bs-target="#xs-injectables-links-module-DeletionConsoleModule-3b263a0ebeb14485112045603ca67e9c7709545a1e2eaf682efb648c0a5b513d5a9c32f6e7fafcb7dff59d86f42b505ca677be692aee1198c8d9fb3157802acb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DeletionConsoleModule-3b263a0ebeb14485112045603ca67e9c7709545a1e2eaf682efb648c0a5b513d5a9c32f6e7fafcb7dff59d86f42b505ca677be692aee1198c8d9fb3157802acb"' :
                                        'id="xs-injectables-links-module-DeletionConsoleModule-3b263a0ebeb14485112045603ca67e9c7709545a1e2eaf682efb648c0a5b513d5a9c32f6e7fafcb7dff59d86f42b505ca677be692aee1198c8d9fb3157802acb"' }>
                                        <li class="link">
                                            <a href="injectables/BatchDeletionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BatchDeletionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BatchDeletionUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BatchDeletionUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DeletionClient.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionClient</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeletionModule.html" data-type="entity-link" >DeletionModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DeletionModule-b1ca32ba5ed7143a660ce2e45ba7a6f95e7c609028ccf23ac2d3d972ef6a55cb275e417f9fe180788dbed4d2e089b0b86799ceb5a9c2fb466bea9190a54bc306"' : 'data-bs-target="#xs-injectables-links-module-DeletionModule-b1ca32ba5ed7143a660ce2e45ba7a6f95e7c609028ccf23ac2d3d972ef6a55cb275e417f9fe180788dbed4d2e089b0b86799ceb5a9c2fb466bea9190a54bc306"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DeletionModule-b1ca32ba5ed7143a660ce2e45ba7a6f95e7c609028ccf23ac2d3d972ef6a55cb275e417f9fe180788dbed4d2e089b0b86799ceb5a9c2fb466bea9190a54bc306"' :
                                        'id="xs-injectables-links-module-DeletionModule-b1ca32ba5ed7143a660ce2e45ba7a6f95e7c609028ccf23ac2d3d972ef6a55cb275e417f9fe180788dbed4d2e089b0b86799ceb5a9c2fb466bea9190a54bc306"' }>
                                        <li class="link">
                                            <a href="injectables/DeletionLogRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionLogRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DeletionLogService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionLogService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DeletionRequestRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionRequestRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DeletionRequestService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeletionRequestService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EncryptionModule.html" data-type="entity-link" >EncryptionModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ErrorModule.html" data-type="entity-link" >ErrorModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ExternalToolModule.html" data-type="entity-link" >ExternalToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ExternalToolModule-39d1e8c3d74e1e904cef3384ef26ea484f825df97f39a9e0eb8f512b889516c03e07e0df091d4434b6372f9997af1a1b1845949a8eea2b14f47473c6868201cd"' : 'data-bs-target="#xs-injectables-links-module-ExternalToolModule-39d1e8c3d74e1e904cef3384ef26ea484f825df97f39a9e0eb8f512b889516c03e07e0df091d4434b6372f9997af1a1b1845949a8eea2b14f47473c6868201cd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ExternalToolModule-39d1e8c3d74e1e904cef3384ef26ea484f825df97f39a9e0eb8f512b889516c03e07e0df091d4434b6372f9997af1a1b1845949a8eea2b14f47473c6868201cd"' :
                                        'id="xs-injectables-links-module-ExternalToolModule-39d1e8c3d74e1e904cef3384ef26ea484f825df97f39a9e0eb8f512b889516c03e07e0df091d4434b6372f9997af1a1b1845949a8eea2b14f47473c6868201cd"' }>
                                        <li class="link">
                                            <a href="injectables/DatasheetPdfService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatasheetPdfService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolConfigurationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolParameterValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolParameterValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolServiceMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolServiceMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolVersionIncrementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolVersionIncrementService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FeathersModule.html" data-type="entity-link" >FeathersModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FeathersModule-a01f88efe2cd09af000654f38947283900ddac7015c58d6a0c1d84ff7e78481e550d90fd231dd162472ced92d905c2b449829eb5bd39bdda0620dd285d9c5a9a"' : 'data-bs-target="#xs-injectables-links-module-FeathersModule-a01f88efe2cd09af000654f38947283900ddac7015c58d6a0c1d84ff7e78481e550d90fd231dd162472ced92d905c2b449829eb5bd39bdda0620dd285d9c5a9a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FeathersModule-a01f88efe2cd09af000654f38947283900ddac7015c58d6a0c1d84ff7e78481e550d90fd231dd162472ced92d905c2b449829eb5bd39bdda0620dd285d9c5a9a"' :
                                        'id="xs-injectables-links-module-FeathersModule-a01f88efe2cd09af000654f38947283900ddac7015c58d6a0c1d84ff7e78481e550d90fd231dd162472ced92d905c2b449829eb5bd39bdda0620dd285d9c5a9a"' }>
                                        <li class="link">
                                            <a href="injectables/FeathersServiceProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeathersServiceProvider</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesModule.html" data-type="entity-link" >FilesModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FilesModule-706cb87236a00a18c1ef2943bed1f92ce56d5631548680915d9b826e389d04f2f74d3dad8c1d2e97b8fee26bfadf4c1042fb59c74436a03b2835551523d5eccb"' : 'data-bs-target="#xs-injectables-links-module-FilesModule-706cb87236a00a18c1ef2943bed1f92ce56d5631548680915d9b826e389d04f2f74d3dad8c1d2e97b8fee26bfadf4c1042fb59c74436a03b2835551523d5eccb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FilesModule-706cb87236a00a18c1ef2943bed1f92ce56d5631548680915d9b826e389d04f2f74d3dad8c1d2e97b8fee26bfadf4c1042fb59c74436a03b2835551523d5eccb"' :
                                        'id="xs-injectables-links-module-FilesModule-706cb87236a00a18c1ef2943bed1f92ce56d5631548680915d9b826e389d04f2f74d3dad8c1d2e97b8fee26bfadf4c1042fb59c74436a03b2835551523d5eccb"' }>
                                        <li class="link">
                                            <a href="injectables/DeleteFilesUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeleteFilesUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilesRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/StorageProviderRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StorageProviderRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesStorageAMQPModule.html" data-type="entity-link" >FilesStorageAMQPModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FilesStorageAMQPModule-2377b1f5b5990d641db5fdb6cd24e03c10a9b00d0ae38ce7ef886911797b189cd8198d3985b79d4062ff030b85016c67bbac30f22bec3ada717e616ca52695c1"' : 'data-bs-target="#xs-injectables-links-module-FilesStorageAMQPModule-2377b1f5b5990d641db5fdb6cd24e03c10a9b00d0ae38ce7ef886911797b189cd8198d3985b79d4062ff030b85016c67bbac30f22bec3ada717e616ca52695c1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FilesStorageAMQPModule-2377b1f5b5990d641db5fdb6cd24e03c10a9b00d0ae38ce7ef886911797b189cd8198d3985b79d4062ff030b85016c67bbac30f22bec3ada717e616ca52695c1"' :
                                        'id="xs-injectables-links-module-FilesStorageAMQPModule-2377b1f5b5990d641db5fdb6cd24e03c10a9b00d0ae38ce7ef886911797b189cd8198d3985b79d4062ff030b85016c67bbac30f22bec3ada717e616ca52695c1"' }>
                                        <li class="link">
                                            <a href="injectables/FilesStorageConsumer.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageConsumer</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesStorageApiModule.html" data-type="entity-link" >FilesStorageApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' : 'data-bs-target="#xs-controllers-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' :
                                            'id="xs-controllers-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' }>
                                            <li class="link">
                                                <a href="controllers/FileSecurityController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileSecurityController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/FilesStorageController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' : 'data-bs-target="#xs-injectables-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' :
                                        'id="xs-injectables-links-module-FilesStorageApiModule-84aaa4651fbe9041debbe57d39b964c559049bee3c5fb5d3893d92e24b84472ad9a0922f8bc2c0123393c93f811c49822019183006c6703a4e81817acae540b6"' }>
                                        <li class="link">
                                            <a href="injectables/FilesStorageUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageUC</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesStorageClientModule.html" data-type="entity-link" >FilesStorageClientModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FilesStorageClientModule-ed6e7f52e5aaf96da01f0ac4e304c7f2a3ddb4ae8297ac29e5bc0a05872d98dd248a5f0147e7af46d8e597aba2496e6c447c12f23c5bfe696f7f694d98967a65"' : 'data-bs-target="#xs-injectables-links-module-FilesStorageClientModule-ed6e7f52e5aaf96da01f0ac4e304c7f2a3ddb4ae8297ac29e5bc0a05872d98dd248a5f0147e7af46d8e597aba2496e6c447c12f23c5bfe696f7f694d98967a65"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FilesStorageClientModule-ed6e7f52e5aaf96da01f0ac4e304c7f2a3ddb4ae8297ac29e5bc0a05872d98dd248a5f0147e7af46d8e597aba2496e6c447c12f23c5bfe696f7f694d98967a65"' :
                                        'id="xs-injectables-links-module-FilesStorageClientModule-ed6e7f52e5aaf96da01f0ac4e304c7f2a3ddb4ae8297ac29e5bc0a05872d98dd248a5f0147e7af46d8e597aba2496e6c447c12f23c5bfe696f7f694d98967a65"' }>
                                        <li class="link">
                                            <a href="injectables/CopyFilesService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CopyFilesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilesStorageClientAdapterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageClientAdapterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilesStorageProducer.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageProducer</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesStorageModule.html" data-type="entity-link" >FilesStorageModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FilesStorageModule-ed85aa274574bc5cd33d6acdb12f6c9c46f74dcd421ac5462053d9197533ecd670d2306937e196089060f96a7ef53c47f09e6d5e95164c6c63cd1c0c7d4cca7b"' : 'data-bs-target="#xs-injectables-links-module-FilesStorageModule-ed85aa274574bc5cd33d6acdb12f6c9c46f74dcd421ac5462053d9197533ecd670d2306937e196089060f96a7ef53c47f09e6d5e95164c6c63cd1c0c7d4cca7b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FilesStorageModule-ed85aa274574bc5cd33d6acdb12f6c9c46f74dcd421ac5462053d9197533ecd670d2306937e196089060f96a7ef53c47f09e6d5e95164c6c63cd1c0c7d4cca7b"' :
                                        'id="xs-injectables-links-module-FilesStorageModule-ed85aa274574bc5cd33d6acdb12f6c9c46f74dcd421ac5462053d9197533ecd670d2306937e196089060f96a7ef53c47f09e6d5e95164c6c63cd1c0c7d4cca7b"' }>
                                        <li class="link">
                                            <a href="injectables/FileRecordRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileRecordRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FilesStorageService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FilesStorageService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PreviewService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PreviewService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FilesStorageTestModule.html" data-type="entity-link" >FilesStorageTestModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FileSystemModule.html" data-type="entity-link" >FileSystemModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FileSystemModule-ae142627e864d1e4e80b5d3b89718a3b1972140905e47e98979921d2e55e7770ca712a81c31830c66e9932f6244de5d5954232e4d44722f0da77594300c0c823"' : 'data-bs-target="#xs-injectables-links-module-FileSystemModule-ae142627e864d1e4e80b5d3b89718a3b1972140905e47e98979921d2e55e7770ca712a81c31830c66e9932f6244de5d5954232e4d44722f0da77594300c0c823"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FileSystemModule-ae142627e864d1e4e80b5d3b89718a3b1972140905e47e98979921d2e55e7770ca712a81c31830c66e9932f6244de5d5954232e4d44722f0da77594300c0c823"' :
                                        'id="xs-injectables-links-module-FileSystemModule-ae142627e864d1e4e80b5d3b89718a3b1972140905e47e98979921d2e55e7770ca712a81c31830c66e9932f6244de5d5954232e4d44722f0da77594300c0c823"' }>
                                        <li class="link">
                                            <a href="injectables/FileSystemAdapter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileSystemAdapter</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FwuLearningContentsModule.html" data-type="entity-link" >FwuLearningContentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' : 'data-bs-target="#xs-controllers-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' :
                                            'id="xs-controllers-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' }>
                                            <li class="link">
                                                <a href="controllers/FwuLearningContentsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FwuLearningContentsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' : 'data-bs-target="#xs-injectables-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' :
                                        'id="xs-injectables-links-module-FwuLearningContentsModule-5a60bd60ab60f84e8d31086f7ae54ec2ccba6311567415d8362ef75deca71777242c9ebced0b8ea61b3abc2ecaa48a36d102fd71c9fef99a31378b1d8e5553e2"' }>
                                        <li class="link">
                                            <a href="injectables/FwuLearningContentsUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FwuLearningContentsUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FwuLearningContentsTestModule.html" data-type="entity-link" >FwuLearningContentsTestModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' : 'data-bs-target="#xs-controllers-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' :
                                            'id="xs-controllers-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' }>
                                            <li class="link">
                                                <a href="controllers/FwuLearningContentsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FwuLearningContentsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' : 'data-bs-target="#xs-injectables-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' :
                                        'id="xs-injectables-links-module-FwuLearningContentsTestModule-0f0655b798da8f76b479ac99e068b91619665820e10b5ca9c9bf3db97f36f68944a48b18ba5d3ad099348c643ececfa93849b9958ed407d77fab5179e9e44a8f"' }>
                                        <li class="link">
                                            <a href="injectables/FwuLearningContentsUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FwuLearningContentsUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GroupApiModule.html" data-type="entity-link" >GroupApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' : 'data-bs-target="#xs-controllers-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' :
                                            'id="xs-controllers-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' }>
                                            <li class="link">
                                                <a href="controllers/GroupController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' : 'data-bs-target="#xs-injectables-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' :
                                        'id="xs-injectables-links-module-GroupApiModule-efbcd5dac078a94c17b7b0e90dd993fb9e9cc3b84178dceb8c6be9e0a1abbae1e45942205649eb6f6b4ffeb18deda1e5f3b78a5f74245653dfc6a8b5bd4a5fa0"' }>
                                        <li class="link">
                                            <a href="injectables/GroupUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GroupModule.html" data-type="entity-link" >GroupModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-GroupModule-2acd5aba3c0b60eb366fe39cb8ac945016f6c4c28d24529bfc618e58180b150ff9285330a666431d606f653cb445b35564140f74b544db4a8a9ac40973ce36b3"' : 'data-bs-target="#xs-injectables-links-module-GroupModule-2acd5aba3c0b60eb366fe39cb8ac945016f6c4c28d24529bfc618e58180b150ff9285330a666431d606f653cb445b35564140f74b544db4a8a9ac40973ce36b3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GroupModule-2acd5aba3c0b60eb366fe39cb8ac945016f6c4c28d24529bfc618e58180b150ff9285330a666431d606f653cb445b35564140f74b544db4a8a9ac40973ce36b3"' :
                                        'id="xs-injectables-links-module-GroupModule-2acd5aba3c0b60eb366fe39cb8ac945016f6c4c28d24529bfc618e58180b150ff9285330a666431d606f653cb445b35564140f74b544db4a8a9ac40973ce36b3"' }>
                                        <li class="link">
                                            <a href="injectables/GroupRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/GroupService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/H5PEditorModule.html" data-type="entity-link" >H5PEditorModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' : 'data-bs-target="#xs-controllers-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' :
                                            'id="xs-controllers-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' }>
                                            <li class="link">
                                                <a href="controllers/H5PEditorController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PEditorController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' : 'data-bs-target="#xs-injectables-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' :
                                        'id="xs-injectables-links-module-H5PEditorModule-91315353f06358db1350a17721ba719407d1edec9974f89f6d6480b0376db6ea3f01d5be17613933c80d13b3690d153d0335e1ae11592a19e46460c1e83cae36"' }>
                                        <li class="link">
                                            <a href="injectables/ContentStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContentStorage</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/H5PContentRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PContentRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/H5PEditorUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PEditorUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LibraryRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LibraryRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LibraryStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LibraryStorage</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Logger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Logger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemporaryFileStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemporaryFileStorage</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/H5PEditorTestModule.html" data-type="entity-link" >H5PEditorTestModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' : 'data-bs-target="#xs-controllers-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' :
                                            'id="xs-controllers-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' }>
                                            <li class="link">
                                                <a href="controllers/H5PEditorController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PEditorController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' : 'data-bs-target="#xs-injectables-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' :
                                        'id="xs-injectables-links-module-H5PEditorTestModule-27b84bffe1d4e17754fa507186cc90db94519e6e1aa997bb5debdcc91496ceab6aa2a058ec6dc9984213da2c3642b92b60f5a64476984fd81482048d87f4912d"' }>
                                        <li class="link">
                                            <a href="injectables/ContentStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContentStorage</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/H5PContentRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PContentRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/H5PEditorUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PEditorUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LibraryRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LibraryRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LibraryStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LibraryStorage</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TemporaryFileStorage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TemporaryFileStorage</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/H5PLibraryManagementModule.html" data-type="entity-link" >H5PLibraryManagementModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-H5PLibraryManagementModule-1a009ac79c5c232d87ac1bc28c02ec900916cef836d563f78a20a804749d94da119a92b1473dba6defe6fb66a746ffded699f582f2ff966f0a4cf97089cf7a7f"' : 'data-bs-target="#xs-injectables-links-module-H5PLibraryManagementModule-1a009ac79c5c232d87ac1bc28c02ec900916cef836d563f78a20a804749d94da119a92b1473dba6defe6fb66a746ffded699f582f2ff966f0a4cf97089cf7a7f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-H5PLibraryManagementModule-1a009ac79c5c232d87ac1bc28c02ec900916cef836d563f78a20a804749d94da119a92b1473dba6defe6fb66a746ffded699f582f2ff966f0a4cf97089cf7a7f"' :
                                        'id="xs-injectables-links-module-H5PLibraryManagementModule-1a009ac79c5c232d87ac1bc28c02ec900916cef836d563f78a20a804749d94da119a92b1473dba6defe6fb66a746ffded699f582f2ff966f0a4cf97089cf7a7f"' }>
                                        <li class="link">
                                            <a href="injectables/H5PLibraryManagementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >H5PLibraryManagementService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Logger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Logger</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IdentityManagementModule.html" data-type="entity-link" >IdentityManagementModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ImportUserModule.html" data-type="entity-link" >ImportUserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' : 'data-bs-target="#xs-controllers-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' :
                                            'id="xs-controllers-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' }>
                                            <li class="link">
                                                <a href="controllers/ImportUserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImportUserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' : 'data-bs-target="#xs-injectables-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' :
                                        'id="xs-injectables-links-module-ImportUserModule-67097c26514681b282ad1b19354b4f13ff32067f81b43fa70e0469a4320c966ab03d27b8dac9817afb9926e455d76121ff4670d4c400d3bd0bbf5938ed0f7c6b"' }>
                                        <li class="link">
                                            <a href="injectables/ImportUserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImportUserRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySystemRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySystemRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchulconnexFetchImportUsersService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchulconnexFetchImportUsersService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserImportFetchUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserImportFetchUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserImportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserImportService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserImportUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserImportUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/InterceptorModule.html" data-type="entity-link" >InterceptorModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/KeycloakAdministrationModule.html" data-type="entity-link" >KeycloakAdministrationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-KeycloakAdministrationModule-6d88a3849bf1f18706d4bb4c8a9de3114b25a9a2a3a8416f83364653a8b88c19c2a13be4fbbb2d9111f0395a9aa2ef4a95d433a756c91f58386a59f0c13a1211"' : 'data-bs-target="#xs-injectables-links-module-KeycloakAdministrationModule-6d88a3849bf1f18706d4bb4c8a9de3114b25a9a2a3a8416f83364653a8b88c19c2a13be4fbbb2d9111f0395a9aa2ef4a95d433a756c91f58386a59f0c13a1211"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-KeycloakAdministrationModule-6d88a3849bf1f18706d4bb4c8a9de3114b25a9a2a3a8416f83364653a8b88c19c2a13be4fbbb2d9111f0395a9aa2ef4a95d433a756c91f58386a59f0c13a1211"' :
                                        'id="xs-injectables-links-module-KeycloakAdministrationModule-6d88a3849bf1f18706d4bb4c8a9de3114b25a9a2a3a8416f83364653a8b88c19c2a13be4fbbb2d9111f0395a9aa2ef4a95d433a756c91f58386a59f0c13a1211"' }>
                                        <li class="link">
                                            <a href="injectables/KeycloakAdministrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakAdministrationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/KeycloakConfigurationModule.html" data-type="entity-link" >KeycloakConfigurationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' : 'data-bs-target="#xs-controllers-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' :
                                            'id="xs-controllers-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' }>
                                            <li class="link">
                                                <a href="controllers/KeycloakManagementController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakManagementController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' : 'data-bs-target="#xs-injectables-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' :
                                        'id="xs-injectables-links-module-KeycloakConfigurationModule-37d970a7e12a9129723e49d257a24f8d6c1a92654617ebf4f9635d9a2cdb94e75185a550bb53c035911789fed7a6c1b5b4cccd121d62e990bbb9238f7f4b6739"' }>
                                        <li class="link">
                                            <a href="injectables/KeycloakConfigurationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/KeycloakConfigurationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakConfigurationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/KeycloakMigrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakMigrationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/KeycloakModule.html" data-type="entity-link" >KeycloakModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-KeycloakModule-bd1ef570240d23aa50447879f811e609b4ff0692f804141ba2ffd9aba2e644421ee0df1ee83e9fa8153b735ff92c8ce77843c98535b128a135c21ce667134976"' : 'data-bs-target="#xs-injectables-links-module-KeycloakModule-bd1ef570240d23aa50447879f811e609b4ff0692f804141ba2ffd9aba2e644421ee0df1ee83e9fa8153b735ff92c8ce77843c98535b128a135c21ce667134976"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-KeycloakModule-bd1ef570240d23aa50447879f811e609b4ff0692f804141ba2ffd9aba2e644421ee0df1ee83e9fa8153b735ff92c8ce77843c98535b128a135c21ce667134976"' :
                                        'id="xs-injectables-links-module-KeycloakModule-bd1ef570240d23aa50447879f811e609b4ff0692f804141ba2ffd9aba2e644421ee0df1ee83e9fa8153b735ff92c8ce77843c98535b128a135c21ce667134976"' }>
                                        <li class="link">
                                            <a href="injectables/KeycloakIdentityManagementOauthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakIdentityManagementOauthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/KeycloakIdentityManagementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeycloakIdentityManagementService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LearnroomApiModule.html" data-type="entity-link" >LearnroomApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' : 'data-bs-target="#xs-controllers-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' :
                                            'id="xs-controllers-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' }>
                                            <li class="link">
                                                <a href="controllers/CourseController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/DashboardController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/RoomsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' : 'data-bs-target="#xs-injectables-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' :
                                        'id="xs-injectables-links-module-LearnroomApiModule-7ecb9bdffbbc516902e3e1878f631be8c344dfc407d278ae627e2f07416c9a3b876eb1802eacfe62f3854cca187c02e56e100bd7f9d9ab3d82908b13496ca64d"' }>
                                        <li class="link">
                                            <a href="injectables/BoardRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseCopyUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseCopyUC</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseExportUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseExportUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DashboardModelMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardModelMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DashboardUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonCopyUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonCopyUC</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoomBoardDTOFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomBoardDTOFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoomBoardResponseMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomBoardResponseMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoomsAuthorisationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomsAuthorisationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoomsUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomsUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LearnroomModule.html" data-type="entity-link" >LearnroomModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LearnroomModule-e9ea3a6a0bdb23444ae41cddcab4d081458e41d38e54822052561e74fe714a2b7c803c65b32988eda84f5958074d91af147e199b1854d4a94302f961d3646643"' : 'data-bs-target="#xs-injectables-links-module-LearnroomModule-e9ea3a6a0bdb23444ae41cddcab4d081458e41d38e54822052561e74fe714a2b7c803c65b32988eda84f5958074d91af147e199b1854d4a94302f961d3646643"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LearnroomModule-e9ea3a6a0bdb23444ae41cddcab4d081458e41d38e54822052561e74fe714a2b7c803c65b32988eda84f5958074d91af147e199b1854d4a94302f961d3646643"' :
                                        'id="xs-injectables-links-module-LearnroomModule-e9ea3a6a0bdb23444ae41cddcab4d081458e41d38e54822052561e74fe714a2b7c803c65b32988eda84f5958074d91af147e199b1854d4a94302f961d3646643"' }>
                                        <li class="link">
                                            <a href="injectables/BoardCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BoardRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ColumnBoardTargetService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ColumnBoardTargetService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CommonCartridgeExportService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonCartridgeExportService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseGroupRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseGroupRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseGroupService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseGroupService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DashboardElementRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardElementRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DashboardModelMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardModelMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DashboardService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoomsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoomsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LegacySchoolAdminApiModule.html" data-type="entity-link" >LegacySchoolAdminApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' : 'data-bs-target="#xs-controllers-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' :
                                            'id="xs-controllers-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' }>
                                            <li class="link">
                                                <a href="controllers/AdminApiSchoolsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminApiSchoolsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' : 'data-bs-target="#xs-injectables-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' :
                                        'id="xs-injectables-links-module-LegacySchoolAdminApiModule-09d17ac5410a19365ad7ad153a0790adb8dc75365a8bf56f8138515e2af2b4611070a2e00b3ccedc2c1c0ceedb11e4a52bb8c1377ae268f97ee2a392f3de4070"' }>
                                        <li class="link">
                                            <a href="injectables/AdminApiSchoolUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminApiSchoolUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LegacySchoolApiModule.html" data-type="entity-link" >LegacySchoolApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' : 'data-bs-target="#xs-controllers-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' :
                                            'id="xs-controllers-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' }>
                                            <li class="link">
                                                <a href="controllers/SchoolController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' : 'data-bs-target="#xs-injectables-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' :
                                        'id="xs-injectables-links-module-LegacySchoolApiModule-2d9ac9f6b4b170dd1aebe139518e0f51253b4863fb0adbc1d9d27352469999694ef78a2b5eae0b57e1013ba15feddd2a6ab60d50ab4b8e2458b6d8c33341920d"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolSystemOptionsUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSystemOptionsUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LegacySchoolModule.html" data-type="entity-link" class="deprecated-name">LegacySchoolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LegacySchoolModule-a730a26923b04031814154b5aab785f27a78f52cc10d7a748645edbe2c6593f34463bb020678d33b48dcd2843d8f15e96c77f3478f562089ccd94e8d63fd11ab"' : 'data-bs-target="#xs-injectables-links-module-LegacySchoolModule-a730a26923b04031814154b5aab785f27a78f52cc10d7a748645edbe2c6593f34463bb020678d33b48dcd2843d8f15e96c77f3478f562089ccd94e8d63fd11ab"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LegacySchoolModule-a730a26923b04031814154b5aab785f27a78f52cc10d7a748645edbe2c6593f34463bb020678d33b48dcd2843d8f15e96c77f3478f562089ccd94e8d63fd11ab"' :
                                        'id="xs-injectables-links-module-LegacySchoolModule-a730a26923b04031814154b5aab785f27a78f52cc10d7a748645edbe2c6593f34463bb020678d33b48dcd2843d8f15e96c77f3478f562089ccd94e8d63fd11ab"' }>
                                        <li class="link">
                                            <a href="injectables/FederalStateRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FederalStateRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FederalStateService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FederalStateService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySchoolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySchoolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ProvisioningOptionsUpdateService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProvisioningOptionsUpdateService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolSystemOptionsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSystemOptionsRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolSystemOptionsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolSystemOptionsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolValidationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolYearRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolYearRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolYearService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolYearService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchulconnexProvisioningOptionsUpdateService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchulconnexProvisioningOptionsUpdateService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LessonApiModule.html" data-type="entity-link" >LessonApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' : 'data-bs-target="#xs-controllers-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' :
                                            'id="xs-controllers-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' }>
                                            <li class="link">
                                                <a href="controllers/LessonController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' : 'data-bs-target="#xs-injectables-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' :
                                        'id="xs-injectables-links-module-LessonApiModule-71557afb57bdbe78c2fc344a2a3081cd8e92ff68a932177051204a959fb45970494c1dd32695dae31d2a26320e00618d0cdf1d6c062490231838a6b349811db3"' }>
                                        <li class="link">
                                            <a href="injectables/LessonUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonUC</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LessonModule.html" data-type="entity-link" >LessonModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LessonModule-9ef7ba50d726d25fddeb4e9a5d44628e5cdc8d22bd31f89186af62c1ef614964a40059b386831327b9f36e7dfc3a8988ab98afbf5636ba6d70aa5f59c8600984"' : 'data-bs-target="#xs-injectables-links-module-LessonModule-9ef7ba50d726d25fddeb4e9a5d44628e5cdc8d22bd31f89186af62c1ef614964a40059b386831327b9f36e7dfc3a8988ab98afbf5636ba6d70aa5f59c8600984"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LessonModule-9ef7ba50d726d25fddeb4e9a5d44628e5cdc8d22bd31f89186af62c1ef614964a40059b386831327b9f36e7dfc3a8988ab98afbf5636ba6d70aa5f59c8600984"' :
                                        'id="xs-injectables-links-module-LessonModule-9ef7ba50d726d25fddeb4e9a5d44628e5cdc8d22bd31f89186af62c1ef614964a40059b386831327b9f36e7dfc3a8988ab98afbf5636ba6d70aa5f59c8600984"' }>
                                        <li class="link">
                                            <a href="injectables/EtherpadService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtherpadService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeathersServiceProvider.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeathersServiceProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NexboardService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NexboardService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoggerModule.html" data-type="entity-link" >LoggerModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LoggerModule-b0148ca25c4f117a123468c0a9400e65dd8ecaa97ab38415a1948fe420b9fd8710e5488295943529a69043065d477faed8f09c9b0292338a3d07322d86a5f21b"' : 'data-bs-target="#xs-injectables-links-module-LoggerModule-b0148ca25c4f117a123468c0a9400e65dd8ecaa97ab38415a1948fe420b9fd8710e5488295943529a69043065d477faed8f09c9b0292338a3d07322d86a5f21b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LoggerModule-b0148ca25c4f117a123468c0a9400e65dd8ecaa97ab38415a1948fe420b9fd8710e5488295943529a69043065d477faed8f09c9b0292338a3d07322d86a5f21b"' :
                                        'id="xs-injectables-links-module-LoggerModule-b0148ca25c4f117a123468c0a9400e65dd8ecaa97ab38415a1948fe420b9fd8710e5488295943529a69043065d477faed8f09c9b0292338a3d07322d86a5f21b"' }>
                                        <li class="link">
                                            <a href="injectables/ErrorLogger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ErrorLogger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacyLogger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegacyLogger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Logger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Logger</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LtiToolModule.html" data-type="entity-link" >LtiToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-LtiToolModule-dd9f1da72f2be77dfbc6fb4c7484886a2299f89e9ebac233c3d22377a5beca0d0a7e4ac9debc91538237b3538e9d2aac5f87b85f824c186c69f9689a8fabaa5c"' : 'data-bs-target="#xs-injectables-links-module-LtiToolModule-dd9f1da72f2be77dfbc6fb4c7484886a2299f89e9ebac233c3d22377a5beca0d0a7e4ac9debc91538237b3538e9d2aac5f87b85f824c186c69f9689a8fabaa5c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-LtiToolModule-dd9f1da72f2be77dfbc6fb4c7484886a2299f89e9ebac233c3d22377a5beca0d0a7e4ac9debc91538237b3538e9d2aac5f87b85f824c186c69f9689a8fabaa5c"' :
                                        'id="xs-injectables-links-module-LtiToolModule-dd9f1da72f2be77dfbc6fb4c7484886a2299f89e9ebac233c3d22377a5beca0d0a7e4ac9debc91538237b3538e9d2aac5f87b85f824c186c69f9689a8fabaa5c"' }>
                                        <li class="link">
                                            <a href="injectables/LegacyLogger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegacyLogger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LtiToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LtiToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LtiToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LtiToolService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MailModule.html" data-type="entity-link" >MailModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ManagementModule.html" data-type="entity-link" >ManagementModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' : 'data-bs-target="#xs-controllers-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' :
                                            'id="xs-controllers-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' }>
                                            <li class="link">
                                                <a href="controllers/DatabaseManagementController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseManagementController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' : 'data-bs-target="#xs-injectables-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' :
                                        'id="xs-injectables-links-module-ManagementModule-643a1d06eeeb16e3106efa7c34694463ffbdf4b31fed342a82fb9d9478588375e1a5255bd79fd2c006203b51a808ebfeede67f9661ad42c3655ec098b2c3c0ca"' }>
                                        <li class="link">
                                            <a href="injectables/BoardManagementUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardManagementUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BsonConverter.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BsonConverter</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ConsoleWriterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConsoleWriterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DatabaseManagementService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseManagementService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DatabaseManagementUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseManagementUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ManagementServerModule.html" data-type="entity-link" >ManagementServerModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ManagementServerTestModule.html" data-type="entity-link" >ManagementServerTestModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MeApiModule.html" data-type="entity-link" >MeApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' : 'data-bs-target="#xs-controllers-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' :
                                            'id="xs-controllers-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' }>
                                            <li class="link">
                                                <a href="controllers/MeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' : 'data-bs-target="#xs-injectables-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' :
                                        'id="xs-injectables-links-module-MeApiModule-b78704577671a669eb5947917dd21e5426286b80caaf4924540971353c8b9a854c435c6d057c4842e89a4f864a138438ac192ed90347c76afad31003d422a57d"' }>
                                        <li class="link">
                                            <a href="injectables/MeUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MeUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MetaTagExtractorApiModule.html" data-type="entity-link" >MetaTagExtractorApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' : 'data-bs-target="#xs-controllers-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' :
                                            'id="xs-controllers-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' }>
                                            <li class="link">
                                                <a href="controllers/MetaTagExtractorController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetaTagExtractorController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' : 'data-bs-target="#xs-injectables-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' :
                                        'id="xs-injectables-links-module-MetaTagExtractorApiModule-6d4ff02210cd4ef80cdace4cbd3f513dd67c607034898b5234035bf944c86b57d35548443c47a5c12a4d1615884d1c1a37943492d8d173e0a603d952eee6f36d"' }>
                                        <li class="link">
                                            <a href="injectables/MetaTagExtractorUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetaTagExtractorUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MetaTagExtractorModule.html" data-type="entity-link" >MetaTagExtractorModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MetaTagExtractorModule-b187d61ffcc231246294cb1d71f79027e942fa94e2dba681a987b8e0f675910ac16b27469b3c7781759d4919752e248c8d2983459634e45a543b97efaa946179"' : 'data-bs-target="#xs-injectables-links-module-MetaTagExtractorModule-b187d61ffcc231246294cb1d71f79027e942fa94e2dba681a987b8e0f675910ac16b27469b3c7781759d4919752e248c8d2983459634e45a543b97efaa946179"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MetaTagExtractorModule-b187d61ffcc231246294cb1d71f79027e942fa94e2dba681a987b8e0f675910ac16b27469b3c7781759d4919752e248c8d2983459634e45a543b97efaa946179"' :
                                        'id="xs-injectables-links-module-MetaTagExtractorModule-b187d61ffcc231246294cb1d71f79027e942fa94e2dba681a987b8e0f675910ac16b27469b3c7781759d4919752e248c8d2983459634e45a543b97efaa946179"' }>
                                        <li class="link">
                                            <a href="injectables/BoardUrlHandler.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BoardUrlHandler</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/CourseUrlHandler.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseUrlHandler</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LessonUrlHandler.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LessonUrlHandler</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/MetaTagExtractorService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetaTagExtractorService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/MetaTagInternalUrlService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetaTagInternalUrlService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskUrlHandler.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskUrlHandler</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MongoMemoryDatabaseModule.html" data-type="entity-link" >MongoMemoryDatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NewsModule.html" data-type="entity-link" >NewsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' : 'data-bs-target="#xs-controllers-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' :
                                            'id="xs-controllers-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' }>
                                            <li class="link">
                                                <a href="controllers/NewsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewsController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/TeamNewsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamNewsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' : 'data-bs-target="#xs-injectables-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' :
                                        'id="xs-injectables-links-module-NewsModule-872f9ace687ad5437df9c1f40f8bf9f504c4c99909792100d50b7d4963dfbe42d37469280daa0d887cbc937f990d09c7776b9eef6665fae074a12e8bd9d6e965"' }>
                                        <li class="link">
                                            <a href="injectables/NewsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewsRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NewsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NewsUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NewsUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OauthApiModule.html" data-type="entity-link" >OauthApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' : 'data-bs-target="#xs-controllers-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' :
                                            'id="xs-controllers-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' }>
                                            <li class="link">
                                                <a href="controllers/OauthSSOController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthSSOController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' : 'data-bs-target="#xs-injectables-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' :
                                        'id="xs-injectables-links-module-OauthApiModule-b76b74870d5b1db78c42cf77e5cea1cbefc7941175a265abd5b9376e294a3c03707d359fa1ba0ff2a29350b49a3587b6cb7c6696fa5c8b1479c729bab6acd187"' }>
                                        <li class="link">
                                            <a href="injectables/HydraOauthUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HydraOauthUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OauthModule.html" data-type="entity-link" >OauthModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OauthModule-3bf3144731885241d2ad317cf6b99fd02783e6c35b96fa1ba7b9129c8243b5639aba61dbee456bc3a1efc901651956147e120b4815cfd0e67015192e21cefb9b"' : 'data-bs-target="#xs-injectables-links-module-OauthModule-3bf3144731885241d2ad317cf6b99fd02783e6c35b96fa1ba7b9129c8243b5639aba61dbee456bc3a1efc901651956147e120b4815cfd0e67015192e21cefb9b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OauthModule-3bf3144731885241d2ad317cf6b99fd02783e6c35b96fa1ba7b9129c8243b5639aba61dbee456bc3a1efc901651956147e120b4815cfd0e67015192e21cefb9b"' :
                                        'id="xs-injectables-links-module-OauthModule-3bf3144731885241d2ad317cf6b99fd02783e6c35b96fa1ba7b9129c8243b5639aba61dbee456bc3a1efc901651956147e120b4815cfd0e67015192e21cefb9b"' }>
                                        <li class="link">
                                            <a href="injectables/HydraSsoService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HydraSsoService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LtiToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LtiToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OAuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OAuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthAdapterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthAdapterService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OauthProviderApiModule.html" data-type="entity-link" >OauthProviderApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' : 'data-bs-target="#xs-controllers-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' :
                                            'id="xs-controllers-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' }>
                                            <li class="link">
                                                <a href="controllers/OauthProviderController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' : 'data-bs-target="#xs-injectables-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' :
                                        'id="xs-injectables-links-module-OauthProviderApiModule-579401bea6c57f5f5896c3b0a91072c65d639be204aa11cd28b1394a63a7ee3f5ff986b454b21bb91074c4292f3015919de2d23cf8fb4c79b550212442b5e1cb"' }>
                                        <li class="link">
                                            <a href="injectables/OauthProviderClientCrudUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderClientCrudUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderConsentFlowUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderConsentFlowUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderLoginFlowUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderLoginFlowUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderLogoutFlowUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderLogoutFlowUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderResponseMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderResponseMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OauthProviderModule.html" data-type="entity-link" >OauthProviderModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OauthProviderModule-fec5dd061cd9733d7987cddb6b1144364cf2c3edfc9ec0e839b926c70b8b3d7a9c3535052e632e3495aa0fb91c4063d10e452e4f94f577f201b6dc0853013153"' : 'data-bs-target="#xs-injectables-links-module-OauthProviderModule-fec5dd061cd9733d7987cddb6b1144364cf2c3edfc9ec0e839b926c70b8b3d7a9c3535052e632e3495aa0fb91c4063d10e452e4f94f577f201b6dc0853013153"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OauthProviderModule-fec5dd061cd9733d7987cddb6b1144364cf2c3edfc9ec0e839b926c70b8b3d7a9c3535052e632e3495aa0fb91c4063d10e452e4f94f577f201b6dc0853013153"' :
                                        'id="xs-injectables-links-module-OauthProviderModule-fec5dd061cd9733d7987cddb6b1144364cf2c3edfc9ec0e839b926c70b8b3d7a9c3535052e632e3495aa0fb91c4063d10e452e4f94f577f201b6dc0853013153"' }>
                                        <li class="link">
                                            <a href="injectables/IdTokenService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IdTokenService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OauthProviderLoginFlowService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthProviderLoginFlowService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamsRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OauthProviderServiceModule.html" data-type="entity-link" >OauthProviderServiceModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PreviewGeneratorAMQPModule.html" data-type="entity-link" >PreviewGeneratorAMQPModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PreviewGeneratorConsumerModule.html" data-type="entity-link" >PreviewGeneratorConsumerModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PreviewGeneratorProducerModule.html" data-type="entity-link" >PreviewGeneratorProducerModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PreviewGeneratorProducerModule-18b3b8c2e1ce5b569d6fbbb77fb10c0f29b5ee2761626e78c7c999ef41bb3702c87c55b09044c0cbf2145d51d2c2138d3c08136aacf07aa217241b44fa08e017"' : 'data-bs-target="#xs-injectables-links-module-PreviewGeneratorProducerModule-18b3b8c2e1ce5b569d6fbbb77fb10c0f29b5ee2761626e78c7c999ef41bb3702c87c55b09044c0cbf2145d51d2c2138d3c08136aacf07aa217241b44fa08e017"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PreviewGeneratorProducerModule-18b3b8c2e1ce5b569d6fbbb77fb10c0f29b5ee2761626e78c7c999ef41bb3702c87c55b09044c0cbf2145d51d2c2138d3c08136aacf07aa217241b44fa08e017"' :
                                        'id="xs-injectables-links-module-PreviewGeneratorProducerModule-18b3b8c2e1ce5b569d6fbbb77fb10c0f29b5ee2761626e78c7c999ef41bb3702c87c55b09044c0cbf2145d51d2c2138d3c08136aacf07aa217241b44fa08e017"' }>
                                        <li class="link">
                                            <a href="injectables/PreviewProducer.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PreviewProducer</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProvisioningConfigModule.html" data-type="entity-link" >ProvisioningConfigModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ProvisioningModule.html" data-type="entity-link" >ProvisioningModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProvisioningModule-175cef474b65be2e1044bb48e49acfea148018b9a2889f29506af95a5d2095f38bac80d6d64f0cbfa6005273d3b58bb5f5c50bad3c8cdbe6bc679206f40a3542"' : 'data-bs-target="#xs-injectables-links-module-ProvisioningModule-175cef474b65be2e1044bb48e49acfea148018b9a2889f29506af95a5d2095f38bac80d6d64f0cbfa6005273d3b58bb5f5c50bad3c8cdbe6bc679206f40a3542"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProvisioningModule-175cef474b65be2e1044bb48e49acfea148018b9a2889f29506af95a5d2095f38bac80d6d64f0cbfa6005273d3b58bb5f5c50bad3c8cdbe6bc679206f40a3542"' :
                                        'id="xs-injectables-links-module-ProvisioningModule-175cef474b65be2e1044bb48e49acfea148018b9a2889f29506af95a5d2095f38bac80d6d64f0cbfa6005273d3b58bb5f5c50bad3c8cdbe6bc679206f40a3542"' }>
                                        <li class="link">
                                            <a href="injectables/IservProvisioningStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IservProvisioningStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OidcMockProvisioningStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OidcMockProvisioningStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OidcProvisioningService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OidcProvisioningService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ProvisioningService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProvisioningService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SanisProvisioningStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SanisProvisioningStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SanisResponseMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SanisResponseMapper</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PseudonymApiModule.html" data-type="entity-link" >PseudonymApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' : 'data-bs-target="#xs-controllers-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' :
                                            'id="xs-controllers-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' }>
                                            <li class="link">
                                                <a href="controllers/PseudonymController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PseudonymController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' : 'data-bs-target="#xs-injectables-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' :
                                        'id="xs-injectables-links-module-PseudonymApiModule-b39259108c1e7c3e3b6ccb69237e7eaa472b047f352662bd2d37b47566a38113a1b478d45cd6ce616a408e5a13799fe6093b4f39b3bf54c41047797c72ed6afa"' }>
                                        <li class="link">
                                            <a href="injectables/PseudonymUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PseudonymUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PseudonymModule.html" data-type="entity-link" >PseudonymModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PseudonymModule-5a41606f8add8664db296ee2af50f08a7a51a8f740d285d6c14af060d6aef4f6dd4d6ba31bb94d9ddadc5fccbee4c67aa26fee94def0975b2c77faaa9f574583"' : 'data-bs-target="#xs-injectables-links-module-PseudonymModule-5a41606f8add8664db296ee2af50f08a7a51a8f740d285d6c14af060d6aef4f6dd4d6ba31bb94d9ddadc5fccbee4c67aa26fee94def0975b2c77faaa9f574583"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PseudonymModule-5a41606f8add8664db296ee2af50f08a7a51a8f740d285d6c14af060d6aef4f6dd4d6ba31bb94d9ddadc5fccbee4c67aa26fee94def0975b2c77faaa9f574583"' :
                                        'id="xs-injectables-links-module-PseudonymModule-5a41606f8add8664db296ee2af50f08a7a51a8f740d285d6c14af060d6aef4f6dd4d6ba31bb94d9ddadc5fccbee4c67aa26fee94def0975b2c77faaa9f574583"' }>
                                        <li class="link">
                                            <a href="injectables/ExternalToolPseudonymRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolPseudonymRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/FeathersRosterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeathersRosterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacyLogger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LegacyLogger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PseudonymService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PseudonymService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PseudonymsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PseudonymsRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RabbitMQWrapperModule.html" data-type="entity-link" >RabbitMQWrapperModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RabbitMQWrapperTestModule.html" data-type="entity-link" >RabbitMQWrapperTestModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RegistrationPinModule.html" data-type="entity-link" >RegistrationPinModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RegistrationPinModule-d29963fa5c22d50f176275238f235c688bbef3f1425f046696c08ce5b04922d0036900d0270cf13687dde3e284c73206379760ee1125bd5464f24ee9a57e01cf"' : 'data-bs-target="#xs-injectables-links-module-RegistrationPinModule-d29963fa5c22d50f176275238f235c688bbef3f1425f046696c08ce5b04922d0036900d0270cf13687dde3e284c73206379760ee1125bd5464f24ee9a57e01cf"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RegistrationPinModule-d29963fa5c22d50f176275238f235c688bbef3f1425f046696c08ce5b04922d0036900d0270cf13687dde3e284c73206379760ee1125bd5464f24ee9a57e01cf"' :
                                        'id="xs-injectables-links-module-RegistrationPinModule-d29963fa5c22d50f176275238f235c688bbef3f1425f046696c08ce5b04922d0036900d0270cf13687dde3e284c73206379760ee1125bd5464f24ee9a57e01cf"' }>
                                        <li class="link">
                                            <a href="injectables/RegistrationPinRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RegistrationPinRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RegistrationPinService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RegistrationPinService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RocketChatModule.html" data-type="entity-link" >RocketChatModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RocketChatUserModule.html" data-type="entity-link" >RocketChatUserModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RocketChatUserModule-273d7c58ca1e600a4af9832e2f80d71f6184dfdbfe55a2f9e1ecdcda3d5e34b63073e0a629b3eca9e468c54c6367ce8bb2401af15ec7f30ee1ab18f27c2eab76"' : 'data-bs-target="#xs-injectables-links-module-RocketChatUserModule-273d7c58ca1e600a4af9832e2f80d71f6184dfdbfe55a2f9e1ecdcda3d5e34b63073e0a629b3eca9e468c54c6367ce8bb2401af15ec7f30ee1ab18f27c2eab76"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RocketChatUserModule-273d7c58ca1e600a4af9832e2f80d71f6184dfdbfe55a2f9e1ecdcda3d5e34b63073e0a629b3eca9e468c54c6367ce8bb2401af15ec7f30ee1ab18f27c2eab76"' :
                                        'id="xs-injectables-links-module-RocketChatUserModule-273d7c58ca1e600a4af9832e2f80d71f6184dfdbfe55a2f9e1ecdcda3d5e34b63073e0a629b3eca9e468c54c6367ce8bb2401af15ec7f30ee1ab18f27c2eab76"' }>
                                        <li class="link">
                                            <a href="injectables/RocketChatUserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RocketChatUserRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RocketChatUserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RocketChatUserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/RoleModule.html" data-type="entity-link" >RoleModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-RoleModule-fdd64f88ca3c4e4d814478eaf4dc40ee91bdfe744a9061baa96b79caa602e98be88f47551d8a056025e6b1dab823fd67ab23d15888b34ae65452e6cec6d2c747"' : 'data-bs-target="#xs-injectables-links-module-RoleModule-fdd64f88ca3c4e4d814478eaf4dc40ee91bdfe744a9061baa96b79caa602e98be88f47551d8a056025e6b1dab823fd67ab23d15888b34ae65452e6cec6d2c747"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-RoleModule-fdd64f88ca3c4e4d814478eaf4dc40ee91bdfe744a9061baa96b79caa602e98be88f47551d8a056025e6b1dab823fd67ab23d15888b34ae65452e6cec6d2c747"' :
                                        'id="xs-injectables-links-module-RoleModule-fdd64f88ca3c4e4d814478eaf4dc40ee91bdfe744a9061baa96b79caa602e98be88f47551d8a056025e6b1dab823fd67ab23d15888b34ae65452e6cec6d2c747"' }>
                                        <li class="link">
                                            <a href="injectables/RoleRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoleService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RoleUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RoleUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/S3ClientModule.html" data-type="entity-link" >S3ClientModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolApiModule.html" data-type="entity-link" >SchoolApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' : 'data-bs-target="#xs-controllers-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' :
                                            'id="xs-controllers-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' }>
                                            <li class="link">
                                                <a href="controllers/SchoolController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' : 'data-bs-target="#xs-injectables-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' :
                                        'id="xs-injectables-links-module-SchoolApiModule-6f1f09548b234d3ed980129d86b1428a89100d884adfae00a7b6a7044cf89bf45c989792c8e7aeac373808b692db85df7eeefccd6a0bfb41cdead8d8c74ae7ec"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolExternalToolModule.html" data-type="entity-link" >SchoolExternalToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolExternalToolModule-be1eba272ff1dfd930e17776ceea3f7c0b8f896565be5bac31569213927699cc75e5d98ff8467ab9852b68231780c11f22525f5b9edd0d5346d58fcfe1e53032"' : 'data-bs-target="#xs-injectables-links-module-SchoolExternalToolModule-be1eba272ff1dfd930e17776ceea3f7c0b8f896565be5bac31569213927699cc75e5d98ff8467ab9852b68231780c11f22525f5b9edd0d5346d58fcfe1e53032"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolExternalToolModule-be1eba272ff1dfd930e17776ceea3f7c0b8f896565be5bac31569213927699cc75e5d98ff8467ab9852b68231780c11f22525f5b9edd0d5346d58fcfe1e53032"' :
                                        'id="xs-injectables-links-module-SchoolExternalToolModule-be1eba272ff1dfd930e17776ceea3f7c0b8f896565be5bac31569213927699cc75e5d98ff8467ab9852b68231780c11f22525f5b9edd0d5346d58fcfe1e53032"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolValidationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolValidationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchoolModule.html" data-type="entity-link" >SchoolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SchoolModule-1f863a955da06574b94aeeddfa5c45f6179d0edf9e122b3e1923fe1f2d69810f797b281c42fd5f6f2965a26d03eab3e88f2dd02b5d9fb387f7183e4284e2d7be"' : 'data-bs-target="#xs-injectables-links-module-SchoolModule-1f863a955da06574b94aeeddfa5c45f6179d0edf9e122b3e1923fe1f2d69810f797b281c42fd5f6f2965a26d03eab3e88f2dd02b5d9fb387f7183e4284e2d7be"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SchoolModule-1f863a955da06574b94aeeddfa5c45f6179d0edf9e122b3e1923fe1f2d69810f797b281c42fd5f6f2965a26d03eab3e88f2dd02b5d9fb387f7183e4284e2d7be"' :
                                        'id="xs-injectables-links-module-SchoolModule-1f863a955da06574b94aeeddfa5c45f6179d0edf9e122b3e1923fe1f2d69810f797b281c42fd5f6f2965a26d03eab3e88f2dd02b5d9fb387f7183e4284e2d7be"' }>
                                        <li class="link">
                                            <a href="injectables/SchoolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolYearService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolYearService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SchulconnexClientModule.html" data-type="entity-link" >SchulconnexClientModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ServerConsoleModule.html" data-type="entity-link" >ServerConsoleModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ServerModule.html" data-type="entity-link" >ServerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ServerModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' : 'data-bs-target="#xs-controllers-links-module-ServerModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ServerModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' :
                                            'id="xs-controllers-links-module-ServerModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' }>
                                            <li class="link">
                                                <a href="controllers/ServerController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServerController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ServerTestModule.html" data-type="entity-link" >ServerTestModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ServerTestModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' : 'data-bs-target="#xs-controllers-links-module-ServerTestModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ServerTestModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' :
                                            'id="xs-controllers-links-module-ServerTestModule-5442d5e43476970085580ef6f1a546d7dedebb99047f71d2e91996de28a0cd5702d9ce636118f6afe0e601783d03eadca0dad3311927ab29eee63851b76bd98d"' }>
                                            <li class="link">
                                                <a href="controllers/ServerController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ServerController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharingApiModule.html" data-type="entity-link" >SharingApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' : 'data-bs-target="#xs-controllers-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' :
                                            'id="xs-controllers-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                            <li class="link">
                                                <a href="controllers/ShareTokenController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareTokenController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' : 'data-bs-target="#xs-injectables-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' :
                                        'id="xs-injectables-links-module-SharingApiModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                        <li class="link">
                                            <a href="injectables/ShareTokenUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareTokenUC</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharingModule.html" data-type="entity-link" >SharingModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SharingModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' : 'data-bs-target="#xs-injectables-links-module-SharingModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SharingModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' :
                                        'id="xs-injectables-links-module-SharingModule-07eeea670eb9c376d369d8a5936e19051a512c7f865e92773fac2f15e6f579c293ba2e541a06f88df1b0546758b5dba4a38abe9e4751f53861a92aa91c432d10"' }>
                                        <li class="link">
                                            <a href="injectables/ShareTokenRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareTokenRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ShareTokenService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShareTokenService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TokenGenerator.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TokenGenerator</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SystemApiModule.html" data-type="entity-link" >SystemApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' : 'data-bs-target="#xs-controllers-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' :
                                            'id="xs-controllers-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' }>
                                            <li class="link">
                                                <a href="controllers/SystemController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' : 'data-bs-target="#xs-injectables-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' :
                                        'id="xs-injectables-links-module-SystemApiModule-320e8debbe1d1c6d25edc35f2054f95f9b3ee2a6327c77727279b26136b37488b46bb9823defd90a2eea0efa87b4b7e632993db2d0134facb60829ebbe836671"' }>
                                        <li class="link">
                                            <a href="injectables/SystemUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SystemModule.html" data-type="entity-link" >SystemModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SystemModule-13d78ab2f8c123c79d994a5f0f6b142371c3a8f1a165956b401ce3560ade49fe4a70cad882cca986a45faacbaeeccf0198516a907efbd2e52c42a8633b6e79b6"' : 'data-bs-target="#xs-injectables-links-module-SystemModule-13d78ab2f8c123c79d994a5f0f6b142371c3a8f1a165956b401ce3560ade49fe4a70cad882cca986a45faacbaeeccf0198516a907efbd2e52c42a8633b6e79b6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SystemModule-13d78ab2f8c123c79d994a5f0f6b142371c3a8f1a165956b401ce3560ade49fe4a70cad882cca986a45faacbaeeccf0198516a907efbd2e52c42a8633b6e79b6"' :
                                        'id="xs-injectables-links-module-SystemModule-13d78ab2f8c123c79d994a5f0f6b142371c3a8f1a165956b401ce3560ade49fe4a70cad882cca986a45faacbaeeccf0198516a907efbd2e52c42a8633b6e79b6"' }>
                                        <li class="link">
                                            <a href="injectables/LegacySystemRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySystemRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LegacySystemService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" class="deprecated-name">LegacySystemService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SystemOidcService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemOidcService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SystemRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SystemService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SystemService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TaskApiModule.html" data-type="entity-link" >TaskApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' : 'data-bs-target="#xs-controllers-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' :
                                            'id="xs-controllers-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' }>
                                            <li class="link">
                                                <a href="controllers/SubmissionController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/TaskController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' : 'data-bs-target="#xs-injectables-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' :
                                        'id="xs-injectables-links-module-TaskApiModule-704c55f037a49dc86bbbf6e9625b47475906dc1f137120b29582d2134ad328d5a0f70ca5df4d40746c1d700a038001527b98f484275b6ad92ea7401569e18ea4"' }>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskCopyUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskCopyUC</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskUC.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskUC</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TaskModule.html" data-type="entity-link" >TaskModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TaskModule-ad7f017e72c8f00a494d1bc741be4c3982a2e2336c952da77d6aa161f9f565ea6030e21457936c0df096b902c1f1a271fdeb5cd3f9cd86f25f93a80630e65fb1"' : 'data-bs-target="#xs-injectables-links-module-TaskModule-ad7f017e72c8f00a494d1bc741be4c3982a2e2336c952da77d6aa161f9f565ea6030e21457936c0df096b902c1f1a271fdeb5cd3f9cd86f25f93a80630e65fb1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TaskModule-ad7f017e72c8f00a494d1bc741be4c3982a2e2336c952da77d6aa161f9f565ea6030e21457936c0df096b902c1f1a271fdeb5cd3f9cd86f25f93a80630e65fb1"' :
                                        'id="xs-injectables-links-module-TaskModule-ad7f017e72c8f00a494d1bc741be4c3982a2e2336c952da77d6aa161f9f565ea6030e21457936c0df096b902c1f1a271fdeb5cd3f9cd86f25f93a80630e65fb1"' }>
                                        <li class="link">
                                            <a href="injectables/CourseRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CourseRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SubmissionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SubmissionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskCopyService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskCopyService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TaskService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TaskService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TeamsApiModule.html" data-type="entity-link" >TeamsApiModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/TeamsModule.html" data-type="entity-link" >TeamsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TeamsModule-00d895d8c15350c679367dd662f805e08819b526823ac62ee2b1cec08d7db14795ba5783f0cc426cc951dab1a8c4ee793bf31dcd06c6584b76aff9c60a141481"' : 'data-bs-target="#xs-injectables-links-module-TeamsModule-00d895d8c15350c679367dd662f805e08819b526823ac62ee2b1cec08d7db14795ba5783f0cc426cc951dab1a8c4ee793bf31dcd06c6584b76aff9c60a141481"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TeamsModule-00d895d8c15350c679367dd662f805e08819b526823ac62ee2b1cec08d7db14795ba5783f0cc426cc951dab1a8c4ee793bf31dcd06c6584b76aff9c60a141481"' :
                                        'id="xs-injectables-links-module-TeamsModule-00d895d8c15350c679367dd662f805e08819b526823ac62ee2b1cec08d7db14795ba5783f0cc426cc951dab1a8c4ee793bf31dcd06c6584b76aff9c60a141481"' }>
                                        <li class="link">
                                            <a href="injectables/TeamService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamsRepo</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TldrawClientModule.html" data-type="entity-link" >TldrawClientModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TldrawClientModule-3dd53fc974953afcb0530aa413ec449463354e57ede7c30f60ce0071ea58b7865f27561d8056e6925c7d7ac19519cdd789407cbc5cd091e345cc1471220309bd"' : 'data-bs-target="#xs-injectables-links-module-TldrawClientModule-3dd53fc974953afcb0530aa413ec449463354e57ede7c30f60ce0071ea58b7865f27561d8056e6925c7d7ac19519cdd789407cbc5cd091e345cc1471220309bd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TldrawClientModule-3dd53fc974953afcb0530aa413ec449463354e57ede7c30f60ce0071ea58b7865f27561d8056e6925c7d7ac19519cdd789407cbc5cd091e345cc1471220309bd"' :
                                        'id="xs-injectables-links-module-TldrawClientModule-3dd53fc974953afcb0530aa413ec449463354e57ede7c30f60ce0071ea58b7865f27561d8056e6925c7d7ac19519cdd789407cbc5cd091e345cc1471220309bd"' }>
                                        <li class="link">
                                            <a href="injectables/DrawingElementAdapterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DrawingElementAdapterService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TldrawModule.html" data-type="entity-link" >TldrawModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' : 'data-bs-target="#xs-controllers-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' :
                                            'id="xs-controllers-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' }>
                                            <li class="link">
                                                <a href="controllers/TldrawController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' : 'data-bs-target="#xs-injectables-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' :
                                        'id="xs-injectables-links-module-TldrawModule-3d8d433e7a776172c8cc2f838855affa5120a4a436cb35054d73e883021eb44d70f7dd45a7eed04e31130c2f585327a3c971115c06ae6a567accccf4403975fa"' }>
                                        <li class="link">
                                            <a href="injectables/TldrawBoardRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawBoardRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/YMongodb.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >YMongodb</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TldrawTestModule.html" data-type="entity-link" >TldrawTestModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TldrawTestModule-ea5f3877d8cc549ad986f292e08f61580b0ffc46492045475bf513fb4009dc6c708e669f34c963701a39465b1d674ebb9311255449bca59b7045f0cfc547777e"' : 'data-bs-target="#xs-injectables-links-module-TldrawTestModule-ea5f3877d8cc549ad986f292e08f61580b0ffc46492045475bf513fb4009dc6c708e669f34c963701a39465b1d674ebb9311255449bca59b7045f0cfc547777e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TldrawTestModule-ea5f3877d8cc549ad986f292e08f61580b0ffc46492045475bf513fb4009dc6c708e669f34c963701a39465b1d674ebb9311255449bca59b7045f0cfc547777e"' :
                                        'id="xs-injectables-links-module-TldrawTestModule-ea5f3877d8cc549ad986f292e08f61580b0ffc46492045475bf513fb4009dc6c708e669f34c963701a39465b1d674ebb9311255449bca59b7045f0cfc547777e"' }>
                                        <li class="link">
                                            <a href="injectables/Logger.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Logger</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/MetricsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetricsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRedisFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRedisFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TldrawWsModule.html" data-type="entity-link" >TldrawWsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TldrawWsModule-e53989b818d0b7cb221085d62b5b275962cabc0a48de65dc65c0ed9bb364368e38202f460b4b3b3b60ed1732bf4732b7a1a0dd7db6bcf9d3ac506114402ee9e3"' : 'data-bs-target="#xs-injectables-links-module-TldrawWsModule-e53989b818d0b7cb221085d62b5b275962cabc0a48de65dc65c0ed9bb364368e38202f460b4b3b3b60ed1732bf4732b7a1a0dd7db6bcf9d3ac506114402ee9e3"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TldrawWsModule-e53989b818d0b7cb221085d62b5b275962cabc0a48de65dc65c0ed9bb364368e38202f460b4b3b3b60ed1732bf4732b7a1a0dd7db6bcf9d3ac506114402ee9e3"' :
                                        'id="xs-injectables-links-module-TldrawWsModule-e53989b818d0b7cb221085d62b5b275962cabc0a48de65dc65c0ed9bb364368e38202f460b4b3b3b60ed1732bf4732b7a1a0dd7db6bcf9d3ac506114402ee9e3"' }>
                                        <li class="link">
                                            <a href="injectables/MetricsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetricsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawBoardRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawBoardRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawFilesStorageAdapterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawFilesStorageAdapterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRedisFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRedisFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawWsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawWsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/YMongodb.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >YMongodb</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TldrawWsTestModule.html" data-type="entity-link" >TldrawWsTestModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-TldrawWsTestModule-ea031e80101cc301543d307226e322555a0d1b0f168f81d3105063b5e5091a8b1a16fec51de5f4ddf48b0f6bbee31476aa192c943923c712b80d00d5f8ec5107"' : 'data-bs-target="#xs-injectables-links-module-TldrawWsTestModule-ea031e80101cc301543d307226e322555a0d1b0f168f81d3105063b5e5091a8b1a16fec51de5f4ddf48b0f6bbee31476aa192c943923c712b80d00d5f8ec5107"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TldrawWsTestModule-ea031e80101cc301543d307226e322555a0d1b0f168f81d3105063b5e5091a8b1a16fec51de5f4ddf48b0f6bbee31476aa192c943923c712b80d00d5f8ec5107"' :
                                        'id="xs-injectables-links-module-TldrawWsTestModule-ea031e80101cc301543d307226e322555a0d1b0f168f81d3105063b5e5091a8b1a16fec51de5f4ddf48b0f6bbee31476aa192c943923c712b80d00d5f8ec5107"' }>
                                        <li class="link">
                                            <a href="injectables/MetricsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetricsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawBoardRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawBoardRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawFilesStorageAdapterService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawFilesStorageAdapterService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRedisFactory.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRedisFactory</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TldrawWsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TldrawWsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/YMongodb.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >YMongodb</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ToolApiModule.html" data-type="entity-link" >ToolApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' : 'data-bs-target="#xs-controllers-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' :
                                            'id="xs-controllers-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' }>
                                            <li class="link">
                                                <a href="controllers/ToolConfigurationController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolConfigurationController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ToolContextController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolContextController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ToolController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ToolLaunchController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolLaunchController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ToolReferenceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolReferenceController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/ToolSchoolController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolSchoolController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' : 'data-bs-target="#xs-injectables-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' :
                                        'id="xs-injectables-links-module-ToolApiModule-7f4f3d1c3b55efd4b0a31f43f81985ad7b96f03559a63752acf7da9cfd32c4244c1ba5166b4ca82ff094799c3ffd060f38b8cd07394131faf612778a950f1a3e"' }>
                                        <li class="link">
                                            <a href="injectables/ContextExternalToolUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContextExternalToolUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolConfigurationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolConfigurationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolConfigurationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolConfigurationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolRequestMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolRequestMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolResponseMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolResponseMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ExternalToolUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ExternalToolUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LtiToolRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LtiToolRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolRequestMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolRequestMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolResponseMapper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolResponseMapper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolExternalToolUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolExternalToolUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolLaunchUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolLaunchUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolPermissionHelper.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolPermissionHelper</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolReferenceUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolReferenceUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ToolConfigModule.html" data-type="entity-link" >ToolConfigModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ToolLaunchModule.html" data-type="entity-link" >ToolLaunchModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ToolLaunchModule-4c727b6b72563bf936b0367b8c3d78e0b281d503aff5be150626b5e4fb6c5fe2667906068070c0ba5791b7f879a5be5a09cf4d8f603348473a684b20f84adb0b"' : 'data-bs-target="#xs-injectables-links-module-ToolLaunchModule-4c727b6b72563bf936b0367b8c3d78e0b281d503aff5be150626b5e4fb6c5fe2667906068070c0ba5791b7f879a5be5a09cf4d8f603348473a684b20f84adb0b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ToolLaunchModule-4c727b6b72563bf936b0367b8c3d78e0b281d503aff5be150626b5e4fb6c5fe2667906068070c0ba5791b7f879a5be5a09cf4d8f603348473a684b20f84adb0b"' :
                                        'id="xs-injectables-links-module-ToolLaunchModule-4c727b6b72563bf936b0367b8c3d78e0b281d503aff5be150626b5e4fb6c5fe2667906068070c0ba5791b7f879a5be5a09cf4d8f603348473a684b20f84adb0b"' }>
                                        <li class="link">
                                            <a href="injectables/AutoContextIdStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutoContextIdStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AutoContextNameStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutoContextNameStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AutoSchoolIdStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutoSchoolIdStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AutoSchoolNumberStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutoSchoolNumberStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/BasicToolLaunchStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BasicToolLaunchStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Lti11EncryptionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Lti11EncryptionService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/Lti11ToolLaunchStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >Lti11ToolLaunchStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/OAuth2ToolLaunchStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OAuth2ToolLaunchStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToolLaunchService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToolLaunchService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ToolModule.html" data-type="entity-link" >ToolModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ToolModule-96ecb241e447e0bd44d9c55778bb63e735aa7700f05c73d09d03a6d301b2d2876bf2c255457d665807e4b83b0c9a35898175ffc71871238b245519a43736d71a"' : 'data-bs-target="#xs-injectables-links-module-ToolModule-96ecb241e447e0bd44d9c55778bb63e735aa7700f05c73d09d03a6d301b2d2876bf2c255457d665807e4b83b0c9a35898175ffc71871238b245519a43736d71a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ToolModule-96ecb241e447e0bd44d9c55778bb63e735aa7700f05c73d09d03a6d301b2d2876bf2c255457d665807e4b83b0c9a35898175ffc71871238b245519a43736d71a"' :
                                        'id="xs-injectables-links-module-ToolModule-96ecb241e447e0bd44d9c55778bb63e735aa7700f05c73d09d03a6d301b2d2876bf2c255457d665807e4b83b0c9a35898175ffc71871238b245519a43736d71a"' }>
                                        <li class="link">
                                            <a href="injectables/CommonToolService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonToolService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserAdminApiModule.html" data-type="entity-link" >UserAdminApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' : 'data-bs-target="#xs-controllers-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' :
                                            'id="xs-controllers-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' }>
                                            <li class="link">
                                                <a href="controllers/AdminApiUsersController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminApiUsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' : 'data-bs-target="#xs-injectables-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' :
                                        'id="xs-injectables-links-module-UserAdminApiModule-18bc585015e6fb9e18302b7f61fda13a29deb376df20859d11a4f1d3a90dcf89f4b83a45ede1c8d6615ca4b1fa688044b0afb9e9de9b83230326ab92e294cd28"' }>
                                        <li class="link">
                                            <a href="injectables/AdminApiUserUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminApiUserUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserApiModule.html" data-type="entity-link" >UserApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' : 'data-bs-target="#xs-controllers-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' :
                                            'id="xs-controllers-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' : 'data-bs-target="#xs-injectables-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' :
                                        'id="xs-injectables-links-module-UserApiModule-82897d46dd07e149b40418923c79b4a1b692d2cc5f55fa6409723d8b059165dfef6beff6bd51b1b90d1b6936a291f0970bfc22f81d5750bc454ffdedab919aa5"' }>
                                        <li class="link">
                                            <a href="injectables/UserUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserImportConfigModule.html" data-type="entity-link" >UserImportConfigModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/UserLoginMigrationApiModule.html" data-type="entity-link" >UserLoginMigrationApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' : 'data-bs-target="#xs-controllers-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' :
                                            'id="xs-controllers-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' }>
                                            <li class="link">
                                                <a href="controllers/UserLoginMigrationController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' : 'data-bs-target="#xs-injectables-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' :
                                        'id="xs-injectables-links-module-UserLoginMigrationApiModule-b9548f91f25283b1b8dc56b0e9ff1c5ddbd4549c76d6c242410f6ef33bf07cfdd2b4ba1fcc9e54a3a51ebd380365ed0d8648823519a16d95cadec336c3617029"' }>
                                        <li class="link">
                                            <a href="injectables/CloseUserLoginMigrationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CloseUserLoginMigrationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RestartUserLoginMigrationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RestartUserLoginMigrationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/StartUserLoginMigrationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StartUserLoginMigrationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ToggleUserLoginMigrationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ToggleUserLoginMigrationUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserLoginMigrationUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserLoginMigrationModule.html" data-type="entity-link" >UserLoginMigrationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserLoginMigrationModule-dcc7b997171ae7395d8180d77ed2981940ab823982522f8a9928576465472ee38bdd92b5b3b2f78aa85710633092ed95a951b545138dfaf1779f73cbcf53d50f"' : 'data-bs-target="#xs-injectables-links-module-UserLoginMigrationModule-dcc7b997171ae7395d8180d77ed2981940ab823982522f8a9928576465472ee38bdd92b5b3b2f78aa85710633092ed95a951b545138dfaf1779f73cbcf53d50f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserLoginMigrationModule-dcc7b997171ae7395d8180d77ed2981940ab823982522f8a9928576465472ee38bdd92b5b3b2f78aa85710633092ed95a951b545138dfaf1779f73cbcf53d50f"' :
                                        'id="xs-injectables-links-module-UserLoginMigrationModule-dcc7b997171ae7395d8180d77ed2981940ab823982522f8a9928576465472ee38bdd92b5b3b2f78aa85710633092ed95a951b545138dfaf1779f73cbcf53d50f"' }>
                                        <li class="link">
                                            <a href="injectables/MigrationCheckService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MigrationCheckService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SchoolMigrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchoolMigrationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserLoginMigrationRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserLoginMigrationRevertService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationRevertService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserLoginMigrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserLoginMigrationService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserMigrationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserMigrationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-5be74c8062b48ee5a8aa8d8e82510cf64465f2605ed71ee63499ec90c6d1bbe8e8bb8c1031a1f3d56fcec244821dcebcfededb3f7e6726aa4c8c7ac455020066"' : 'data-bs-target="#xs-injectables-links-module-UserModule-5be74c8062b48ee5a8aa8d8e82510cf64465f2605ed71ee63499ec90c6d1bbe8e8bb8c1031a1f3d56fcec244821dcebcfededb3f7e6726aa4c8c7ac455020066"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-5be74c8062b48ee5a8aa8d8e82510cf64465f2605ed71ee63499ec90c6d1bbe8e8bb8c1031a1f3d56fcec244821dcebcfededb3f7e6726aa4c8c7ac455020066"' :
                                        'id="xs-injectables-links-module-UserModule-5be74c8062b48ee5a8aa8d8e82510cf64465f2605ed71ee63499ec90c6d1bbe8e8bb8c1031a1f3d56fcec244821dcebcfededb3f7e6726aa4c8c7ac455020066"' }>
                                        <li class="link">
                                            <a href="injectables/UserDORepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserDORepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ValidationModule.html" data-type="entity-link" >ValidationModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/VideoConferenceApiModule.html" data-type="entity-link" >VideoConferenceApiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' : 'data-bs-target="#xs-controllers-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' :
                                            'id="xs-controllers-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' }>
                                            <li class="link">
                                                <a href="controllers/VideoConferenceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' : 'data-bs-target="#xs-injectables-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' :
                                        'id="xs-injectables-links-module-VideoConferenceApiModule-190b0be367b996eb8d1d0d5a8282ffcd6be9d5950059325908d5ef02472eaf2ff8500581be9d4c8016476df3368880ac704cf70dad3385822eb294a5f6cc0fd2"' }>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceCreateUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceCreateUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceEndUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceEndUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceInfoUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceInfoUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceJoinUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceJoinUc</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/VideoConferenceModule.html" data-type="entity-link" >VideoConferenceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' : 'data-bs-target="#xs-controllers-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' :
                                            'id="xs-controllers-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' }>
                                            <li class="link">
                                                <a href="controllers/VideoConferenceDeprecatedController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceDeprecatedController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' : 'data-bs-target="#xs-injectables-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' :
                                        'id="xs-injectables-links-module-VideoConferenceModule-84f00fec2bf85b102209794afd0b1233644628fd089065c338bb967134ef8e9b50b7850ffa8f799646954850b9bfabdec4a78eacfcf0c059273a7e5b66dd6514"' }>
                                        <li class="link">
                                            <a href="injectables/BBBService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BBBService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ConverterUtil.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConverterUtil</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TeamsRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TeamsRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceDeprecatedUc.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceDeprecatedUc</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceRepo.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceRepo</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/VideoConferenceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VideoConferenceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/BoardController.html" data-type="entity-link" >BoardController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/BoardSubmissionController.html" data-type="entity-link" >BoardSubmissionController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/CardController.html" data-type="entity-link" >CardController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/CollaborativeStorageController.html" data-type="entity-link" >CollaborativeStorageController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ColumnController.html" data-type="entity-link" >ColumnController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ElementController.html" data-type="entity-link" >ElementController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FileSecurityController.html" data-type="entity-link" >FileSecurityController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/FilesStorageController.html" data-type="entity-link" >FilesStorageController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/GroupController.html" data-type="entity-link" >GroupController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/LessonController.html" data-type="entity-link" >LessonController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/MeController.html" data-type="entity-link" >MeController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/MetaTagExtractorController.html" data-type="entity-link" >MetaTagExtractorController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/SchoolController.html" data-type="entity-link" >SchoolController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/SchoolController-1.html" data-type="entity-link" >SchoolController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ServerController.html" data-type="entity-link" >ServerController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/SubmissionController.html" data-type="entity-link" >SubmissionController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/SystemController.html" data-type="entity-link" >SystemController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/TaskController.html" data-type="entity-link" >TaskController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/TldrawController.html" data-type="entity-link" >TldrawController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ToolConfigurationController.html" data-type="entity-link" >ToolConfigurationController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ToolContextController.html" data-type="entity-link" >ToolContextController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ToolController.html" data-type="entity-link" >ToolController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/ToolSchoolController.html" data-type="entity-link" >ToolSchoolController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/UserController.html" data-type="entity-link" >UserController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/VideoConferenceController.html" data-type="entity-link" >VideoConferenceController</a>
                                </li>
                                <li class="link">
                                    <a href="controllers/VideoConferenceDeprecatedController.html" data-type="entity-link" >VideoConferenceDeprecatedController</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#entities-links"' :
                                'data-bs-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/Account.html" data-type="entity-link" >Account</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Board.html" data-type="entity-link" >Board</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BoardElement.html" data-type="entity-link" >BoardElement</a>
                                </li>
                                <li class="link">
                                    <a href="entities/BoardNode.html" data-type="entity-link" >BoardNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CardNode.html" data-type="entity-link" >CardNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ClassEntity.html" data-type="entity-link" >ClassEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ColumnboardBoardElement.html" data-type="entity-link" >ColumnboardBoardElement</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ColumnBoardNode.html" data-type="entity-link" >ColumnBoardNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ColumnBoardTarget.html" data-type="entity-link" >ColumnBoardTarget</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ColumnNode.html" data-type="entity-link" >ColumnNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ContextExternalToolEntity.html" data-type="entity-link" >ContextExternalToolEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Course.html" data-type="entity-link" >Course</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CourseGroup.html" data-type="entity-link" >CourseGroup</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CourseNews.html" data-type="entity-link" >CourseNews</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DashboardGridElementModel.html" data-type="entity-link" >DashboardGridElementModel</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DashboardModelEntity.html" data-type="entity-link" >DashboardModelEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeletionLogEntity.html" data-type="entity-link" >DeletionLogEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeletionRequestEntity.html" data-type="entity-link" >DeletionRequestEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DrawingElementNode.html" data-type="entity-link" >DrawingElementNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ExternalToolElementNodeEntity.html" data-type="entity-link" >ExternalToolElementNodeEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ExternalToolEntity.html" data-type="entity-link" >ExternalToolEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ExternalToolPseudonymEntity.html" data-type="entity-link" >ExternalToolPseudonymEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FederalStateEntity.html" data-type="entity-link" >FederalStateEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FileElementNode.html" data-type="entity-link" >FileElementNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FileEntity.html" data-type="entity-link" >FileEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/FileRecord.html" data-type="entity-link" >FileRecord</a>
                                </li>
                                <li class="link">
                                    <a href="entities/GroupEntity.html" data-type="entity-link" >GroupEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/H5PContent.html" data-type="entity-link" >H5PContent</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ImportUser.html" data-type="entity-link" >ImportUser</a>
                                </li>
                                <li class="link">
                                    <a href="entities/InstalledLibrary.html" data-type="entity-link" >InstalledLibrary</a>
                                </li>
                                <li class="link">
                                    <a href="entities/LessonBoardElement.html" data-type="entity-link" >LessonBoardElement</a>
                                </li>
                                <li class="link">
                                    <a href="entities/LessonEntity.html" data-type="entity-link" >LessonEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/LinkElementNode.html" data-type="entity-link" >LinkElementNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/LtiTool.html" data-type="entity-link" >LtiTool</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Material.html" data-type="entity-link" >Material</a>
                                </li>
                                <li class="link">
                                    <a href="entities/News.html" data-type="entity-link" >News</a>
                                </li>
                                <li class="link">
                                    <a href="entities/PseudonymEntity.html" data-type="entity-link" >PseudonymEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/RegistrationPinEntity.html" data-type="entity-link" >RegistrationPinEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/RichTextElementNode.html" data-type="entity-link" >RichTextElementNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/RocketChatUserEntity.html" data-type="entity-link" >RocketChatUserEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Role.html" data-type="entity-link" >Role</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolEntity.html" data-type="entity-link" >SchoolEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolExternalToolEntity.html" data-type="entity-link" >SchoolExternalToolEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolNews.html" data-type="entity-link" >SchoolNews</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolSystemOptionsEntity.html" data-type="entity-link" >SchoolSystemOptionsEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SchoolYearEntity.html" data-type="entity-link" >SchoolYearEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ShareToken.html" data-type="entity-link" >ShareToken</a>
                                </li>
                                <li class="link">
                                    <a href="entities/StorageProviderEntity.html" data-type="entity-link" >StorageProviderEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Submission.html" data-type="entity-link" >Submission</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SubmissionContainerElementNode.html" data-type="entity-link" >SubmissionContainerElementNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SubmissionItemNode.html" data-type="entity-link" >SubmissionItemNode</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SystemEntity.html" data-type="entity-link" >SystemEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Task.html" data-type="entity-link" >Task</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TaskBoardElement.html" data-type="entity-link" >TaskBoardElement</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TeamEntity.html" data-type="entity-link" >TeamEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TeamNews.html" data-type="entity-link" >TeamNews</a>
                                </li>
                                <li class="link">
                                    <a href="entities/TldrawDrawing.html" data-type="entity-link" >TldrawDrawing</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserLoginMigrationEntity.html" data-type="entity-link" >UserLoginMigrationEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/VideoConference.html" data-type="entity-link" >VideoConference</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AbstractAccountService.html" data-type="entity-link" >AbstractAccountService</a>
                            </li>
                            <li class="link">
                                <a href="classes/AbstractUrlHandler.html" data-type="entity-link" >AbstractUrlHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/AcceptQuery.html" data-type="entity-link" >AcceptQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/Account.html" data-type="entity-link" >Account</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountByIdBodyParams.html" data-type="entity-link" >AccountByIdBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountByIdParams.html" data-type="entity-link" >AccountByIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountDto.html" data-type="entity-link" >AccountDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountEntityToDtoMapper.html" data-type="entity-link" >AccountEntityToDtoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountFactory.html" data-type="entity-link" >AccountFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountIdmToDtoMapperDb.html" data-type="entity-link" >AccountIdmToDtoMapperDb</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountIdmToDtoMapperIdm.html" data-type="entity-link" >AccountIdmToDtoMapperIdm</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountResponse.html" data-type="entity-link" >AccountResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountResponseMapper.html" data-type="entity-link" >AccountResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountSaveDto.html" data-type="entity-link" >AccountSaveDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountSearchListResponse.html" data-type="entity-link" >AccountSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AccountSearchQueryParams.html" data-type="entity-link" >AccountSearchQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiSchoolCreateBodyParams.html" data-type="entity-link" >AdminApiSchoolCreateBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiSchoolCreateNoIdErrorLoggable.html" data-type="entity-link" >AdminApiSchoolCreateNoIdErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiSchoolCreateResponseDto.html" data-type="entity-link" >AdminApiSchoolCreateResponseDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiSchoolMapper.html" data-type="entity-link" >AdminApiSchoolMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiUserCreateBodyParams.html" data-type="entity-link" >AdminApiUserCreateBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AdminApiUserCreateResponse.html" data-type="entity-link" >AdminApiUserCreateResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AjaxGetQueryParams.html" data-type="entity-link" >AjaxGetQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AjaxPostQueryParams.html" data-type="entity-link" >AjaxPostQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiValidationError.html" data-type="entity-link" >ApiValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiValidationErrorResponse.html" data-type="entity-link" >ApiValidationErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppStartLoggable.html" data-type="entity-link" >AppStartLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthCodeFailureLoggableException.html" data-type="entity-link" >AuthCodeFailureLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthenticationCodeGrantTokenRequest.html" data-type="entity-link" >AuthenticationCodeGrantTokenRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthenticationValues.html" data-type="entity-link" >AuthenticationValues</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthorizationContextBuilder.html" data-type="entity-link" >AuthorizationContextBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthorizationError.html" data-type="entity-link" >AuthorizationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthorizationParams.html" data-type="entity-link" >AuthorizationParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/AxiosErrorFactory.html" data-type="entity-link" >AxiosErrorFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/AxiosErrorLoggable.html" data-type="entity-link" >AxiosErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/AxiosResponseImp.html" data-type="entity-link" >AxiosResponseImp</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseDO.html" data-type="entity-link" class="deprecated-name">BaseDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseDomainObject.html" data-type="entity-link" class="deprecated-name">BaseDomainObject</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseEntity.html" data-type="entity-link" >BaseEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseEntityWithTimestamps.html" data-type="entity-link" >BaseEntityWithTimestamps</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseFactory.html" data-type="entity-link" >BaseFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseProvisioningOptions.html" data-type="entity-link" >BaseProvisioningOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseUc.html" data-type="entity-link" >BaseUc</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasicToolConfig.html" data-type="entity-link" >BasicToolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasicToolConfigEntity.html" data-type="entity-link" >BasicToolConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasicToolConfigParams.html" data-type="entity-link" >BasicToolConfigParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasicToolConfigResponse.html" data-type="entity-link" >BasicToolConfigResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BatchDeletionSummaryBuilder.html" data-type="entity-link" >BatchDeletionSummaryBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BatchDeletionSummaryDetailBuilder.html" data-type="entity-link" >BatchDeletionSummaryDetailBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BBBBaseMeetingConfig.html" data-type="entity-link" >BBBBaseMeetingConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BBBCreateConfig.html" data-type="entity-link" >BBBCreateConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BBBCreateConfigBuilder.html" data-type="entity-link" >BBBCreateConfigBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BBBJoinConfig.html" data-type="entity-link" >BBBJoinConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/BBBJoinConfigBuilder.html" data-type="entity-link" >BBBJoinConfigBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardColumnBoardResponse.html" data-type="entity-link" >BoardColumnBoardResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardComposite.html" data-type="entity-link" >BoardComposite</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardContextResponse.html" data-type="entity-link" >BoardContextResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardDoAuthorizable.html" data-type="entity-link" >BoardDoAuthorizable</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardDoBuilderImpl.html" data-type="entity-link" >BoardDoBuilderImpl</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardElementResponse.html" data-type="entity-link" >BoardElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardLessonResponse.html" data-type="entity-link" >BoardLessonResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardManagementConsole.html" data-type="entity-link" >BoardManagementConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardResponse.html" data-type="entity-link" >BoardResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardResponseMapper.html" data-type="entity-link" >BoardResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardTaskResponse.html" data-type="entity-link" >BoardTaskResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardTaskStatusMapper.html" data-type="entity-link" >BoardTaskStatusMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardTaskStatusResponse.html" data-type="entity-link" >BoardTaskStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoardUrlParams.html" data-type="entity-link" >BoardUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/BruteForceError.html" data-type="entity-link" >BruteForceError</a>
                            </li>
                            <li class="link">
                                <a href="classes/Builder.html" data-type="entity-link" >Builder</a>
                            </li>
                            <li class="link">
                                <a href="classes/BusinessError.html" data-type="entity-link" >BusinessError</a>
                            </li>
                            <li class="link">
                                <a href="classes/CalendarEventDto.html" data-type="entity-link" >CalendarEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Card.html" data-type="entity-link" >Card</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardIdsParams.html" data-type="entity-link" >CardIdsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardListResponse.html" data-type="entity-link" >CardListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardResponse.html" data-type="entity-link" >CardResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardResponseMapper.html" data-type="entity-link" >CardResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardSkeletonResponse.html" data-type="entity-link" >CardSkeletonResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CardUrlParams.html" data-type="entity-link" >CardUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChallengeParams.html" data-type="entity-link" >ChallengeParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChangeLanguageParams.html" data-type="entity-link" >ChangeLanguageParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Class.html" data-type="entity-link" >Class</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassCallerParams.html" data-type="entity-link" >ClassCallerParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassEntity.html" data-type="entity-link" >ClassEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassEntityFactory.html" data-type="entity-link" >ClassEntityFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassFactory.html" data-type="entity-link" >ClassFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassFilterParams.html" data-type="entity-link" >ClassFilterParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassInfoDto.html" data-type="entity-link" >ClassInfoDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassInfoResponse.html" data-type="entity-link" >ClassInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassInfoSearchListResponse.html" data-type="entity-link" >ClassInfoSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassMapper.html" data-type="entity-link" >ClassMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassSortParams.html" data-type="entity-link" >ClassSortParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassSourceOptions.html" data-type="entity-link" >ClassSourceOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClassSourceOptionsEntity.html" data-type="entity-link" >ClassSourceOptionsEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClientCredentialsGrantTokenRequest.html" data-type="entity-link" >ClientCredentialsGrantTokenRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/CloseConnectionLoggable.html" data-type="entity-link" >CloseConnectionLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/Column.html" data-type="entity-link" >Column</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnBoard.html" data-type="entity-link" >ColumnBoard</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnBoardFactory.html" data-type="entity-link" >ColumnBoardFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnResponse.html" data-type="entity-link" >ColumnResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnResponseMapper.html" data-type="entity-link" >ColumnResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnUrlParams.html" data-type="entity-link" >ColumnUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeFileBuilder.html" data-type="entity-link" >CommonCartridgeFileBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeLtiResource.html" data-type="entity-link" >CommonCartridgeLtiResource</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeManifestElement.html" data-type="entity-link" >CommonCartridgeManifestElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeMetadataElement.html" data-type="entity-link" >CommonCartridgeMetadataElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeOrganizationBuilder.html" data-type="entity-link" >CommonCartridgeOrganizationBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeOrganizationItemElement.html" data-type="entity-link" >CommonCartridgeOrganizationItemElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeOrganizationWrapperElement.html" data-type="entity-link" >CommonCartridgeOrganizationWrapperElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeResourceItemElement.html" data-type="entity-link" >CommonCartridgeResourceItemElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeResourceWrapperElement.html" data-type="entity-link" >CommonCartridgeResourceWrapperElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeWebContentResource.html" data-type="entity-link" >CommonCartridgeWebContentResource</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommonCartridgeWebLinkResourceElement.html" data-type="entity-link" >CommonCartridgeWebLinkResourceElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConsentRequestBody.html" data-type="entity-link" >ConsentRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConsentResponse.html" data-type="entity-link" >ConsentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConsentSessionResponse.html" data-type="entity-link" >ConsentSessionResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContentBodyParams.html" data-type="entity-link" >ContentBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContentElementResponseFactory.html" data-type="entity-link" >ContentElementResponseFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContentElementUrlParams.html" data-type="entity-link" >ContentElementUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContentFileUrlParams.html" data-type="entity-link" >ContentFileUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContentMetadata.html" data-type="entity-link" >ContentMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalTool.html" data-type="entity-link" >ContextExternalTool</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolConfigurationStatus.html" data-type="entity-link" >ContextExternalToolConfigurationStatus</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolConfigurationStatusResponse.html" data-type="entity-link" >ContextExternalToolConfigurationStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolConfigurationTemplateListResponse.html" data-type="entity-link" >ContextExternalToolConfigurationTemplateListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolConfigurationTemplateResponse.html" data-type="entity-link" >ContextExternalToolConfigurationTemplateResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolContextParams.html" data-type="entity-link" >ContextExternalToolContextParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolCountPerContextResponse.html" data-type="entity-link" >ContextExternalToolCountPerContextResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolFactory.html" data-type="entity-link" >ContextExternalToolFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolIdParams.html" data-type="entity-link" >ContextExternalToolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolIdParams-1.html" data-type="entity-link" >ContextExternalToolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolPostParams.html" data-type="entity-link" >ContextExternalToolPostParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolRequestMapper.html" data-type="entity-link" >ContextExternalToolRequestMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolResponse.html" data-type="entity-link" >ContextExternalToolResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolResponseMapper.html" data-type="entity-link" >ContextExternalToolResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolScope.html" data-type="entity-link" >ContextExternalToolScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextExternalToolSearchListResponse.html" data-type="entity-link" >ContextExternalToolSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextRef.html" data-type="entity-link" >ContextRef</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContextRefParams.html" data-type="entity-link" >ContextRefParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CookiesDto.html" data-type="entity-link" >CookiesDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyApiResponse.html" data-type="entity-link" >CopyApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFileDto.html" data-type="entity-link" >CopyFileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFileListResponse.html" data-type="entity-link" >CopyFileListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFileParams.html" data-type="entity-link" >CopyFileParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFileResponse.html" data-type="entity-link" >CopyFileResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFileResponseBuilder.html" data-type="entity-link" >CopyFileResponseBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFilesOfParentParamBuilder.html" data-type="entity-link" >CopyFilesOfParentParamBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFilesOfParentParams.html" data-type="entity-link" >CopyFilesOfParentParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyFilesOfParentPayload.html" data-type="entity-link" >CopyFilesOfParentPayload</a>
                            </li>
                            <li class="link">
                                <a href="classes/CopyMapper.html" data-type="entity-link" >CopyMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/County.html" data-type="entity-link" >County</a>
                            </li>
                            <li class="link">
                                <a href="classes/CountyEmbeddable.html" data-type="entity-link" >CountyEmbeddable</a>
                            </li>
                            <li class="link">
                                <a href="classes/CountyEmbeddableMapper.html" data-type="entity-link" >CountyEmbeddableMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CountyResponse.html" data-type="entity-link" >CountyResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CountyResponseMapper.html" data-type="entity-link" >CountyResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseFactory.html" data-type="entity-link" >CourseFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseGroup.html" data-type="entity-link" >CourseGroup</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseGroupFactory.html" data-type="entity-link" >CourseGroupFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseMapper.html" data-type="entity-link" >CourseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseMetadataListResponse.html" data-type="entity-link" >CourseMetadataListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseMetadataResponse.html" data-type="entity-link" >CourseMetadataResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseQueryParams.html" data-type="entity-link" >CourseQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseScope.html" data-type="entity-link" >CourseScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/CourseUrlParams.html" data-type="entity-link" >CourseUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateCardBodyParams.html" data-type="entity-link" >CreateCardBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateContentElementBodyParams.html" data-type="entity-link" >CreateContentElementBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateNewsParams.html" data-type="entity-link" >CreateNewsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateSubmissionItemBodyParams.html" data-type="entity-link" >CreateSubmissionItemBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CurrentUserMapper.html" data-type="entity-link" >CurrentUserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomLtiPropertyDO.html" data-type="entity-link" >CustomLtiPropertyDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameter.html" data-type="entity-link" >CustomParameter</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterEntity.html" data-type="entity-link" >CustomParameterEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterEntry.html" data-type="entity-link" >CustomParameterEntry</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterEntryEntity.html" data-type="entity-link" >CustomParameterEntryEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterEntryParam.html" data-type="entity-link" >CustomParameterEntryParam</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterEntryResponse.html" data-type="entity-link" >CustomParameterEntryResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterFactory.html" data-type="entity-link" >CustomParameterFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterPostParams.html" data-type="entity-link" >CustomParameterPostParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/CustomParameterResponse.html" data-type="entity-link" >CustomParameterResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardEntity.html" data-type="entity-link" >DashboardEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardGridElementResponse.html" data-type="entity-link" >DashboardGridElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardGridSubElementResponse.html" data-type="entity-link" >DashboardGridSubElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardMapper.html" data-type="entity-link" >DashboardMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardResponse.html" data-type="entity-link" >DashboardResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DashboardUrlParams.html" data-type="entity-link" >DashboardUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseManagementConsole.html" data-type="entity-link" >DatabaseManagementConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/DataDeletionDomainOperationLoggable.html" data-type="entity-link" >DataDeletionDomainOperationLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeleteFilesConsole.html" data-type="entity-link" >DeleteFilesConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionErrorLoggableException.html" data-type="entity-link" >DeletionErrorLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionExecutionConsole.html" data-type="entity-link" >DeletionExecutionConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionExecutionParams.html" data-type="entity-link" >DeletionExecutionParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionExecutionTriggerResultBuilder.html" data-type="entity-link" >DeletionExecutionTriggerResultBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionLog.html" data-type="entity-link" >DeletionLog</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionLogMapper.html" data-type="entity-link" >DeletionLogMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionLogStatisticBuilder.html" data-type="entity-link" >DeletionLogStatisticBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionQueueConsole.html" data-type="entity-link" >DeletionQueueConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequest.html" data-type="entity-link" >DeletionRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestBodyProps.html" data-type="entity-link" >DeletionRequestBodyProps</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestBodyPropsBuilder.html" data-type="entity-link" >DeletionRequestBodyPropsBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestEntity.html" data-type="entity-link" >DeletionRequestEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestFactory.html" data-type="entity-link" >DeletionRequestFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestInputBuilder.html" data-type="entity-link" >DeletionRequestInputBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestLogResponse.html" data-type="entity-link" >DeletionRequestLogResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestLogResponseBuilder.html" data-type="entity-link" >DeletionRequestLogResponseBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestMapper.html" data-type="entity-link" >DeletionRequestMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestOutputBuilder.html" data-type="entity-link" >DeletionRequestOutputBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestResponse.html" data-type="entity-link" >DeletionRequestResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestScope.html" data-type="entity-link" >DeletionRequestScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionRequestTargetRefInputBuilder.html" data-type="entity-link" >DeletionRequestTargetRefInputBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeletionTargetRefBuilder.html" data-type="entity-link" >DeletionTargetRefBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeprecatedVideoConferenceInfoResponse.html" data-type="entity-link" class="deprecated-name">DeprecatedVideoConferenceInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeprecatedVideoConferenceJoinResponse.html" data-type="entity-link" class="deprecated-name">DeprecatedVideoConferenceJoinResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DoBaseFactory.html" data-type="entity-link" >DoBaseFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/DomainObject.html" data-type="entity-link" >DomainObject</a>
                            </li>
                            <li class="link">
                                <a href="classes/DomainObjectFactory.html" data-type="entity-link" >DomainObjectFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/DomainOperationBuilder.html" data-type="entity-link" >DomainOperationBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DownloadFileParams.html" data-type="entity-link" >DownloadFileParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingContentBody.html" data-type="entity-link" >DrawingContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingElement.html" data-type="entity-link" >DrawingElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingElementContent.html" data-type="entity-link" >DrawingElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingElementContentBody.html" data-type="entity-link" >DrawingElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingElementResponse.html" data-type="entity-link" >DrawingElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/DrawingElementResponseMapper.html" data-type="entity-link" >DrawingElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DtoCreator.html" data-type="entity-link" >DtoCreator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ElementContentBody.html" data-type="entity-link" >ElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/EntityNotFoundError.html" data-type="entity-link" >EntityNotFoundError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorLoggable.html" data-type="entity-link" >ErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorMapper.html" data-type="entity-link" >ErrorMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorResponse.html" data-type="entity-link" >ErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorUtils.html" data-type="entity-link" >ErrorUtils</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalGroupDto.html" data-type="entity-link" >ExternalGroupDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalGroupUserDto.html" data-type="entity-link" >ExternalGroupUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSchoolDto.html" data-type="entity-link" >ExternalSchoolDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSchoolNumberMissingLoggableException.html" data-type="entity-link" >ExternalSchoolNumberMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSource.html" data-type="entity-link" >ExternalSource</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSourceEntity.html" data-type="entity-link" >ExternalSourceEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSourceResponse.html" data-type="entity-link" >ExternalSourceResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalTool.html" data-type="entity-link" >ExternalTool</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolConfig.html" data-type="entity-link" >ExternalToolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolConfigCreateParams.html" data-type="entity-link" >ExternalToolConfigCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolConfigEntity.html" data-type="entity-link" >ExternalToolConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolConfigResponse.html" data-type="entity-link" >ExternalToolConfigResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolContentBody.html" data-type="entity-link" >ExternalToolContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolCreateParams.html" data-type="entity-link" >ExternalToolCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolDatasheetMapper.html" data-type="entity-link" >ExternalToolDatasheetMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolDatasheetTemplateData.html" data-type="entity-link" >ExternalToolDatasheetTemplateData</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolDatasheetTemplateDataFactory.html" data-type="entity-link" >ExternalToolDatasheetTemplateDataFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolElement.html" data-type="entity-link" >ExternalToolElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolElementContent.html" data-type="entity-link" >ExternalToolElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolElementContentBody.html" data-type="entity-link" >ExternalToolElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolElementResponse.html" data-type="entity-link" >ExternalToolElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolElementResponseMapper.html" data-type="entity-link" >ExternalToolElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolEntityFactory.html" data-type="entity-link" >ExternalToolEntityFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolFactory.html" data-type="entity-link" >ExternalToolFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolIdParams.html" data-type="entity-link" >ExternalToolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogo.html" data-type="entity-link" >ExternalToolLogo</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoFetchedLoggable.html" data-type="entity-link" >ExternalToolLogoFetchedLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoFetchFailedLoggableException.html" data-type="entity-link" >ExternalToolLogoFetchFailedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoNotFoundLoggableException.html" data-type="entity-link" >ExternalToolLogoNotFoundLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoService.html" data-type="entity-link" >ExternalToolLogoService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoSizeExceededLoggableException.html" data-type="entity-link" >ExternalToolLogoSizeExceededLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolLogoWrongFileTypeLoggableException.html" data-type="entity-link" >ExternalToolLogoWrongFileTypeLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolMetadata.html" data-type="entity-link" >ExternalToolMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolMetadataMapper.html" data-type="entity-link" >ExternalToolMetadataMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolMetadataResponse.html" data-type="entity-link" >ExternalToolMetadataResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolParameterDatasheetTemplateData.html" data-type="entity-link" >ExternalToolParameterDatasheetTemplateData</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolPseudonymEntity.html" data-type="entity-link" >ExternalToolPseudonymEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolRepoMapper.html" data-type="entity-link" >ExternalToolRepoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolResponse.html" data-type="entity-link" >ExternalToolResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolScope.html" data-type="entity-link" >ExternalToolScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolSearchListResponse.html" data-type="entity-link" >ExternalToolSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolSearchParams.html" data-type="entity-link" >ExternalToolSearchParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolSortingMapper.html" data-type="entity-link" >ExternalToolSortingMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalToolUpdateParams.html" data-type="entity-link" >ExternalToolUpdateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalUserDto.html" data-type="entity-link" >ExternalUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FederalState.html" data-type="entity-link" >FederalState</a>
                            </li>
                            <li class="link">
                                <a href="classes/FederalStateEntityMapper.html" data-type="entity-link" >FederalStateEntityMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FederalStateResponse.html" data-type="entity-link" >FederalStateResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/FederalStateResponseMapper.html" data-type="entity-link" >FederalStateResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileContentBody.html" data-type="entity-link" >FileContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileDto.html" data-type="entity-link" >FileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileDto-1.html" data-type="entity-link" >FileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileDtoBuilder.html" data-type="entity-link" >FileDtoBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileElement.html" data-type="entity-link" >FileElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileElementContent.html" data-type="entity-link" >FileElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileElementContentBody.html" data-type="entity-link" >FileElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileElementResponse.html" data-type="entity-link" >FileElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileElementResponseMapper.html" data-type="entity-link" >FileElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileEntity.html" data-type="entity-link" >FileEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileMetadata.html" data-type="entity-link" >FileMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileParamBuilder.html" data-type="entity-link" >FileParamBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileParams.html" data-type="entity-link" >FileParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilePermissionEntity.html" data-type="entity-link" >FilePermissionEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecord.html" data-type="entity-link" >FileRecord</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordFactory.html" data-type="entity-link" >FileRecordFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordListResponse.html" data-type="entity-link" >FileRecordListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordMapper.html" data-type="entity-link" >FileRecordMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordParams.html" data-type="entity-link" >FileRecordParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordResponse.html" data-type="entity-link" >FileRecordResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordScope.html" data-type="entity-link" >FileRecordScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileRecordSecurityCheck.html" data-type="entity-link" >FileRecordSecurityCheck</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileResponseBuilder.html" data-type="entity-link" >FileResponseBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileSecurityCheckEntity.html" data-type="entity-link" >FileSecurityCheckEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilesStorageClientMapper.html" data-type="entity-link" >FilesStorageClientMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilesStorageMapper.html" data-type="entity-link" >FilesStorageMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileUrlParams.html" data-type="entity-link" >FileUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterImportUserParams.html" data-type="entity-link" >FilterImportUserParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterNewsParams.html" data-type="entity-link" >FilterNewsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterUserParams.html" data-type="entity-link" >FilterUserParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForbiddenLoggableException.html" data-type="entity-link" >ForbiddenLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForbiddenOperationError.html" data-type="entity-link" >ForbiddenOperationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetFwuLearningContentParams.html" data-type="entity-link" >GetFwuLearningContentParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetH5PContentParams.html" data-type="entity-link" >GetH5PContentParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetH5PEditorParams.html" data-type="entity-link" >GetH5PEditorParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetH5PEditorParamsCreate.html" data-type="entity-link" >GetH5PEditorParamsCreate</a>
                            </li>
                            <li class="link">
                                <a href="classes/GetMetaTagDataBody.html" data-type="entity-link" >GetMetaTagDataBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/GlobalErrorFilter.html" data-type="entity-link" >GlobalErrorFilter</a>
                            </li>
                            <li class="link">
                                <a href="classes/GlobalValidationPipe.html" data-type="entity-link" >GlobalValidationPipe</a>
                            </li>
                            <li class="link">
                                <a href="classes/GridElement.html" data-type="entity-link" >GridElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/Group.html" data-type="entity-link" >Group</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupDomainMapper.html" data-type="entity-link" >GroupDomainMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupIdParams.html" data-type="entity-link" >GroupIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupPaginationParams.html" data-type="entity-link" >GroupPaginationParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupResponse.html" data-type="entity-link" >GroupResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupResponseMapper.html" data-type="entity-link" >GroupResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupRoleUnknownLoggable.html" data-type="entity-link" >GroupRoleUnknownLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupScope.html" data-type="entity-link" >GroupScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupUcMapper.html" data-type="entity-link" >GroupUcMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupUser.html" data-type="entity-link" >GroupUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupUserEntity.html" data-type="entity-link" >GroupUserEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupUserResponse.html" data-type="entity-link" >GroupUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupValidPeriodEntity.html" data-type="entity-link" >GroupValidPeriodEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/GuardAgainst.html" data-type="entity-link" >GuardAgainst</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PContentFactory.html" data-type="entity-link" >H5PContentFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PContentMapper.html" data-type="entity-link" >H5PContentMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PContentMetadata.html" data-type="entity-link" >H5PContentMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PEditorModelContentResponse.html" data-type="entity-link" >H5PEditorModelContentResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PEditorModelResponse.html" data-type="entity-link" >H5PEditorModelResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PErrorMapper.html" data-type="entity-link" >H5PErrorMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5pFileDto.html" data-type="entity-link" >H5pFileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/H5PSaveResponse.html" data-type="entity-link" >H5PSaveResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/HydraOauthFailedLoggableException.html" data-type="entity-link" >HydraOauthFailedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/HydraRedirectDto.html" data-type="entity-link" >HydraRedirectDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdentityManagementOauthService.html" data-type="entity-link" >IdentityManagementOauthService</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdentityManagementService.html" data-type="entity-link" >IdentityManagementService</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdParams.html" data-type="entity-link" >IdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdTokenCreationLoggableException.html" data-type="entity-link" >IdTokenCreationLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdTokenExtractionFailureLoggableException.html" data-type="entity-link" >IdTokenExtractionFailureLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdTokenInvalidLoggableException.html" data-type="entity-link" >IdTokenInvalidLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/IdTokenUserNotFoundLoggableException.html" data-type="entity-link" >IdTokenUserNotFoundLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUser.html" data-type="entity-link" >ImportUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserFactory.html" data-type="entity-link" >ImportUserFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserListResponse.html" data-type="entity-link" >ImportUserListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserMapper.html" data-type="entity-link" >ImportUserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserMatchMapper.html" data-type="entity-link" >ImportUserMatchMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserResponse.html" data-type="entity-link" >ImportUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserScope.html" data-type="entity-link" >ImportUserScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/ImportUserUrlParams.html" data-type="entity-link" >ImportUserUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvalidOriginForLogoutUrlLoggableException.html" data-type="entity-link" >InvalidOriginForLogoutUrlLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvalidUserLoginMigrationLoggableException.html" data-type="entity-link" >InvalidUserLoginMigrationLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/IservMapper.html" data-type="entity-link" >IservMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/JwtExtractor.html" data-type="entity-link" >JwtExtractor</a>
                            </li>
                            <li class="link">
                                <a href="classes/JwtTestFactory.html" data-type="entity-link" >JwtTestFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/KeycloakAdministration.html" data-type="entity-link" >KeycloakAdministration</a>
                            </li>
                            <li class="link">
                                <a href="classes/KeycloakConfiguration.html" data-type="entity-link" >KeycloakConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="classes/KeycloakConsole.html" data-type="entity-link" >KeycloakConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/KeycloakSeedService.html" data-type="entity-link" >KeycloakSeedService</a>
                            </li>
                            <li class="link">
                                <a href="classes/KeyFactory.html" data-type="entity-link" >KeyFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapAlreadyPersistedException.html" data-type="entity-link" >LdapAlreadyPersistedException</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapAuthorizationBodyParams.html" data-type="entity-link" >LdapAuthorizationBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapConfig.html" data-type="entity-link" >LdapConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapConfigEntity.html" data-type="entity-link" >LdapConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapConnectionError.html" data-type="entity-link" >LdapConnectionError</a>
                            </li>
                            <li class="link">
                                <a href="classes/LdapUserMigrationException.html" data-type="entity-link" >LdapUserMigrationException</a>
                            </li>
                            <li class="link">
                                <a href="classes/LegacySchoolDo.html" data-type="entity-link" class="deprecated-name">LegacySchoolDo</a>
                            </li>
                            <li class="link">
                                <a href="classes/LegacySchoolFactory.html" data-type="entity-link" >LegacySchoolFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonCopyApiParams.html" data-type="entity-link" >LessonCopyApiParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonFactory.html" data-type="entity-link" >LessonFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonMapper.html" data-type="entity-link" >LessonMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonMetadataListResponse.html" data-type="entity-link" >LessonMetadataListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonMetadataResponse.html" data-type="entity-link" >LessonMetadataResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonScope.html" data-type="entity-link" >LessonScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonsUrlParams.html" data-type="entity-link" >LessonsUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonUrlParams.html" data-type="entity-link" >LessonUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LessonUrlParams-1.html" data-type="entity-link" >LessonUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LibrariesBodyParams.html" data-type="entity-link" >LibrariesBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LibraryFileUrlParams.html" data-type="entity-link" >LibraryFileUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LibraryName.html" data-type="entity-link" >LibraryName</a>
                            </li>
                            <li class="link">
                                <a href="classes/LibraryParametersBodyParams.html" data-type="entity-link" >LibraryParametersBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkContentBody.html" data-type="entity-link" >LinkContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkElement.html" data-type="entity-link" >LinkElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkElementContent.html" data-type="entity-link" >LinkElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkElementContentBody.html" data-type="entity-link" >LinkElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkElementResponse.html" data-type="entity-link" >LinkElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinkElementResponseMapper.html" data-type="entity-link" >LinkElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ListOauthClientsParams.html" data-type="entity-link" >ListOauthClientsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LocalAuthorizationBodyParams.html" data-type="entity-link" >LocalAuthorizationBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoggingUtils.html" data-type="entity-link" >LoggingUtils</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginRequestBody.html" data-type="entity-link" >LoginRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponse.html" data-type="entity-link" >LoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponse-1.html" data-type="entity-link" >LoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponseMapper.html" data-type="entity-link" >LoginResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lti11ToolConfig.html" data-type="entity-link" >Lti11ToolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lti11ToolConfigCreateParams.html" data-type="entity-link" >Lti11ToolConfigCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lti11ToolConfigEntity.html" data-type="entity-link" >Lti11ToolConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lti11ToolConfigResponse.html" data-type="entity-link" >Lti11ToolConfigResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Lti11ToolConfigUpdateParams.html" data-type="entity-link" >Lti11ToolConfigUpdateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/LtiRoleMapper.html" data-type="entity-link" >LtiRoleMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/LtiToolDO.html" data-type="entity-link" >LtiToolDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LtiToolFactory.html" data-type="entity-link" >LtiToolFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/LumiUserWithContentData.html" data-type="entity-link" >LumiUserWithContentData</a>
                            </li>
                            <li class="link">
                                <a href="classes/MaterialFactory.html" data-type="entity-link" >MaterialFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeAccountResponse.html" data-type="entity-link" >MeAccountResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeResponse.html" data-type="entity-link" >MeResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeResponseMapper.html" data-type="entity-link" >MeResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeRolesReponse.html" data-type="entity-link" >MeRolesReponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeSchoolLogoResponse.html" data-type="entity-link" >MeSchoolLogoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeSchoolResponse.html" data-type="entity-link" >MeSchoolResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetadataTypeMapper.html" data-type="entity-link" >MetadataTypeMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetaTagExtractorResponse.html" data-type="entity-link" >MetaTagExtractorResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeUserResponse.html" data-type="entity-link" >MeUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Migration20240108111130.html" data-type="entity-link" >Migration20240108111130</a>
                            </li>
                            <li class="link">
                                <a href="classes/Migration20240115103302.html" data-type="entity-link" >Migration20240115103302</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationAlreadyActivatedException.html" data-type="entity-link" >MigrationAlreadyActivatedException</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationDto.html" data-type="entity-link" >MigrationDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationMayBeCompleted.html" data-type="entity-link" >MigrationMayBeCompleted</a>
                            </li>
                            <li class="link">
                                <a href="classes/MigrationMayNotBeCompleted.html" data-type="entity-link" >MigrationMayNotBeCompleted</a>
                            </li>
                            <li class="link">
                                <a href="classes/MissingSchoolNumberException.html" data-type="entity-link" >MissingSchoolNumberException</a>
                            </li>
                            <li class="link">
                                <a href="classes/MissingToolParameterValueLoggableException.html" data-type="entity-link" >MissingToolParameterValueLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/MissingYearsLoggableException.html" data-type="entity-link" >MissingYearsLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/MongoPatterns.html" data-type="entity-link" >MongoPatterns</a>
                            </li>
                            <li class="link">
                                <a href="classes/MongoTransactionErrorLoggable.html" data-type="entity-link" >MongoTransactionErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/MoveCardBodyParams.html" data-type="entity-link" >MoveCardBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/MoveColumnBodyParams.html" data-type="entity-link" >MoveColumnBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/MoveContentElementBody.html" data-type="entity-link" >MoveContentElementBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/MoveElementParams.html" data-type="entity-link" >MoveElementParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/MoveElementPositionParams.html" data-type="entity-link" >MoveElementPositionParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/News.html" data-type="entity-link" >News</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsCrudOperationLoggable.html" data-type="entity-link" >NewsCrudOperationLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsListResponse.html" data-type="entity-link" >NewsListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsMapper.html" data-type="entity-link" >NewsMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsResponse.html" data-type="entity-link" >NewsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsScope.html" data-type="entity-link" >NewsScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsUrlParams.html" data-type="entity-link" >NewsUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotFoundLoggableException.html" data-type="entity-link" >NotFoundLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2AuthorizationBodyParams.html" data-type="entity-link" >Oauth2AuthorizationBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2MigrationParams.html" data-type="entity-link" >Oauth2MigrationParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfig.html" data-type="entity-link" >Oauth2ToolConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfigCreateParams.html" data-type="entity-link" >Oauth2ToolConfigCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfigEntity.html" data-type="entity-link" >Oauth2ToolConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfigFactory.html" data-type="entity-link" >Oauth2ToolConfigFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfigResponse.html" data-type="entity-link" >Oauth2ToolConfigResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Oauth2ToolConfigUpdateParams.html" data-type="entity-link" >Oauth2ToolConfigUpdateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthClientBody.html" data-type="entity-link" >OauthClientBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthClientResponse.html" data-type="entity-link" >OauthClientResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthConfig.html" data-type="entity-link" >OauthConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthConfigDto.html" data-type="entity-link" >OauthConfigDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthConfigEntity.html" data-type="entity-link" >OauthConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthConfigMissingLoggableException.html" data-type="entity-link" >OauthConfigMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthConfigResponse.html" data-type="entity-link" >OauthConfigResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthDataDto.html" data-type="entity-link" >OauthDataDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthDataStrategyInputDto.html" data-type="entity-link" >OauthDataStrategyInputDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthLoginResponse.html" data-type="entity-link" >OauthLoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthProcessDto.html" data-type="entity-link" >OAuthProcessDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthProviderRequestMapper.html" data-type="entity-link" >OauthProviderRequestMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthProviderService.html" data-type="entity-link" >OauthProviderService</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthRejectableBody.html" data-type="entity-link" >OAuthRejectableBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/OauthSsoErrorLoggableException.html" data-type="entity-link" >OauthSsoErrorLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthTokenDto.html" data-type="entity-link" >OAuthTokenDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OidcConfigDto.html" data-type="entity-link" >OidcConfigDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/OidcConfigEntity.html" data-type="entity-link" >OidcConfigEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/OidcContextResponse.html" data-type="entity-link" >OidcContextResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/OidcIdentityProviderMapper.html" data-type="entity-link" >OidcIdentityProviderMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Page.html" data-type="entity-link" >Page</a>
                            </li>
                            <li class="link">
                                <a href="classes/PageContentDto.html" data-type="entity-link" >PageContentDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationParams.html" data-type="entity-link" >PaginationParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginationResponse.html" data-type="entity-link" >PaginationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterArrayDuplicateKeyValidator.html" data-type="entity-link" >ParameterArrayDuplicateKeyValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterArrayEntryValidator.html" data-type="entity-link" >ParameterArrayEntryValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterArrayUnknownKeyValidator.html" data-type="entity-link" >ParameterArrayUnknownKeyValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterEntryRegexValidator.html" data-type="entity-link" >ParameterEntryRegexValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterEntryTypeValidator.html" data-type="entity-link" >ParameterEntryTypeValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterEntryValueValidator.html" data-type="entity-link" >ParameterEntryValueValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParameterTypeNotImplementedLoggableException.html" data-type="entity-link" >ParameterTypeNotImplementedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchGroupParams.html" data-type="entity-link" >PatchGroupParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchMyAccountParams.html" data-type="entity-link" >PatchMyAccountParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchMyPasswordParams.html" data-type="entity-link" >PatchMyPasswordParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchOrderParams.html" data-type="entity-link" >PatchOrderParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PatchVisibilityParams.html" data-type="entity-link" >PatchVisibilityParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/Path.html" data-type="entity-link" >Path</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostH5PContentCreateParams.html" data-type="entity-link" >PostH5PContentCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostH5PContentParams.html" data-type="entity-link" >PostH5PContentParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PreviewActionsLoggable.html" data-type="entity-link" >PreviewActionsLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/PreviewBuilder.html" data-type="entity-link" >PreviewBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/PreviewGeneratorBuilder.html" data-type="entity-link" >PreviewGeneratorBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/PreviewNotPossibleException.html" data-type="entity-link" >PreviewNotPossibleException</a>
                            </li>
                            <li class="link">
                                <a href="classes/PreviewParams.html" data-type="entity-link" >PreviewParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrometheusMetricsConfig.html" data-type="entity-link" >PrometheusMetricsConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrometheusMetricsSetupStateLoggable.html" data-type="entity-link" >PrometheusMetricsSetupStateLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/PropertyData.html" data-type="entity-link" >PropertyData</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningConfiguration.html" data-type="entity-link" >ProvisioningConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningDto.html" data-type="entity-link" >ProvisioningDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningOptionsEntity.html" data-type="entity-link" >ProvisioningOptionsEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningOptionsInvalidTypeLoggableException.html" data-type="entity-link" >ProvisioningOptionsInvalidTypeLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningOptionsParams.html" data-type="entity-link" >ProvisioningOptionsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningStrategy.html" data-type="entity-link" >ProvisioningStrategy</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningStrategyInvalidOptionsLoggableException.html" data-type="entity-link" >ProvisioningStrategyInvalidOptionsLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningStrategyMissingLoggableException.html" data-type="entity-link" >ProvisioningStrategyMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningStrategyNoOptionsLoggableException.html" data-type="entity-link" >ProvisioningStrategyNoOptionsLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningSystemDto.html" data-type="entity-link" >ProvisioningSystemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProvisioningSystemInputMapper.html" data-type="entity-link" >ProvisioningSystemInputMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/Pseudonym.html" data-type="entity-link" >Pseudonym</a>
                            </li>
                            <li class="link">
                                <a href="classes/PseudonymEntity.html" data-type="entity-link" >PseudonymEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/PseudonymMapper.html" data-type="entity-link" >PseudonymMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/PseudonymParams.html" data-type="entity-link" >PseudonymParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/PseudonymResponse.html" data-type="entity-link" >PseudonymResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/PseudonymScope.html" data-type="entity-link" >PseudonymScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/PublicSystemListResponse.html" data-type="entity-link" >PublicSystemListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/PublicSystemResponse.html" data-type="entity-link" >PublicSystemResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/PushDeleteRequestsOptionsBuilder.html" data-type="entity-link" >PushDeleteRequestsOptionsBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/QueueDeletionRequestInputBuilder.html" data-type="entity-link" >QueueDeletionRequestInputBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/QueueDeletionRequestOutputBuilder.html" data-type="entity-link" >QueueDeletionRequestOutputBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReadableStreamWithFileTypeImp.html" data-type="entity-link" >ReadableStreamWithFileTypeImp</a>
                            </li>
                            <li class="link">
                                <a href="classes/RecursiveCopyVisitor.html" data-type="entity-link" >RecursiveCopyVisitor</a>
                            </li>
                            <li class="link">
                                <a href="classes/RecursiveSaveVisitor.html" data-type="entity-link" >RecursiveSaveVisitor</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedirectResponse.html" data-type="entity-link" >RedirectResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedisErrorLoggable.html" data-type="entity-link" >RedisErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedisPublishErrorLoggable.html" data-type="entity-link" >RedisPublishErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReferencedEntityNotFoundLoggable.html" data-type="entity-link" >ReferencedEntityNotFoundLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReferencesService.html" data-type="entity-link" >ReferencesService</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegistrationPinEntity.html" data-type="entity-link" >RegistrationPinEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/RenameBodyParams.html" data-type="entity-link" >RenameBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/RenameFileParams.html" data-type="entity-link" >RenameFileParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/RequestInfo.html" data-type="entity-link" >RequestInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResolvedGroupDto.html" data-type="entity-link" >ResolvedGroupDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResolvedGroupUser.html" data-type="entity-link" >ResolvedGroupUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResolvedUserMapper.html" data-type="entity-link" >ResolvedUserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResolvedUserResponse.html" data-type="entity-link" >ResolvedUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResponseInfo.html" data-type="entity-link" >ResponseInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/RestrictedContextMismatchLoggable.html" data-type="entity-link" >RestrictedContextMismatchLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/RevokeConsentParams.html" data-type="entity-link" >RevokeConsentParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichText.html" data-type="entity-link" >RichText</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextContentBody.html" data-type="entity-link" >RichTextContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextElement.html" data-type="entity-link" >RichTextElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextElementContent.html" data-type="entity-link" >RichTextElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextElementContentBody.html" data-type="entity-link" >RichTextElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextElementResponse.html" data-type="entity-link" >RichTextElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/RichTextElementResponseMapper.html" data-type="entity-link" >RichTextElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/RocketChatError.html" data-type="entity-link" >RocketChatError</a>
                            </li>
                            <li class="link">
                                <a href="classes/RocketChatUser.html" data-type="entity-link" >RocketChatUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/RocketChatUserFactory.html" data-type="entity-link" >RocketChatUserFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/RocketChatUserMapper.html" data-type="entity-link" >RocketChatUserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleDto.html" data-type="entity-link" >RoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleMapper.html" data-type="entity-link" >RoleMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleNameMapper.html" data-type="entity-link" >RoleNameMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleReference.html" data-type="entity-link" >RoleReference</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomElementUrlParams.html" data-type="entity-link" >RoomElementUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoomUrlParams.html" data-type="entity-link" >RoomUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/RpcMessageProducer.html" data-type="entity-link" >RpcMessageProducer</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisAnschriftResponse.html" data-type="entity-link" >SanisAnschriftResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisGeburtResponse.html" data-type="entity-link" >SanisGeburtResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisGruppenResponse.html" data-type="entity-link" >SanisGruppenResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisGruppenzugehoerigkeitResponse.html" data-type="entity-link" >SanisGruppenzugehoerigkeitResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisGruppeResponse.html" data-type="entity-link" >SanisGruppeResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisNameResponse.html" data-type="entity-link" >SanisNameResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisOrganisationResponse.html" data-type="entity-link" >SanisOrganisationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisPersonenkontextResponse.html" data-type="entity-link" >SanisPersonenkontextResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisPersonResponse.html" data-type="entity-link" >SanisPersonResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisResponse.html" data-type="entity-link" >SanisResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanisSonstigeGruppenzugehoerigeResponse.html" data-type="entity-link" >SanisSonstigeGruppenzugehoerigeResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SaveH5PEditorParams.html" data-type="entity-link" >SaveH5PEditorParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScanResultDto.html" data-type="entity-link" >ScanResultDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScanResultParams.html" data-type="entity-link" >ScanResultParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/School.html" data-type="entity-link" >School</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolEntity.html" data-type="entity-link" >SchoolEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolEntityMapper.html" data-type="entity-link" >SchoolEntityMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExistsResponse.html" data-type="entity-link" >SchoolExistsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalTool.html" data-type="entity-link" >SchoolExternalTool</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolConfigurationStatus.html" data-type="entity-link" >SchoolExternalToolConfigurationStatus</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolConfigurationStatusEntity.html" data-type="entity-link" >SchoolExternalToolConfigurationStatusEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolConfigurationStatusResponse.html" data-type="entity-link" >SchoolExternalToolConfigurationStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolConfigurationTemplateListResponse.html" data-type="entity-link" >SchoolExternalToolConfigurationTemplateListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolConfigurationTemplateResponse.html" data-type="entity-link" >SchoolExternalToolConfigurationTemplateResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolFactory.html" data-type="entity-link" >SchoolExternalToolFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolIdParams.html" data-type="entity-link" >SchoolExternalToolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolIdParams-1.html" data-type="entity-link" >SchoolExternalToolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolMetadata.html" data-type="entity-link" >SchoolExternalToolMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolMetadataMapper.html" data-type="entity-link" >SchoolExternalToolMetadataMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolMetadataResponse.html" data-type="entity-link" >SchoolExternalToolMetadataResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolPostParams.html" data-type="entity-link" >SchoolExternalToolPostParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolRefDO.html" data-type="entity-link" >SchoolExternalToolRefDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolResponse.html" data-type="entity-link" >SchoolExternalToolResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolScope.html" data-type="entity-link" >SchoolExternalToolScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolSearchListResponse.html" data-type="entity-link" >SchoolExternalToolSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolExternalToolSearchParams.html" data-type="entity-link" >SchoolExternalToolSearchParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolForExternalInviteResponse.html" data-type="entity-link" >SchoolForExternalInviteResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolForGroupNotFoundLoggable.html" data-type="entity-link" >SchoolForGroupNotFoundLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolForLdapLogin.html" data-type="entity-link" >SchoolForLdapLogin</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolForLdapLoginResponse.html" data-type="entity-link" >SchoolForLdapLoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolIdDoesNotMatchWithUserSchoolId.html" data-type="entity-link" >SchoolIdDoesNotMatchWithUserSchoolId</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolIdParams.html" data-type="entity-link" >SchoolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolIdParams-1.html" data-type="entity-link" >SchoolIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInfoMapper.html" data-type="entity-link" >SchoolInfoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInfoResponse.html" data-type="entity-link" >SchoolInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInMigrationLoggableException.html" data-type="entity-link" >SchoolInMigrationLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInUserMigrationEndLoggable.html" data-type="entity-link" >SchoolInUserMigrationEndLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolInUserMigrationStartLoggable.html" data-type="entity-link" >SchoolInUserMigrationStartLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolMigrationDatabaseOperationFailedLoggableException.html" data-type="entity-link" >SchoolMigrationDatabaseOperationFailedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolMigrationSuccessfulLoggable.html" data-type="entity-link" >SchoolMigrationSuccessfulLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolNotMigratedLoggableException.html" data-type="entity-link" >SchoolNotMigratedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolNumberDuplicateLoggableException.html" data-type="entity-link" >SchoolNumberDuplicateLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolNumberMismatchLoggableException.html" data-type="entity-link" >SchoolNumberMismatchLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolNumberMissingLoggableException.html" data-type="entity-link" >SchoolNumberMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolQueryParams.html" data-type="entity-link" >SchoolQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolResponse.html" data-type="entity-link" >SchoolResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolResponseMapper.html" data-type="entity-link" >SchoolResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolRolePermission.html" data-type="entity-link" >SchoolRolePermission</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolRoles.html" data-type="entity-link" >SchoolRoles</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolScope.html" data-type="entity-link" >SchoolScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSpecificFileCopyServiceImpl.html" data-type="entity-link" >SchoolSpecificFileCopyServiceImpl</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemOptions.html" data-type="entity-link" >SchoolSystemOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemOptionsBuilder.html" data-type="entity-link" >SchoolSystemOptionsBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemOptionsEntity.html" data-type="entity-link" >SchoolSystemOptionsEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemOptionsMapper.html" data-type="entity-link" >SchoolSystemOptionsMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemOptionsRepoMapper.html" data-type="entity-link" >SchoolSystemOptionsRepoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolSystemParams.html" data-type="entity-link" >SchoolSystemParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolToolConfigurationStatusResponseMapper.html" data-type="entity-link" >SchoolToolConfigurationStatusResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolUrlParams.html" data-type="entity-link" >SchoolUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYear.html" data-type="entity-link" >SchoolYear</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearEntityMapper.html" data-type="entity-link" >SchoolYearEntityMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearFactory.html" data-type="entity-link" >SchoolYearFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearFactory-1.html" data-type="entity-link" >SchoolYearFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearHelper.html" data-type="entity-link" >SchoolYearHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearResponse.html" data-type="entity-link" >SchoolYearResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchoolYearResponseMapper.html" data-type="entity-link" >SchoolYearResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulconnexConfigurationMissingLoggable.html" data-type="entity-link" >SchulconnexConfigurationMissingLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulconnexImportUserMapper.html" data-type="entity-link" >SchulconnexImportUserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulConneXProvisioningOptions.html" data-type="entity-link" >SchulConneXProvisioningOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulConneXProvisioningOptionsParams.html" data-type="entity-link" >SchulConneXProvisioningOptionsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulConneXProvisioningOptionsResponse.html" data-type="entity-link" >SchulConneXProvisioningOptionsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SchulconnexRestClient.html" data-type="entity-link" >SchulconnexRestClient</a>
                            </li>
                            <li class="link">
                                <a href="classes/Scope.html" data-type="entity-link" >Scope</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScopeRef.html" data-type="entity-link" >ScopeRef</a>
                            </li>
                            <li class="link">
                                <a href="classes/ServerConsole.html" data-type="entity-link" >ServerConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/SetHeightBodyParams.html" data-type="entity-link" >SetHeightBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenBodyParams.html" data-type="entity-link" >ShareTokenBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenContextTypeMapper.html" data-type="entity-link" >ShareTokenContextTypeMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenDO.html" data-type="entity-link" >ShareTokenDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenFactory.html" data-type="entity-link" >ShareTokenFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenImportBodyParams.html" data-type="entity-link" >ShareTokenImportBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenInfoResponse.html" data-type="entity-link" >ShareTokenInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenInfoResponseMapper.html" data-type="entity-link" >ShareTokenInfoResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenParentTypeMapper.html" data-type="entity-link" >ShareTokenParentTypeMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenPayloadResponse.html" data-type="entity-link" >ShareTokenPayloadResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenResponse.html" data-type="entity-link" >ShareTokenResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenResponseMapper.html" data-type="entity-link" >ShareTokenResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ShareTokenUrlParams.html" data-type="entity-link" >ShareTokenUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SingleColumnBoardResponse.html" data-type="entity-link" >SingleColumnBoardResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SingleFileParams.html" data-type="entity-link" >SingleFileParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SortExternalToolParams.html" data-type="entity-link" >SortExternalToolParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SortHelper.html" data-type="entity-link" >SortHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SortImportUserParams.html" data-type="entity-link" >SortImportUserParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SortingParams.html" data-type="entity-link" >SortingParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/StatelessAuthorizationParams.html" data-type="entity-link" >StatelessAuthorizationParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/StorageProviderEncryptedStringType.html" data-type="entity-link" >StorageProviderEncryptedStringType</a>
                            </li>
                            <li class="link">
                                <a href="classes/StringValidator.html" data-type="entity-link" >StringValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/Submission.html" data-type="entity-link" >Submission</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerContentBody.html" data-type="entity-link" >SubmissionContainerContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerElement.html" data-type="entity-link" >SubmissionContainerElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerElementContent.html" data-type="entity-link" >SubmissionContainerElementContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerElementContentBody.html" data-type="entity-link" >SubmissionContainerElementContentBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerElementResponse.html" data-type="entity-link" >SubmissionContainerElementResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerElementResponseMapper.html" data-type="entity-link" >SubmissionContainerElementResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionContainerUrlParams.html" data-type="entity-link" >SubmissionContainerUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionFactory.html" data-type="entity-link" >SubmissionFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionItem.html" data-type="entity-link" >SubmissionItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionItemResponse.html" data-type="entity-link" >SubmissionItemResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionItemResponseMapper.html" data-type="entity-link" >SubmissionItemResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionItemUrlParams.html" data-type="entity-link" >SubmissionItemUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionMapper.html" data-type="entity-link" >SubmissionMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionsResponse.html" data-type="entity-link" >SubmissionsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionStatusListResponse.html" data-type="entity-link" >SubmissionStatusListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionStatusResponse.html" data-type="entity-link" >SubmissionStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SubmissionUrlParams.html" data-type="entity-link" >SubmissionUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SuccessfulResponse.html" data-type="entity-link" >SuccessfulResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SwapInternalLinksVisitor.html" data-type="entity-link" >SwapInternalLinksVisitor</a>
                            </li>
                            <li class="link">
                                <a href="classes/System.html" data-type="entity-link" >System</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemDomainMapper.html" data-type="entity-link" >SystemDomainMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemDto.html" data-type="entity-link" >SystemDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemEntityFactory.html" data-type="entity-link" >SystemEntityFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemFilterParams.html" data-type="entity-link" >SystemFilterParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemForLdapLogin.html" data-type="entity-link" >SystemForLdapLogin</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemForLdapLoginResponse.html" data-type="entity-link" >SystemForLdapLoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemIdParams.html" data-type="entity-link" >SystemIdParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemMapper.html" data-type="entity-link" >SystemMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemOidcMapper.html" data-type="entity-link" >SystemOidcMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemResponseMapper.html" data-type="entity-link" >SystemResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemResponseMapper-1.html" data-type="entity-link" >SystemResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/SystemScope.html" data-type="entity-link" >SystemScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/TargetInfoMapper.html" data-type="entity-link" >TargetInfoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TargetInfoResponse.html" data-type="entity-link" >TargetInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Task.html" data-type="entity-link" >Task</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskCopyApiParams.html" data-type="entity-link" >TaskCopyApiParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskCreateParams.html" data-type="entity-link" >TaskCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskFactory.html" data-type="entity-link" >TaskFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskListResponse.html" data-type="entity-link" >TaskListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskMapper.html" data-type="entity-link" >TaskMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskResponse.html" data-type="entity-link" >TaskResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskScope.html" data-type="entity-link" >TaskScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskStatusMapper.html" data-type="entity-link" >TaskStatusMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskStatusResponse.html" data-type="entity-link" >TaskStatusResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskUpdateParams.html" data-type="entity-link" >TaskUpdateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskUrlParams.html" data-type="entity-link" >TaskUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TaskWithStatusVo.html" data-type="entity-link" >TaskWithStatusVo</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamDto.html" data-type="entity-link" >TeamDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamFactory.html" data-type="entity-link" >TeamFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamPermissionsBody.html" data-type="entity-link" >TeamPermissionsBody</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamPermissionsDto.html" data-type="entity-link" >TeamPermissionsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamRoleDto.html" data-type="entity-link" >TeamRoleDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamRolePermissionsDto.html" data-type="entity-link" >TeamRolePermissionsDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamUrlParams.html" data-type="entity-link" >TeamUrlParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamUserDto.html" data-type="entity-link" >TeamUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamUserEntity.html" data-type="entity-link" >TeamUserEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/TeamUserFactory.html" data-type="entity-link" >TeamUserFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestApiClient.html" data-type="entity-link" >TestApiClient</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestBootstrapConsole.html" data-type="entity-link" >TestBootstrapConsole</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestConnection.html" data-type="entity-link" >TestConnection</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestHelper.html" data-type="entity-link" >TestHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestXApiKeyClient.html" data-type="entity-link" >TestXApiKeyClient</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimestampsResponse.html" data-type="entity-link" >TimestampsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/TldrawDeleteParams.html" data-type="entity-link" >TldrawDeleteParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/TldrawDrawing.html" data-type="entity-link" >TldrawDrawing</a>
                            </li>
                            <li class="link">
                                <a href="classes/TldrawWs.html" data-type="entity-link" >TldrawWs</a>
                            </li>
                            <li class="link">
                                <a href="classes/TldrawWsFactory.html" data-type="entity-link" >TldrawWsFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokenRequestLoggableException.html" data-type="entity-link" >TokenRequestLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/TokenRequestMapper.html" data-type="entity-link" >TokenRequestMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolConfiguration.html" data-type="entity-link" >ToolConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolConfigurationMapper.html" data-type="entity-link" >ToolConfigurationMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolContextMapper.html" data-type="entity-link" >ToolContextMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolContextTypesListResponse.html" data-type="entity-link" >ToolContextTypesListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolLaunchData.html" data-type="entity-link" >ToolLaunchData</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolLaunchMapper.html" data-type="entity-link" >ToolLaunchMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolLaunchParams.html" data-type="entity-link" >ToolLaunchParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolLaunchRequest.html" data-type="entity-link" >ToolLaunchRequest</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolLaunchRequestResponse.html" data-type="entity-link" >ToolLaunchRequestResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterDuplicateLoggableException.html" data-type="entity-link" >ToolParameterDuplicateLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterRequiredLoggableException.html" data-type="entity-link" >ToolParameterRequiredLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterTypeMismatchLoggableException.html" data-type="entity-link" >ToolParameterTypeMismatchLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterTypeValidationUtil.html" data-type="entity-link" >ToolParameterTypeValidationUtil</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterUnknownLoggableException.html" data-type="entity-link" >ToolParameterUnknownLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterValueMissingLoggableException.html" data-type="entity-link" >ToolParameterValueMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolParameterValueRegexLoggableException.html" data-type="entity-link" >ToolParameterValueRegexLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolReference.html" data-type="entity-link" >ToolReference</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolReferenceListResponse.html" data-type="entity-link" >ToolReferenceListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolReferenceMapper.html" data-type="entity-link" >ToolReferenceMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolReferenceResponse.html" data-type="entity-link" >ToolReferenceResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolStatusOutdatedLoggableException.html" data-type="entity-link" >ToolStatusOutdatedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolStatusResponseMapper.html" data-type="entity-link" >ToolStatusResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/TooManyPseudonymsLoggableException.html" data-type="entity-link" >TooManyPseudonymsLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/TriggerDeletionExecutionOptionsBuilder.html" data-type="entity-link" >TriggerDeletionExecutionOptionsBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnauthorizedLoggableException.html" data-type="entity-link" >UnauthorizedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnknownQueryTypeLoggableException.html" data-type="entity-link" >UnknownQueryTypeLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateElementContentBodyParams.html" data-type="entity-link" >UpdateElementContentBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateFlagParams.html" data-type="entity-link" >UpdateFlagParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateMatchParams.html" data-type="entity-link" >UpdateMatchParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateNewsParams.html" data-type="entity-link" >UpdateNewsParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateSubmissionItemBodyParams.html" data-type="entity-link" >UpdateSubmissionItemBodyParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserAlreadyAssignedToImportUserError.html" data-type="entity-link" >UserAlreadyAssignedToImportUserError</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserAndAccountTestFactory.html" data-type="entity-link" >UserAndAccountTestFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDataResponse.html" data-type="entity-link" >UserDataResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDO.html" data-type="entity-link" >UserDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDoFactory.html" data-type="entity-link" >UserDoFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDto.html" data-type="entity-link" >UserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserFactory.html" data-type="entity-link" >UserFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserForGroupNotFoundLoggable.html" data-type="entity-link" >UserForGroupNotFoundLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserImportConfiguration.html" data-type="entity-link" >UserImportConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserImportConfigurationFailureLoggableException.html" data-type="entity-link" >UserImportConfigurationFailureLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserImportPopulateFailureLoggableException.html" data-type="entity-link" >UserImportPopulateFailureLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserImportSchoolExternalIdMissingLoggableException.html" data-type="entity-link" >UserImportSchoolExternalIdMissingLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfoMapper.html" data-type="entity-link" >UserInfoMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserInfoResponse.html" data-type="entity-link" >UserInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationAlreadyClosedLoggableException.html" data-type="entity-link" >UserLoginMigrationAlreadyClosedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationDO.html" data-type="entity-link" >UserLoginMigrationDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationGracePeriodExpiredLoggableException.html" data-type="entity-link" >UserLoginMigrationGracePeriodExpiredLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationMandatoryLoggable.html" data-type="entity-link" >UserLoginMigrationMandatoryLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationMandatoryParams.html" data-type="entity-link" >UserLoginMigrationMandatoryParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationMapper.html" data-type="entity-link" >UserLoginMigrationMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationNotFoundLoggableException.html" data-type="entity-link" >UserLoginMigrationNotFoundLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationResponse.html" data-type="entity-link" >UserLoginMigrationResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationSearchListResponse.html" data-type="entity-link" >UserLoginMigrationSearchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationSearchParams.html" data-type="entity-link" >UserLoginMigrationSearchParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserLoginMigrationStartLoggable.html" data-type="entity-link" >UserLoginMigrationStartLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMapper.html" data-type="entity-link" >UserMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMatchListResponse.html" data-type="entity-link" >UserMatchListResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMatchMapper.html" data-type="entity-link" >UserMatchMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMatchResponse.html" data-type="entity-link" >UserMatchResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMigrationDatabaseOperationFailedLoggableException.html" data-type="entity-link" >UserMigrationDatabaseOperationFailedLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMigrationIsNotEnabled.html" data-type="entity-link" >UserMigrationIsNotEnabled</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMigrationIsNotEnabledLoggableException.html" data-type="entity-link" >UserMigrationIsNotEnabledLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMigrationStartedLoggable.html" data-type="entity-link" >UserMigrationStartedLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserMigrationSuccessfulLoggable.html" data-type="entity-link" >UserMigrationSuccessfulLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserNotFoundAfterProvisioningLoggableException.html" data-type="entity-link" >UserNotFoundAfterProvisioningLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserParams.html" data-type="entity-link" >UserParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserParentsEntity.html" data-type="entity-link" >UserParentsEntity</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserScope.html" data-type="entity-link" >UserScope</a>
                            </li>
                            <li class="link">
                                <a href="classes/UsersList.html" data-type="entity-link" >UsersList</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationError.html" data-type="entity-link" >ValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationErrorDetailResponse.html" data-type="entity-link" >ValidationErrorDetailResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationErrorLoggableException.html" data-type="entity-link" >ValidationErrorLoggableException</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConference.html" data-type="entity-link" >VideoConference</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConference-1.html" data-type="entity-link" >VideoConference</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceBaseResponse.html" data-type="entity-link" class="deprecated-name">VideoConferenceBaseResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceConfiguration.html" data-type="entity-link" >VideoConferenceConfiguration</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceCreateParams.html" data-type="entity-link" >VideoConferenceCreateParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceDO.html" data-type="entity-link" >VideoConferenceDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceInfo.html" data-type="entity-link" >VideoConferenceInfo</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceInfoResponse.html" data-type="entity-link" >VideoConferenceInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceJoin.html" data-type="entity-link" >VideoConferenceJoin</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceJoinResponse.html" data-type="entity-link" >VideoConferenceJoinResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceMapper.html" data-type="entity-link" >VideoConferenceMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceOptions.html" data-type="entity-link" >VideoConferenceOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceOptionsDO.html" data-type="entity-link" >VideoConferenceOptionsDO</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceOptionsResponse.html" data-type="entity-link" >VideoConferenceOptionsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceResponseDeprecatedMapper.html" data-type="entity-link" class="deprecated-name">VideoConferenceResponseDeprecatedMapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/VideoConferenceScopeParams.html" data-type="entity-link" >VideoConferenceScopeParams</a>
                            </li>
                            <li class="link">
                                <a href="classes/VisibilitySettingsResponse.html" data-type="entity-link" >VisibilitySettingsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebsocketCloseErrorLoggable.html" data-type="entity-link" >WebsocketCloseErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebsocketErrorLoggable.html" data-type="entity-link" >WebsocketErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebsocketMessageErrorLoggable.html" data-type="entity-link" >WebsocketMessageErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/WsSharedDocDo.html" data-type="entity-link" >WsSharedDocDo</a>
                            </li>
                            <li class="link">
                                <a href="classes/WsSharedDocErrorLoggable.html" data-type="entity-link" >WsSharedDocErrorLoggable</a>
                            </li>
                            <li class="link">
                                <a href="classes/YearsResponse.html" data-type="entity-link" >YearsResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/YearsResponseMapper.html" data-type="entity-link" >YearsResponseMapper</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AbstractLaunchStrategy.html" data-type="entity-link" >AbstractLaunchStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AccountIdmToDtoMapper.html" data-type="entity-link" >AccountIdmToDtoMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AjaxPostBodyParamsTransformPipe.html" data-type="entity-link" >AjaxPostBodyParamsTransformPipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AntivirusService.html" data-type="entity-link" >AntivirusService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthorizationHelper.html" data-type="entity-link" >AuthorizationHelper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthorizationReferenceService.html" data-type="entity-link" >AuthorizationReferenceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthorizationService.html" data-type="entity-link" >AuthorizationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AutoContextIdStrategy.html" data-type="entity-link" >AutoContextIdStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AutoContextNameStrategy.html" data-type="entity-link" >AutoContextNameStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AutoSchoolIdStrategy.html" data-type="entity-link" >AutoSchoolIdStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AutoSchoolNumberStrategy.html" data-type="entity-link" >AutoSchoolNumberStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseDORepo.html" data-type="entity-link" >BaseDORepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseRepo.html" data-type="entity-link" >BaseRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BasicToolLaunchStrategy.html" data-type="entity-link" >BasicToolLaunchStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BatchDeletionService.html" data-type="entity-link" >BatchDeletionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BatchDeletionUc.html" data-type="entity-link" >BatchDeletionUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BBBService.html" data-type="entity-link" >BBBService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardCopyService.html" data-type="entity-link" >BoardCopyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardDoAuthorizableService.html" data-type="entity-link" >BoardDoAuthorizableService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardDoCopyService.html" data-type="entity-link" >BoardDoCopyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardDoRepo.html" data-type="entity-link" >BoardDoRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardDoRule.html" data-type="entity-link" >BoardDoRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardDoService.html" data-type="entity-link" >BoardDoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardNodeRepo.html" data-type="entity-link" >BoardNodeRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardRepo.html" data-type="entity-link" >BoardRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardUc.html" data-type="entity-link" >BoardUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BoardUrlHandler.html" data-type="entity-link" >BoardUrlHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CardService.html" data-type="entity-link" >CardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CardUc.html" data-type="entity-link" >CardUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ClassesRepo.html" data-type="entity-link" >ClassesRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ClassService.html" data-type="entity-link" >ClassService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CloseUserLoginMigrationUc.html" data-type="entity-link" >CloseUserLoginMigrationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CollaborativeStorageAdapterMapper.html" data-type="entity-link" >CollaborativeStorageAdapterMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CollaborativeStorageService.html" data-type="entity-link" >CollaborativeStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CollaborativeStorageUc.html" data-type="entity-link" >CollaborativeStorageUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ColumnBoardService.html" data-type="entity-link" >ColumnBoardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ColumnBoardTargetService.html" data-type="entity-link" >ColumnBoardTargetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ColumnService.html" data-type="entity-link" >ColumnService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ColumnUc.html" data-type="entity-link" >ColumnUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommonCartridgeExportService.html" data-type="entity-link" >CommonCartridgeExportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommonToolService.html" data-type="entity-link" >CommonToolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommonToolValidationService.html" data-type="entity-link" >CommonToolValidationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentElementFactory.html" data-type="entity-link" >ContentElementFactory</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentElementService.html" data-type="entity-link" >ContentElementService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentElementUpdateVisitor.html" data-type="entity-link" >ContentElementUpdateVisitor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentStorage.html" data-type="entity-link" >ContentStorage</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContextExternalToolAuthorizableService.html" data-type="entity-link" >ContextExternalToolAuthorizableService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContextExternalToolRepo.html" data-type="entity-link" >ContextExternalToolRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContextExternalToolRule.html" data-type="entity-link" >ContextExternalToolRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContextExternalToolService.html" data-type="entity-link" >ContextExternalToolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContextExternalToolUc.html" data-type="entity-link" >ContextExternalToolUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ConverterUtil.html" data-type="entity-link" >ConverterUtil</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseCopyService.html" data-type="entity-link" >CourseCopyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseCopyUC.html" data-type="entity-link" >CourseCopyUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseExportUc.html" data-type="entity-link" >CourseExportUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseGroupRepo.html" data-type="entity-link" >CourseGroupRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseGroupRule.html" data-type="entity-link" >CourseGroupRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseGroupService.html" data-type="entity-link" >CourseGroupService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseRepo.html" data-type="entity-link" >CourseRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseRule.html" data-type="entity-link" >CourseRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseService.html" data-type="entity-link" >CourseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseUc.html" data-type="entity-link" >CourseUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseUrlHandler.html" data-type="entity-link" >CourseUrlHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardElementRepo.html" data-type="entity-link" >DashboardElementRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardModelMapper.html" data-type="entity-link" >DashboardModelMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardRepo.html" data-type="entity-link" >DashboardRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardService.html" data-type="entity-link" >DashboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardUc.html" data-type="entity-link" >DashboardUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DatasheetPdfService.html" data-type="entity-link" >DatasheetPdfService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DeleteFilesUc.html" data-type="entity-link" >DeleteFilesUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DeletionClient.html" data-type="entity-link" >DeletionClient</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DeletionExecutionUc.html" data-type="entity-link" >DeletionExecutionUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DeletionLogRepo.html" data-type="entity-link" >DeletionLogRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DeletionRequestUc.html" data-type="entity-link" >DeletionRequestUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DurationLoggingInterceptor.html" data-type="entity-link" >DurationLoggingInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EtherpadService.html" data-type="entity-link" >EtherpadService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolConfigurationService.html" data-type="entity-link" >ExternalToolConfigurationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolConfigurationUc.html" data-type="entity-link" >ExternalToolConfigurationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolParameterValidationService.html" data-type="entity-link" >ExternalToolParameterValidationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolPseudonymRepo.html" data-type="entity-link" >ExternalToolPseudonymRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolRepo.html" data-type="entity-link" >ExternalToolRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolRequestMapper.html" data-type="entity-link" >ExternalToolRequestMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolResponseMapper.html" data-type="entity-link" >ExternalToolResponseMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolService.html" data-type="entity-link" >ExternalToolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolServiceMapper.html" data-type="entity-link" >ExternalToolServiceMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolUc.html" data-type="entity-link" >ExternalToolUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolValidationService.html" data-type="entity-link" >ExternalToolValidationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExternalToolVersionIncrementService.html" data-type="entity-link" >ExternalToolVersionIncrementService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeathersAuthorizationService.html" data-type="entity-link" >FeathersAuthorizationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeathersAuthProvider.html" data-type="entity-link" >FeathersAuthProvider</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeathersRosterService.html" data-type="entity-link" >FeathersRosterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FederalStateRepo.html" data-type="entity-link" >FederalStateRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FederalStateService.html" data-type="entity-link" >FederalStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileRecordRepo.html" data-type="entity-link" >FileRecordRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesRepo.html" data-type="entity-link" >FilesRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesService.html" data-type="entity-link" >FilesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesStorageConsumer.html" data-type="entity-link" >FilesStorageConsumer</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesStorageService.html" data-type="entity-link" >FilesStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FilesStorageUC.html" data-type="entity-link" >FilesStorageUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GroupRepo.html" data-type="entity-link" >GroupRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GroupRule.html" data-type="entity-link" >GroupRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GroupService.html" data-type="entity-link" >GroupService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GroupUc.html" data-type="entity-link" >GroupUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/H5PContentRepo.html" data-type="entity-link" >H5PContentRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/H5PLibraryManagementService.html" data-type="entity-link" >H5PLibraryManagementService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HydraAdapter.html" data-type="entity-link" >HydraAdapter</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HydraOauthUc.html" data-type="entity-link" >HydraOauthUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HydraSsoService.html" data-type="entity-link" >HydraSsoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ImportUserRepo.html" data-type="entity-link" >ImportUserRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/IservProvisioningStrategy.html" data-type="entity-link" >IservProvisioningStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtAuthGuard.html" data-type="entity-link" >JwtAuthGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LegacySchoolRepo.html" data-type="entity-link" class="deprecated-name">LegacySchoolRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LegacySchoolRule.html" data-type="entity-link" class="deprecated-name">LegacySchoolRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LegacySchoolService.html" data-type="entity-link" class="deprecated-name">LegacySchoolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LegacySystemRepo.html" data-type="entity-link" class="deprecated-name">LegacySystemRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LegacySystemService.html" data-type="entity-link" class="deprecated-name">LegacySystemService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonCopyService.html" data-type="entity-link" >LessonCopyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonCopyUC.html" data-type="entity-link" >LessonCopyUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonRepo.html" data-type="entity-link" >LessonRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonRule.html" data-type="entity-link" >LessonRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonService.html" data-type="entity-link" >LessonService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonUC.html" data-type="entity-link" >LessonUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LessonUrlHandler.html" data-type="entity-link" >LessonUrlHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LibraryRepo.html" data-type="entity-link" >LibraryRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LibraryStorage.html" data-type="entity-link" >LibraryStorage</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/Lti11EncryptionService.html" data-type="entity-link" >Lti11EncryptionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/Lti11ToolLaunchStrategy.html" data-type="entity-link" >Lti11ToolLaunchStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LtiToolRepo.html" data-type="entity-link" >LtiToolRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LtiToolService.html" data-type="entity-link" >LtiToolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MailService.html" data-type="entity-link" >MailService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MaterialsRepo.html" data-type="entity-link" >MaterialsRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MetaTagExtractorService.html" data-type="entity-link" >MetaTagExtractorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MetaTagExtractorUc.html" data-type="entity-link" >MetaTagExtractorUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MetricsService.html" data-type="entity-link" >MetricsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MeUc.html" data-type="entity-link" >MeUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MigrationCheckService.html" data-type="entity-link" >MigrationCheckService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NewsRepo.html" data-type="entity-link" >NewsRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NexboardService.html" data-type="entity-link" >NexboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OAuth2ToolLaunchStrategy.html" data-type="entity-link" >OAuth2ToolLaunchStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthAdapterService.html" data-type="entity-link" >OauthAdapterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthProviderClientCrudUc.html" data-type="entity-link" >OauthProviderClientCrudUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthProviderConsentFlowUc.html" data-type="entity-link" >OauthProviderConsentFlowUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthProviderLoginFlowUc.html" data-type="entity-link" >OauthProviderLoginFlowUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthProviderLogoutFlowUc.html" data-type="entity-link" >OauthProviderLogoutFlowUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OauthProviderUc.html" data-type="entity-link" >OauthProviderUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OAuthService.html" data-type="entity-link" >OAuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OidcMockProvisioningStrategy.html" data-type="entity-link" >OidcMockProvisioningStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/OidcProvisioningStrategy.html" data-type="entity-link" >OidcProvisioningStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PermissionService.html" data-type="entity-link" >PermissionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PreviewGeneratorConsumer.html" data-type="entity-link" >PreviewGeneratorConsumer</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PreviewGeneratorService.html" data-type="entity-link" >PreviewGeneratorService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PreviewService.html" data-type="entity-link" >PreviewService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProvisioningOptionsUpdateService.html" data-type="entity-link" >ProvisioningOptionsUpdateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PseudonymService.html" data-type="entity-link" >PseudonymService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PseudonymsRepo.html" data-type="entity-link" >PseudonymsRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PseudonymUc.html" data-type="entity-link" >PseudonymUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RecursiveDeleteVisitor.html" data-type="entity-link" >RecursiveDeleteVisitor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReferenceLoader.html" data-type="entity-link" >ReferenceLoader</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RegistrationPinRepo.html" data-type="entity-link" >RegistrationPinRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RegistrationPinService.html" data-type="entity-link" >RegistrationPinService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RequestLoggingInterceptor.html" data-type="entity-link" >RequestLoggingInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RestartUserLoginMigrationUc.html" data-type="entity-link" >RestartUserLoginMigrationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RocketChatService.html" data-type="entity-link" >RocketChatService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RocketChatUserRepo.html" data-type="entity-link" >RocketChatUserRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleRepo.html" data-type="entity-link" >RoleRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleService.html" data-type="entity-link" >RoleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleUc.html" data-type="entity-link" >RoleUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoomBoardDTOFactory.html" data-type="entity-link" >RoomBoardDTOFactory</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoomsAuthorisationService.html" data-type="entity-link" >RoomsAuthorisationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoomsService.html" data-type="entity-link" >RoomsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoomsUc.html" data-type="entity-link" >RoomsUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RuleManager.html" data-type="entity-link" >RuleManager</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/S3ClientAdapter.html" data-type="entity-link" >S3ClientAdapter</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanisProvisioningStrategy.html" data-type="entity-link" >SanisProvisioningStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SanisResponseMapper.html" data-type="entity-link" >SanisResponseMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolRepo.html" data-type="entity-link" >SchoolExternalToolRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolRequestMapper.html" data-type="entity-link" >SchoolExternalToolRequestMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolResponseMapper.html" data-type="entity-link" >SchoolExternalToolResponseMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolRule.html" data-type="entity-link" >SchoolExternalToolRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolService.html" data-type="entity-link" >SchoolExternalToolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolUc.html" data-type="entity-link" >SchoolExternalToolUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolExternalToolValidationService.html" data-type="entity-link" >SchoolExternalToolValidationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolMigrationService.html" data-type="entity-link" >SchoolMigrationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolMikroOrmRepo.html" data-type="entity-link" >SchoolMikroOrmRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolRule.html" data-type="entity-link" >SchoolRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolService.html" data-type="entity-link" >SchoolService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolSpecificFileCopyServiceFactory.html" data-type="entity-link" >SchoolSpecificFileCopyServiceFactory</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolSystemOptionsRepo.html" data-type="entity-link" >SchoolSystemOptionsRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolSystemOptionsRule.html" data-type="entity-link" >SchoolSystemOptionsRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolSystemOptionsService.html" data-type="entity-link" >SchoolSystemOptionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolSystemOptionsUc.html" data-type="entity-link" >SchoolSystemOptionsUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolUc.html" data-type="entity-link" >SchoolUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolValidationService.html" data-type="entity-link" >SchoolValidationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolYearMikroOrmRepo.html" data-type="entity-link" >SchoolYearMikroOrmRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolYearRepo.html" data-type="entity-link" >SchoolYearRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolYearService.html" data-type="entity-link" >SchoolYearService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchoolYearService-1.html" data-type="entity-link" >SchoolYearService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchulconnexFetchImportUsersService.html" data-type="entity-link" >SchulconnexFetchImportUsersService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchulconnexProvisioningOptionsUpdateService.html" data-type="entity-link" >SchulconnexProvisioningOptionsUpdateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ShareTokenService.html" data-type="entity-link" >ShareTokenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ShareTokenUC.html" data-type="entity-link" >ShareTokenUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StartUserLoginMigrationUc.html" data-type="entity-link" >StartUserLoginMigrationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageProviderRepo.html" data-type="entity-link" >StorageProviderRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionItemFactory.html" data-type="entity-link" >SubmissionItemFactory</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionItemService.html" data-type="entity-link" >SubmissionItemService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionRepo.html" data-type="entity-link" >SubmissionRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionRule.html" data-type="entity-link" >SubmissionRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionService.html" data-type="entity-link" >SubmissionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SubmissionUc.html" data-type="entity-link" >SubmissionUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SymetricKeyEncryptionService.html" data-type="entity-link" >SymetricKeyEncryptionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemRepo.html" data-type="entity-link" >SystemRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemRule.html" data-type="entity-link" >SystemRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemService.html" data-type="entity-link" >SystemService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SystemUc.html" data-type="entity-link" >SystemUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskCopyService.html" data-type="entity-link" >TaskCopyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskCopyUC.html" data-type="entity-link" >TaskCopyUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskRepo.html" data-type="entity-link" >TaskRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskRule.html" data-type="entity-link" >TaskRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskService.html" data-type="entity-link" >TaskService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskUC.html" data-type="entity-link" >TaskUC</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TaskUrlHandler.html" data-type="entity-link" >TaskUrlHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TeamMapper.html" data-type="entity-link" >TeamMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TeamPermissionsMapper.html" data-type="entity-link" >TeamPermissionsMapper</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TeamRule.html" data-type="entity-link" >TeamRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TeamService.html" data-type="entity-link" >TeamService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TeamsRepo.html" data-type="entity-link" >TeamsRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TemporaryFileStorage.html" data-type="entity-link" >TemporaryFileStorage</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TimeoutInterceptor.html" data-type="entity-link" >TimeoutInterceptor</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TldrawBoardRepo.html" data-type="entity-link" >TldrawBoardRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TldrawFilesStorageAdapterService.html" data-type="entity-link" >TldrawFilesStorageAdapterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TldrawRedisFactory.html" data-type="entity-link" >TldrawRedisFactory</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TldrawWsService.html" data-type="entity-link" >TldrawWsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToggleUserLoginMigrationUc.html" data-type="entity-link" >ToggleUserLoginMigrationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TokenGenerator.html" data-type="entity-link" >TokenGenerator</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToolLaunchService.html" data-type="entity-link" >ToolLaunchService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToolLaunchUc.html" data-type="entity-link" >ToolLaunchUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToolReferenceService.html" data-type="entity-link" >ToolReferenceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToolReferenceUc.html" data-type="entity-link" >ToolReferenceUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserDORepo.html" data-type="entity-link" >UserDORepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserImportFetchUc.html" data-type="entity-link" >UserImportFetchUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserImportService.html" data-type="entity-link" >UserImportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserImportUc.html" data-type="entity-link" >UserImportUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserLoginMigrationRepo.html" data-type="entity-link" >UserLoginMigrationRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserLoginMigrationRevertService.html" data-type="entity-link" >UserLoginMigrationRevertService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserLoginMigrationRule.html" data-type="entity-link" >UserLoginMigrationRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserLoginMigrationService.html" data-type="entity-link" >UserLoginMigrationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserLoginMigrationUc.html" data-type="entity-link" >UserLoginMigrationUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserMigrationService.html" data-type="entity-link" >UserMigrationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserRepo.html" data-type="entity-link" >UserRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserRule.html" data-type="entity-link" >UserRule</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserUc.html" data-type="entity-link" >UserUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceCreateUc.html" data-type="entity-link" >VideoConferenceCreateUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceDeprecatedUc.html" data-type="entity-link" >VideoConferenceDeprecatedUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceEndUc.html" data-type="entity-link" >VideoConferenceEndUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceInfoUc.html" data-type="entity-link" >VideoConferenceInfoUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceJoinUc.html" data-type="entity-link" >VideoConferenceJoinUc</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceRepo.html" data-type="entity-link" >VideoConferenceRepo</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VideoConferenceService.html" data-type="entity-link" >VideoConferenceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/YMongodb.html" data-type="entity-link" >YMongodb</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AcceptConsentRequestBody.html" data-type="entity-link" >AcceptConsentRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AcceptLoginRequestBody.html" data-type="entity-link" >AcceptLoginRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AccountConfig.html" data-type="entity-link" >AccountConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AccountParams.html" data-type="entity-link" >AccountParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdminIdAndToken.html" data-type="entity-link" >AdminIdAndToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AntivirusModuleOptions.html" data-type="entity-link" >AntivirusModuleOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AntivirusServiceOptions.html" data-type="entity-link" >AntivirusServiceOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppendedAttachment.html" data-type="entity-link" >AppendedAttachment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppStartInfo.html" data-type="entity-link" >AppStartInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthenticationConfig.html" data-type="entity-link" >AuthenticationConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthenticationResponse.html" data-type="entity-link" >AuthenticationResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorizableObject.html" data-type="entity-link" >AuthorizableObject</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorizationContext.html" data-type="entity-link" >AuthorizationContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorizationLoaderService.html" data-type="entity-link" >AuthorizationLoaderService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorizationLoaderServiceGeneric.html" data-type="entity-link" >AuthorizationLoaderServiceGeneric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthorizationParams.html" data-type="entity-link" >AuthorizationParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AutoParameterStrategy.html" data-type="entity-link" >AutoParameterStrategy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BaseResponseMapper.html" data-type="entity-link" >BaseResponseMapper</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BatchDeletionSummary.html" data-type="entity-link" >BatchDeletionSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BatchDeletionSummaryDetail.html" data-type="entity-link" >BatchDeletionSummaryDetail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BBBBaseResponse.html" data-type="entity-link" >BBBBaseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BBBCreateResponse.html" data-type="entity-link" >BBBCreateResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BBBJoinResponse.html" data-type="entity-link" >BBBJoinResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BBBMeetingInfoResponse.html" data-type="entity-link" >BBBMeetingInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BBBResponse.html" data-type="entity-link" >BBBResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardCompositeProps.html" data-type="entity-link" >BoardCompositeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardCompositeVisitor.html" data-type="entity-link" >BoardCompositeVisitor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardCompositeVisitorAsync.html" data-type="entity-link" >BoardCompositeVisitorAsync</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardDoAuthorizableProps.html" data-type="entity-link" >BoardDoAuthorizableProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardDoBuilder.html" data-type="entity-link" >BoardDoBuilder</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardExternalReference.html" data-type="entity-link" >BoardExternalReference</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BoardNodeProps.html" data-type="entity-link" >BoardNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CalendarEvent.html" data-type="entity-link" >CalendarEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CardNodeProps.html" data-type="entity-link" >CardNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CardProps.html" data-type="entity-link" >CardProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassEntityProps.html" data-type="entity-link" >ClassEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassProps.html" data-type="entity-link" >ClassProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassSourceOptionsEntityProps.html" data-type="entity-link" >ClassSourceOptionsEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClassSourceOptionsProps.html" data-type="entity-link" >ClassSourceOptionsProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CleanOptions.html" data-type="entity-link" >CleanOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollaborativeStorageStrategy.html" data-type="entity-link" >CollaborativeStorageStrategy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionFilePath.html" data-type="entity-link" >CollectionFilePath</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnBoardNodeProps.html" data-type="entity-link" >ColumnBoardNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnBoardProps.html" data-type="entity-link" >ColumnBoardProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnProps.html" data-type="entity-link" >ColumnProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommonCartridgeConfig.html" data-type="entity-link" >CommonCartridgeConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommonCartridgeElement.html" data-type="entity-link" >CommonCartridgeElement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommonCartridgeFile.html" data-type="entity-link" >CommonCartridgeFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentEtherpadProperties.html" data-type="entity-link" >ComponentEtherpadProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentGeogebraProperties.html" data-type="entity-link" >ComponentGeogebraProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentInternalProperties.html" data-type="entity-link" >ComponentInternalProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentLernstoreProperties.html" data-type="entity-link" >ComponentLernstoreProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentNexboardProperties.html" data-type="entity-link" >ComponentNexboardProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentTextProperties.html" data-type="entity-link" >ComponentTextProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContextExternalToolProperties.html" data-type="entity-link" >ContextExternalToolProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContextExternalToolProps.html" data-type="entity-link" >ContextExternalToolProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CopyFileDO.html" data-type="entity-link" >CopyFileDO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CopyFileDomainObjectProps.html" data-type="entity-link" >CopyFileDomainObjectProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CopyFiles.html" data-type="entity-link" >CopyFiles</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CopyFilesOfParentParams.html" data-type="entity-link" >CopyFilesOfParentParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CopyFilesRequestInfo.html" data-type="entity-link" >CopyFilesRequestInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CoreModuleConfig.html" data-type="entity-link" >CoreModuleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CountyProps.html" data-type="entity-link" >CountyProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseGroupProperties.html" data-type="entity-link" >CourseGroupProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseProperties.html" data-type="entity-link" >CourseProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateJwtParams.html" data-type="entity-link" >CreateJwtParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateJwtPayload.html" data-type="entity-link" >CreateJwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateNews.html" data-type="entity-link" >CreateNews</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomLtiProperty.html" data-type="entity-link" >CustomLtiProperty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardGridElementModelProperties.html" data-type="entity-link" >DashboardGridElementModelProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardModelProperties.html" data-type="entity-link" >DashboardModelProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionClientConfig.html" data-type="entity-link" >DeletionClientConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionExecutionTriggerResult.html" data-type="entity-link" >DeletionExecutionTriggerResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionLogEntityProps.html" data-type="entity-link" >DeletionLogEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionLogProps.html" data-type="entity-link" >DeletionLogProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionLogStatistic.html" data-type="entity-link" >DeletionLogStatistic</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestCreateAnswer.html" data-type="entity-link" >DeletionRequestCreateAnswer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestEntityProps.html" data-type="entity-link" >DeletionRequestEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestInput.html" data-type="entity-link" >DeletionRequestInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestLog.html" data-type="entity-link" >DeletionRequestLog</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestOutput.html" data-type="entity-link" >DeletionRequestOutput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestProps.html" data-type="entity-link" >DeletionRequestProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestProps-1.html" data-type="entity-link" >DeletionRequestProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionRequestTargetRefInput.html" data-type="entity-link" >DeletionRequestTargetRefInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionTargetRef.html" data-type="entity-link" >DeletionTargetRef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeletionTargetRef-1.html" data-type="entity-link" >DeletionTargetRef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DomainOperation.html" data-type="entity-link" >DomainOperation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DrawingElementNodeProps.html" data-type="entity-link" >DrawingElementNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DrawingElementProps.html" data-type="entity-link" >DrawingElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EncryptionService.html" data-type="entity-link" >EncryptionService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EntityWithSchool.html" data-type="entity-link" >EntityWithSchool</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorType.html" data-type="entity-link" >ErrorType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalSourceEntityProps.html" data-type="entity-link" >ExternalSourceEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalToolElementNodeEntityProps.html" data-type="entity-link" >ExternalToolElementNodeEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalToolElementProps.html" data-type="entity-link" >ExternalToolElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalToolProps.html" data-type="entity-link" >ExternalToolProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalToolPseudonymEntityProps.html" data-type="entity-link" >ExternalToolPseudonymEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalToolSearchQuery.html" data-type="entity-link" >ExternalToolSearchQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeathersError.html" data-type="entity-link" >FeathersError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeathersService.html" data-type="entity-link" >FeathersService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FederalStateProperties.html" data-type="entity-link" >FederalStateProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FederalStateProps.html" data-type="entity-link" >FederalStateProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/File.html" data-type="entity-link" >File</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileDO.html" data-type="entity-link" >FileDO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileDomainObjectProps.html" data-type="entity-link" >FileDomainObjectProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileElementNodeProps.html" data-type="entity-link" >FileElementNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileElementProps.html" data-type="entity-link" >FileElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileEntityProps.html" data-type="entity-link" >FileEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilePermissionEntityProps.html" data-type="entity-link" >FilePermissionEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileRecordParams.html" data-type="entity-link" >FileRecordParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileRecordProperties.html" data-type="entity-link" >FileRecordProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileRecordSecurityCheckProperties.html" data-type="entity-link" >FileRecordSecurityCheckProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileRequestInfo.html" data-type="entity-link" >FileRequestInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileSecurityCheckEntityProps.html" data-type="entity-link" >FileSecurityCheckEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FilesStorageClientConfig.html" data-type="entity-link" >FilesStorageClientConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FileStorageConfig.html" data-type="entity-link" >FileStorageConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetFile.html" data-type="entity-link" >GetFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetFileResponse.html" data-type="entity-link" >GetFileResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetFileResponse-1.html" data-type="entity-link" >GetFileResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetH5PFileResponse.html" data-type="entity-link" >GetH5PFileResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetH5pFileResponse.html" data-type="entity-link" >GetH5pFileResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetLibraryFile.html" data-type="entity-link" >GetLibraryFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetLibraryFile-1.html" data-type="entity-link" >GetLibraryFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GlobalConstants.html" data-type="entity-link" >GlobalConstants</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Group.html" data-type="entity-link" >Group</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupEntityProps.html" data-type="entity-link" >GroupEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupfoldersCreated.html" data-type="entity-link" >GroupfoldersCreated</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupfoldersFolder.html" data-type="entity-link" >GroupfoldersFolder</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupNameIdTuple.html" data-type="entity-link" >GroupNameIdTuple</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupProps.html" data-type="entity-link" >GroupProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupUserEntityProps.html" data-type="entity-link" >GroupUserEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupUsers.html" data-type="entity-link" >GroupUsers</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GroupValidPeriodEntityProps.html" data-type="entity-link" >GroupValidPeriodEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/H5PContentParentParams.html" data-type="entity-link" >H5PContentParentParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/H5PContentProperties.html" data-type="entity-link" >H5PContentProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/H5PContentResponse.html" data-type="entity-link" >H5PContentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HtmlMailContent.html" data-type="entity-link" >HtmlMailContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBbbSettings.html" data-type="entity-link" >IBbbSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICommonCartridgeFileBuilder.html" data-type="entity-link" >ICommonCartridgeFileBuilder</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICommonCartridgeOrganizationBuilder.html" data-type="entity-link" >ICommonCartridgeOrganizationBuilder</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICurrentUser.html" data-type="entity-link" >ICurrentUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDashboardRepo.html" data-type="entity-link" >IDashboardRepo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IdentityManagementConfig.html" data-type="entity-link" >IdentityManagementConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IdToken.html" data-type="entity-link" >IdToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IEntity.html" data-type="entity-link" >IEntity</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IEntityWithTimestamps.html" data-type="entity-link" >IEntityWithTimestamps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IError.html" data-type="entity-link" >IError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IFindOptions.html" data-type="entity-link" >IFindOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IGridElement.html" data-type="entity-link" >IGridElement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IH5PLibraryManagementConfig.html" data-type="entity-link" >IH5PLibraryManagementConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IImportUserScope.html" data-type="entity-link" >IImportUserScope</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IKeycloakConfigurationInputFiles.html" data-type="entity-link" >IKeycloakConfigurationInputFiles</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IKeycloakSettings.html" data-type="entity-link" >IKeycloakSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ILegacyLogger.html" data-type="entity-link" class="deprecated-name">ILegacyLogger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImportUserProperties.html" data-type="entity-link" >ImportUserProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/INewsScope.html" data-type="entity-link" >INewsScope</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InlineAttachment.html" data-type="entity-link" >InlineAttachment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterceptorConfig.html" data-type="entity-link" >InterceptorConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IntrospectResponse.html" data-type="entity-link" >IntrospectResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IProvisioningFeatures.html" data-type="entity-link" >IProvisioningFeatures</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ITask.html" data-type="entity-link" >ITask</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IToolFeatures.html" data-type="entity-link" >IToolFeatures</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserImportFeatures.html" data-type="entity-link" >IUserImportFeatures</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IVideoConferenceSettings.html" data-type="entity-link" >IVideoConferenceSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JsonAccount.html" data-type="entity-link" >JsonAccount</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JsonUser.html" data-type="entity-link" >JsonUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtConstants.html" data-type="entity-link" >JwtConstants</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link" >JwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Learnroom.html" data-type="entity-link" >Learnroom</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearnroomElement.html" data-type="entity-link" >LearnroomElement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LessonParent.html" data-type="entity-link" >LessonParent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LessonProperties.html" data-type="entity-link" >LessonProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LibrariesContentType.html" data-type="entity-link" >LibrariesContentType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinkElementNodeProps.html" data-type="entity-link" >LinkElementNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinkElementProps.html" data-type="entity-link" >LinkElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ListFiles.html" data-type="entity-link" >ListFiles</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Loggable.html" data-type="entity-link" >Loggable</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggerConfig.html" data-type="entity-link" >LoggerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Mail.html" data-type="entity-link" >Mail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MailAttachment.html" data-type="entity-link" >MailAttachment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MailConfig.html" data-type="entity-link" >MailConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MailContent.html" data-type="entity-link" >MailContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MailModuleOptions.html" data-type="entity-link" >MailModuleOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MailServiceOptions.html" data-type="entity-link" >MailServiceOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaterialProperties.html" data-type="entity-link" >MaterialProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Meta.html" data-type="entity-link" >Meta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MigrationOptions.html" data-type="entity-link" >MigrationOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MigrationOptions-1.html" data-type="entity-link" >MigrationOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NameMatch.html" data-type="entity-link" >NameMatch</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsProperties.html" data-type="entity-link" >NewsProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsTargetFilter.html" data-type="entity-link" >NewsTargetFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NextcloudGroups.html" data-type="entity-link" >NextcloudGroups</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OauthCurrentUser.html" data-type="entity-link" >OauthCurrentUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OauthTokenResponse.html" data-type="entity-link" >OauthTokenResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ObjectKeysRecursive.html" data-type="entity-link" >ObjectKeysRecursive</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OcsResponse.html" data-type="entity-link" >OcsResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Options.html" data-type="entity-link" >Options</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParameterArrayValidator.html" data-type="entity-link" >ParameterArrayValidator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParameterEntryValidator.html" data-type="entity-link" >ParameterEntryValidator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParentInfo.html" data-type="entity-link" >ParentInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlainTextMailContent.html" data-type="entity-link" >PlainTextMailContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewConfig.html" data-type="entity-link" >PreviewConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewFileOptions.html" data-type="entity-link" >PreviewFileOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewFileParams.html" data-type="entity-link" >PreviewFileParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewModuleConfig.html" data-type="entity-link" >PreviewModuleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewOptions.html" data-type="entity-link" >PreviewOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PreviewResponseMessage.html" data-type="entity-link" >PreviewResponseMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderConsentResponse.html" data-type="entity-link" >ProviderConsentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderConsentSessionResponse.html" data-type="entity-link" >ProviderConsentSessionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderLoginResponse.html" data-type="entity-link" >ProviderLoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderOauthClient.html" data-type="entity-link" >ProviderOauthClient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderOidcContext.html" data-type="entity-link" >ProviderOidcContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderRedirectResponse.html" data-type="entity-link" >ProviderRedirectResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProvisioningOptionsUpdateHandler.html" data-type="entity-link" >ProvisioningOptionsUpdateHandler</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PseudonymEntityProps.html" data-type="entity-link" >PseudonymEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PseudonymProps.html" data-type="entity-link" >PseudonymProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PseudonymSearchQuery.html" data-type="entity-link" >PseudonymSearchQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PushDeletionRequestsOptions.html" data-type="entity-link" >PushDeletionRequestsOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QueueDeletionRequestInput.html" data-type="entity-link" >QueueDeletionRequestInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QueueDeletionRequestOutput.html" data-type="entity-link" >QueueDeletionRequestOutput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegistrationPinEntityProps.html" data-type="entity-link" >RegistrationPinEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RejectRequestBody.html" data-type="entity-link" >RejectRequestBody</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RelatedResourceProperties.html" data-type="entity-link" >RelatedResourceProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RepoLoader.html" data-type="entity-link" >RepoLoader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RetryOptions.html" data-type="entity-link" >RetryOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RichTextElementNodeProps.html" data-type="entity-link" >RichTextElementNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RichTextElementProps.html" data-type="entity-link" >RichTextElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RocketChatGroupModel.html" data-type="entity-link" >RocketChatGroupModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RocketChatOptions.html" data-type="entity-link" >RocketChatOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RocketChatUserEntityProps.html" data-type="entity-link" >RocketChatUserEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RocketChatUserProps.html" data-type="entity-link" >RocketChatUserProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoleProperties.html" data-type="entity-link" >RoleProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RpcMessage.html" data-type="entity-link" >RpcMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Rule.html" data-type="entity-link" >Rule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/S3Config.html" data-type="entity-link" >S3Config</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/S3Config-1.html" data-type="entity-link" >S3Config</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScanResult.html" data-type="entity-link" >ScanResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolConfig.html" data-type="entity-link" >SchoolConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolExternalToolProperties.html" data-type="entity-link" >SchoolExternalToolProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolExternalToolProps.html" data-type="entity-link" >SchoolExternalToolProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolForLdapLoginProps.html" data-type="entity-link" >SchoolForLdapLoginProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolInfo.html" data-type="entity-link" >SchoolInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolPermissions.html" data-type="entity-link" >SchoolPermissions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolProperties.html" data-type="entity-link" >SchoolProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolProps.html" data-type="entity-link" >SchoolProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolQuery.html" data-type="entity-link" >SchoolQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolRepo.html" data-type="entity-link" >SchoolRepo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolSpecificFileCopyService.html" data-type="entity-link" >SchoolSpecificFileCopyService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolSystemOptionsEntityProps.html" data-type="entity-link" >SchoolSystemOptionsEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolSystemOptionsProps.html" data-type="entity-link" >SchoolSystemOptionsProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolYearProperties.html" data-type="entity-link" >SchoolYearProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolYearProps.html" data-type="entity-link" >SchoolYearProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchoolYearRepo.html" data-type="entity-link" >SchoolYearRepo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchulconnexApiInterface.html" data-type="entity-link" >SchulconnexApiInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchulconnexClientConfig.html" data-type="entity-link" >SchulconnexClientConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchulconnexPersonenInfoParams.html" data-type="entity-link" >SchulconnexPersonenInfoParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SchulconnexRestClientOptions.html" data-type="entity-link" >SchulconnexRestClientOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScopeInfo.html" data-type="entity-link" >ScopeInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ServerConfig.html" data-type="entity-link" >ServerConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShareTokenInfoDto.html" data-type="entity-link" >ShareTokenInfoDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShareTokenProperties.html" data-type="entity-link" >ShareTokenProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StorageProviderProperties.html" data-type="entity-link" >StorageProviderProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmissionContainerElementProps.html" data-type="entity-link" >SubmissionContainerElementProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmissionContainerNodeProps.html" data-type="entity-link" >SubmissionContainerNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmissionItemNodeProps.html" data-type="entity-link" >SubmissionItemNodeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmissionItemProps.html" data-type="entity-link" >SubmissionItemProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmissionProperties.html" data-type="entity-link" >SubmissionProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SuccessfulRes.html" data-type="entity-link" >SuccessfulRes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SystemEntityProps.html" data-type="entity-link" >SystemEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SystemForLdapLoginProps.html" data-type="entity-link" >SystemForLdapLoginProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SystemProps.html" data-type="entity-link" >SystemProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TargetGroupProperties.html" data-type="entity-link" >TargetGroupProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskCreate.html" data-type="entity-link" >TaskCreate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskParent.html" data-type="entity-link" >TaskParent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskProperties.html" data-type="entity-link" >TaskProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskStatus.html" data-type="entity-link" >TaskStatus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TaskUpdate.html" data-type="entity-link" >TaskUpdate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TeamProperties.html" data-type="entity-link" >TeamProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TeamUserProperties.html" data-type="entity-link" >TeamUserProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TldrawClientConfig.html" data-type="entity-link" >TldrawClientConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TldrawConfig.html" data-type="entity-link" >TldrawConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TldrawDrawingProps.html" data-type="entity-link" >TldrawDrawingProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolLaunchParams.html" data-type="entity-link" >ToolLaunchParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolLaunchStrategy.html" data-type="entity-link" >ToolLaunchStrategy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolVersion.html" data-type="entity-link" >ToolVersion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TriggerDeletionExecutionOptions.html" data-type="entity-link" >TriggerDeletionExecutionOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UniqueKey.html" data-type="entity-link" >UniqueKey</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UrlHandler.html" data-type="entity-link" >UrlHandler</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserAndAccountParams.html" data-type="entity-link" >UserAndAccountParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserConfig.html" data-type="entity-link" >UserConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserData.html" data-type="entity-link" >UserData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserGroup.html" data-type="entity-link" >UserGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserGroups.html" data-type="entity-link" >UserGroups</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInfo.html" data-type="entity-link" >UserInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserLoginMigrationQuery.html" data-type="entity-link" >UserLoginMigrationQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserMetdata.html" data-type="entity-link" >UserMetdata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserParams.html" data-type="entity-link" >UserParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserParentsEntityProps.html" data-type="entity-link" >UserParentsEntityProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserProperties.html" data-type="entity-link" >UserProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserWithBoardRoles.html" data-type="entity-link" >UserWithBoardRoles</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VideoConferenceOptions.html" data-type="entity-link" >VideoConferenceOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/XApiKeyConfig.html" data-type="entity-link" >XApiKeyConfig</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});