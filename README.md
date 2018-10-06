# The EteSync Web App

Use EteSync from the browser!


![GitHub tag](https://img.shields.io/github/tag/etesync/etesync-web.svg)
[![Chat on freenode](https://img.shields.io/badge/irc.freenode.net-%23EteSync-blue.svg)](https://webchat.freenode.net/?channels=#etesync)

# Usage

**Note:** This is still in an early stage, but it should be safe to use. It uses the battle
tested [sjcl](https://crypto.stanford.edu/sjcl/) javascript crypto library for encryption,
so that should be fine too.

A live instance is available on: https://client.etesync.com

Please be advised that while it's probably safe enough to use the hosted client
in many cases, it's generally not preferable. It's recommended that you use signed
releases which's signature you manually verify and are run locally!

More info is available on the [FAQ](https://www.etesync.com/faq/#web-client).

## Running your own

You can either self-host your own client to be served from your own server, or
better yet, just run an instance locally.

First make sure you have `yarn` install.

Then clone this repository `yarn`, run `yarn` and wait until all of the deps are installed.

Then it's recommended you run `yarn build` to build a production ready client you should serve
(even if run locally!) and then just serve the `build` directory from a web server.
You could, for example, use the python built-in web server by running `python3 -m http.server` from
the build directory.

Alternatively, you can run the debug server just to verify everything works,
though be aware that the app will probably be quite slow. To do that, run `yarn start`.
