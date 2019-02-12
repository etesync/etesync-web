import * as React from 'react';

// Generic handling of input changes
export function handleInputChange(self: React.Component, part?: string) {
  return (event: React.ChangeEvent<any>) => {
    const name = event.target.name;
    const value = event.target.value;

    let newState;

    if (event.target.type === 'checkbox') {
      newState = {
        [name]: event.target.checked,
      };
    } else {
      newState = {
        [name]: value,
      };
    }

    if (part === undefined) {
      self.setState(newState);
    } else {
      self.setState({
        [part]: {
          ...self.state[part],
          ...newState,
        },
      });
    }
  };
}

export function insertSorted<T>(array: T[] = [], newItem: T, key: string) {
  if (array.length === 0) {
    return [newItem];
  }

  for (let i = 0, len = array.length; i < len; i++) {
    if (newItem[key] < array[i][key]) {
      array.splice(i, 0, newItem);
      return array;
    }
  }

  array.push(newItem);

  return array;
}
