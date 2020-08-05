// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { RouteResolver } from "./routes";

const routes = {
  home: "",
  post: {
    _base: "post",
    _id: {
      _base: ":postId",
      comment: "comment/:commentId",
      revision: "history/:revisionId/:someOtherVar/test",
    },
  },
};

const routeResolver = new RouteResolver(routes);

it("translating routes", () => {
  // Working basic resolves
  expect(routeResolver.getRoute("home")).toBe("/");
  expect(routeResolver.getRoute("post")).toBe("/post");
  expect(routeResolver.getRoute("post._id")).toBe("/post/:postId");
  expect(routeResolver.getRoute("post._id.comment")).toBe("/post/:postId/comment/:commentId");

  // Working translation resolves
  expect(routeResolver.getRoute("home")).toBe("/");
  expect(routeResolver.getRoute("post")).toBe("/post");
  expect(routeResolver.getRoute("post._id", { postId: 3 })).toBe("/post/3");
  expect(routeResolver.getRoute("post._id.comment",
    { postId: 3, commentId: 5 })).toBe("/post/3/comment/5");
  expect(routeResolver.getRoute("post._id.revision",
    { postId: 3, revisionId: 5, someOtherVar: "a" })).toBe("/post/3/history/5/a/test");

  // Failing basic resolves
  expect(() => {
    routeResolver.getRoute("bad");
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("home.bad");
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("post._id.bad");
  }).toThrow();

  // Failing translations
  expect(() => {
    routeResolver.getRoute("home", { test: 4 });
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("post._id", { test: 4 });
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("post._id", { postId: 3, test: 4 });
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("post._id.comment", { postId: 3, commentId: 5, test: 4 });
  }).toThrow();
  expect(() => {
    routeResolver.getRoute("post._id.comment", { postId: 3 });
  }).toThrow();
});
