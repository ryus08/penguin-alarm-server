# Penguin
A server which aggregates and caches git-provider (currently just Gitlab) information

## TODO

P0

Significant effort 
* Use a real cache in ./src/clients/clientbuilder
* publish docker image

Some effort
* Durable but non-dynamo repository. Local disk would probably be good enough
* Refresh git provider tokens

Minimal effort
* Set rp timeouts higher
* CORS
* error handling, was @cimpress-technology/belterrorhandling
* New dbs, add to dynamo

P0.1

* Add AuthZ ACL caching, otherwise we'll make 2 git provider calls on every route
* More gracefully skip newrelic
* More gracefully skip AWS ML

P1

* Load gitlab username from the user's registered token
* More AuthZ testing, even if just manual
* Use a representative user's token instead of configured god token in the poller. Maybe just set it up as the config "owner"
* An authZ mechanism which uses a list of configured users who are allows to pair by email. I.e. "the OIDC provider seems to say you are person@foo.com, we'll trust that you are the same person the git provider says is person@foo.com"
* Add AuthZ for predictions. Skipped because they are config agnostic and we didn't have a way to use it yet
* This README. How to build, run, and deploy
* Show reviewers
* Strategy pattern for bitbucket and github
* Show the scoring algorithm. Add exclude list of users
* don't use app.locals.gitLabclient in any routes. Just for polling
* Upload a token instead of using oauth
* Notifications from gitprovider on need to refresh instead of polling
* Anything commented out in the config. These are nice to haves
* Get ML working without AWS. And write down how to get it working with AWS
* Get newrelic working behind an interface for other APM solutions
* Get the cimpress.yaml config in a better place for reintegrating for Cimpress.
  * Loading newrelic monitoring into the app and poller, see comment in app.js and pollers/poll.js
* Upgrade dependencies.
* Smoke tests
* Get the poller to trigger immediately on a new config
* Add new preferences methods to customizr
* req/res logging