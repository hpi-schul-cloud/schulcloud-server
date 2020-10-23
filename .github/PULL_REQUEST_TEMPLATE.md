# Description
<!--
  This is a template to add as many information as possible to the pull request, to help reviewer and as a checklist for you. Points to remember are set in the comments, please read and keep them in mind:
  
    - Code should be self-explanatory and share your knowledge with others
    - Document code that is not self-explanatory
    - Think about bugs and keep security in mind
    - Write tests (Unit and Integration), also for error cases
    - Main logic should hidden behind the api, never trust the client
    - Visible changes should be discussed with the UX-Team from the begining of development; they also have to accept them at the end
    - Keep the changelog up-to-date
    - Leave the code cleaner than you found it. Remove unnecessary lines. Listen to the linter.
-->

## Links to Tickets or other pull requests
<!--
Base links to copy
- https://github.com/hpi-schul-cloud/schulcloud-client/pull/????
- https://ticketsystem.hpi-schul-cloud.org/browse/SC-????
-->

## Changes
<!--
  What will the PR change?
  Why are the changes required?
  Short notice if a ticket exists, more detailed if not
-->

## Datasecurity <sub><sup>details [on Confluence](https://docs.hpi-schul-cloud.org/x/2S3GBg)</sup></sub>
<!--
  Notice about:
  - model changes
  - logging of user data
  - right changes
  - and other user data stuff
  If you are not sure if it is relevant, take a look at confluence or ask the data-security team.
-->

## Deployment
<!--
  Keep in mind to changes to seed data, if changes are done by migration scripts.
  Changes to the infrastructure have to be discussed with the devops

  This point should includes following information:
  - What is required for deployment?
  - Environment variables like FEATURE_XY=true
  - Migration scripts to run, other requirements
-->

## New Repos, NPM pakages or vendor scripts
<!--
  Keep in mind the stability, performance, activity and author.

  Describe why it is needed.
-->

## Approval for review
- [ ] All points were discussed with the ticket creator, support-team or product owner. The code upholds all quality guidelines from the PR-template.

> Notice: Please remove the WIP label if the PR is ready to review, otherwise nobody will review it.

### Link to Definition of Done
More and detailed information on the *definition of done* can be found [on Confluence](https://docs.schul-cloud.org/pages/viewpage.action?pageId=92831762)
