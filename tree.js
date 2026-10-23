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
