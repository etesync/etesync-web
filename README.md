<p align="center">
  <img width="120" src="src/images/logo.svg" />
  <h1 align="center">EteSync - Encrypt Everything</h1>
</p>

The EteSync Web App - Use EteSync from the browser!


![GitHub tag](https://img.shields.io/github/tag/etesync/etesync-web.svg)
[![Chat with us](https://img.shields.io/badge/chat-IRC%20|%20Matrix%20|%20Web-blue.svg)](https://www.etebase.com/community-chat/)

For notes, please refer to [the EteSync Notes](https://github.com/etesync/etesync-notes/) repository.

# Usage

A live instance is available on: https://pim.etesync.com

Please be advised that while it's probably safe enough to use the hosted client
in many cases, it's generally not preferable. It's recommended that you use signed
releases which's signature you manually verify and are run locally!

More info is available on the [FAQ](https://www.etesync.com/faq/#web-client).

## Running your own

You can either self-host your own client to be served from your own server, or
better yet, just run an instance locally.

You can get the latest version of the web client from https://pim.etesync.com/etesync-web.tgz. This
file is automatically generated on each deploy and is exactly the same as the delpoyed version.
After fetching this file you need to extract it by e.g. running `tar -xzf etesync-web.tgz`, and then
you can serve the files using your favourite web server. Please keep in mind that opening the HTML files
directly in the browser is not supported.

If you are just serving the app locally, you could, for example, use the python built-in web server by
running `python3 -m http.server` from inside the extracted `etesync-web` directory. If you plan on
serving it from a server, please use a proper web server such as nginx.

## Building it yourself

Before you can build the web app from source, you need to make sure you have `yarn` install.

Then clone this repository `yarn`, run `yarn` and wait until all of the deps are installed.

Then it's recommended you run `yarn build` to build a production ready client you should serve
(even if run locally!) and then just serve the `build` directory from a web server.

The URL of the EteSync API the web app connects to defaults to `api.etebase.com`, but can be changed on
the login page. You can change this default by setting the environment variable `REACT_APP_DEFAULT_API_PATH`
during the build. This can be useful for self-hosting. You can set the default URL to the address
of your self-hosted EteSync server so you don't have to change the address for every login.

### Serving from a subdirectory

In order to run your own version and serve it from a subdirectory rather than the top level of the domain, add `"homepage": "/subdir-name"` to the `package.json` file.
