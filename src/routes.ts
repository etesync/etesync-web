// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

export interface RouteKeysType {
  [Identifier: string]: any;
}

export class RouteResolver {
  public routes: {};

  constructor(routes: {}) {
    this.routes = routes;
  }

  public getRoute(name: string, _keys?: RouteKeysType): string {
    let dict = this.routes;

    let path: string[] = [];
    name.split(".").forEach((key) => {
      const val = (typeof dict[key] === "string") ? dict[key] : (dict[key]._base) ? dict[key]._base : key;
      path.push(val);

      dict = dict[key];
    });

    if (_keys) {
      const keys = Object.assign({}, _keys);

      path = path.map((pathComponent) => {
        return pathComponent.split("/").map((val) => {
          if (val[0] === ":") {
            const ret = keys[val.slice(1)];
            if (ret === undefined) {
              throw new Error("Missing key: " + val.slice(1));
            }

            delete keys[val.slice(1)];
            return ret;
          }

          return val;
        }).join("/");
      });

      if (Object.keys(keys).length !== 0) {
        throw new Error("Too many keys for route.");
      }
    }

    return "/" + path.join("/");
  }
}
