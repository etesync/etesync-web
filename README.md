An EteSync web client. Use EteSync from the browser

# Usage

**Note:** This is still in an early stage. It should perfectly safe to use (though
plase refer to the warning at the bottom) but you should expect bugs/bad design.

A live isntance is available on: https://client.etesync.com

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
You could for exapmle use the python built-in web server by runnig `python3 -m http.server` from
the build directory.

Alternatively, you can run the debug server just to verify everything works. To do that,
run `yarn start`.

# Important!

There are some rough edges at the moment, this project is still in early alpha!

While it's OK to use it for **accessing** your data, do **NOT** use it to create
new contacts/calendars while this notice is here! It uses a static IV for all
encryption operations at the moment, which is very bad!
