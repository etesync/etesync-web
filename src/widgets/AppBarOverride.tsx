import * as React from 'react';
import * as ReactDOM from 'react-dom';

export default (props: {title: string, children?: React.ReactNode | React.ReactNode[]}) => {
  const titleEl = document.querySelector('#appbar-title');
  const buttonsEl = document.querySelector('#appbar-buttons');

  return (
    <>
      {titleEl && ReactDOM.createPortal(
        <span>{props.title}</span>,
        titleEl
      )}
      {buttonsEl && props.children && ReactDOM.createPortal(
        props.children,
        buttonsEl
      )}
    </>
  );
};
