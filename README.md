# Penguin
A server which aggregates and caches git-provider (currently just Gitlab) information

## Running

This app runs on Nodejs 16.x. If you have that installed, `npm install` will download dependencies and `npm start` will start the development server.

### Running with docker

A docker image is published to ryus08/penguin-alarm-server. You can run this with `docker run ryus08/penguin-alarm-server`. 

## Configuring

This app uses the [node-config](https://github.com/node-config/node-config/wiki) library for configuration. You can set the environment variables specified in [./config/custom-environment-variables.yaml](./config/custom-environment-variables.yaml) to set the config values those correlate to. You can also add your own config files, such as local.yaml if you are running locally and don't want your config (especially secrets) checked in. If something doesn't have an environment variable override in custom-environment-variables.yaml, this is also a good way to configure your app. For example, if you have a config file called `local-production.yaml` (for usage when `NODE_ENV`=`production`), you could build your own docker image with this copied into the config directory with a Dockerfile as:

```
FROM ryus08/penguin-alarm-server 

COPY ./local-production.yaml ./config/local-production.yaml
```

Then when you run your new docker image with NODE_ENV=production, your config file will be picked up in addition to the defaults baked into the `penguin-alarm-server `image

### Config options

See the files in the config directory for config options. Specifically, you'll probably want to set at least the following:

* gitlabToken - A gitlab token to hydrate the local store of gitlab data
* cors - A config for the [cors](https://github.com/expressjs/cors) package. It allows all origins by default, but you'll probably want to restrict it to wherever you're hosting [the UI](https://github.com/ryus08/pengiun-alarm-ui).
* authorization - Configuration for your authorization server.
* selfUrl - The URL you're hosting this server at

## TODO

P0

Significant effort 
* Use a real cache in ./src/clients/clientbuilder

P0.1

Significant effort 
* Add AuthZ ACL caching, otherwise we'll make 2 git provider calls on every route

Some effort
* Durable but non-dynamo repository. Local disk would probably be good enough
* More gracefully skip newrelic
* More gracefully skip AWS ML

P1

* Refresh git provider tokens
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