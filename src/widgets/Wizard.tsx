// SPDX-FileCopyrightText: © 2019 EteSync Authors
// SPDX-License-Identifier: GPL-3.0-only

import * as React from "react";
import Button from "@material-ui/core/Button";

import Container from "./Container";

export interface PagePropsType {
  prev?: () => void;
  next?: () => void;
  currentPage: number;
  totalPages: number;
}

export function WizardNavigationBar(props: PagePropsType) {
  const first = props.currentPage === 0;
  const last = props.currentPage === props.totalPages - 1;

  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
      <Button
        variant="contained"
        disabled={first}
        onClick={props.prev}
      >
        Prev
      </Button>
      <Button
        variant="contained"
        color="primary"
        disabled={!props.next}
        onClick={props.next}
      >
        {(last) ? "Finish" : "Next"}
      </Button>
    </div>
  );
}

interface PropsType extends React.HTMLProps<HTMLDivElement> {
  pages: ((props: PagePropsType) => React.ReactNode)[];
  onFinish: () => void;
}

export default function Wizard(inProps: PropsType) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const { pages, onFinish, ...props } = inProps;

  const Content = pages[currentPage];

  const first = currentPage === 0;
  const last = currentPage === pages.length - 1;
  const prev = !first ? () => setCurrentPage(currentPage - 1) : undefined;
  const next = !last ? () => setCurrentPage(currentPage + 1) : onFinish;

  return (
    <Container {...props}>
      {Content({ prev, next, currentPage, totalPages: pages.length })}
    </Container>
  );
}

