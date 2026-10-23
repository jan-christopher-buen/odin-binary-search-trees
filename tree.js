import { Node } from './node.js';

function validateValue(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError('Tree values must be finite numbers');
  }
}

export class Tree {
  constructor(array) {
    this.root = this.#buildTree(array);
  }

  includes(value) {
    validateValue(value);
    return this.#findNode(value) !== null;
  }

  insert(value) {
    validateValue(value);
    if (this.root === null) {
      this.root = new Node(value);
      return;
    }
    let current = this.root;
    while (true) {
      if (value === current.data) return;
      const direction = value < current.data ? 'left' : 'right';
      if (current[direction] === null) {
        current[direction] = new Node(value);
        return;
      }
      current = current[direction];
    }
  }

  deleteItem(value) {
    validateValue(value);
    let current = this.root;
    let parent = null;
    while (current !== null && current.data !== value) {
      parent = current;
      current = value < current.data ? current.left : current.right;
    }
    if (current === null) return;

    if (current.left !== null && current.right !== null) {
      // Copy the inorder successor, then remove it from its original position.
      let successor = current.right;
      let successorParent = current;
      while (successor.left !== null) {
        successorParent = successor;
        successor = successor.left;
      }
      current.data = successor.data;
      parent = successorParent;
      current = successor;
    }

    const child = current.left === null ? current.right : current.left;
    if (parent === null) this.root = child;
    else if (parent.left === current) parent.left = child;
    else parent.right = child;
  }

  #findNode(value) {
    let current = this.root;
    while (current !== null) {
      if (current.data === value) return current;
      current = value < current.data ? current.left : current.right;
    }
    return null;
  }

  #buildTree(array) {
    if (!Array.isArray(array)) {
      throw new TypeError('Tree input must be an array of finite numbers');
    }
    // Iterating values also rejects holes in sparse arrays as undefined.
    for (const value of array) validateValue(value);
    const sorted = [...array].sort((a, b) => a - b);
    const unique = [];
    for (const value of sorted) {
      if (unique.length === 0 || value !== unique[unique.length - 1]) {
        unique.push(value);
      }
    }
    return this.#buildSorted(unique, 0, unique.length - 1);
  }

  #buildSorted(values, start, end) {
    if (start > end) return null;
    const middle = Math.floor((start + end) / 2);
    return new Node(
      values[middle],
      this.#buildSorted(values, start, middle - 1),
      this.#buildSorted(values, middle + 1, end),
    );
  }
}
