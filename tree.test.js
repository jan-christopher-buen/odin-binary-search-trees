import test from 'node:test';
import assert from 'node:assert/strict';
import { Node } from './node.js';
import { Tree } from './tree.js';

function assertTree(tree, expected) {
  const actual = [];
  function check(node, lower, upper) {
    if (node === null) return;
    assert.ok(node instanceof Node);
    assert.ok(node.data > lower && node.data < upper, 'strict ordering across subtrees');
    check(node.left, lower, node.data);
    actual.push(node.data);
    check(node.right, node.data, upper);
  }
  check(tree.root, -Infinity, Infinity);
  // Numeric equality treats stored -0 and 0 as the same value.
  assert.deepEqual(actual.map((value) => value === 0 ? 0 : value), expected);
}

function assertBalancedConstruction(node) {
  if (node === null) return -1;
  const left = assertBalancedConstruction(node.left);
  const right = assertBalancedConstruction(node.right);
  assert.ok(Math.abs(left - right) <= 1);
  return Math.max(left, right) + 1;
}

test('Node stores supplied data and child references with null defaults', () => {
  const node = new Node(2);
  assert.equal(node.data, 2);
  assert.equal(node.left, null);
  assert.equal(node.right, null);
  const left = new Node(1);
  const right = new Node(3);
  const parent = new Node(2, left, right);
  assert.equal(parent.left, left);
  assert.equal(parent.right, right);
});

test('empty and singleton construction', () => {
  assert.equal(new Tree([]).root, null);
  const tree = new Tree([5]);
  assert.equal(tree.root.data, 5);
  assert.equal(tree.root.left, null);
  assert.equal(tree.root.right, null);
  assertTree(tree, [5]);
});

test('construction sorts numerically, removes duplicates, and balances every node', () => {
  const tree = new Tree([10, 2, 1, 30, 20, 4, 3, 2, 10, 1]);
  assertTree(tree, [1, 2, 3, 4, 10, 20, 30]);
  assert.equal(tree.root.data, 4);
  assertBalancedConstruction(tree.root);
  assertTree(new Tree([7, 7, 7, 7]), [7]);
  assertTree(new Tree([-2.5, 0, -3, 1.5, -0, 1.5]), [-3, -2.5, 0, 1.5]);
});

test('constructor copies input, supports frozen arrays, and retains no backing array', () => {
  const input = [3, 1, 2, 2];
  const tree = new Tree(input);
  assert.deepEqual(input, [3, 1, 2, 2]);
  input.fill(99);
  assertTree(tree, [1, 2, 3]);
  const frozen = Object.freeze([9, 2, 6, 2]);
  assertTree(new Tree(frozen), [2, 6, 9]);
});

test('constructor rejects non-arrays, invalid elements, and sparse arrays', () => {
  for (const input of [undefined, null, 3, '123', {}, new Float64Array([1]),
    [1, '2'], [null], [undefined], [false], [NaN], [Infinity], [-Infinity],
    [1n], [new Number(1)], [Symbol('n')], new Array(3), [1, , 3]]) {
    assert.throws(() => new Tree(input), TypeError);
  }
});

test('constructed instances own separate node objects', () => {
  const first = new Tree([1, 2, 3]);
  const second = new Tree([1, 2, 3]);
  assert.notEqual(first.root, second.root);
  assert.notEqual(first.root.left, second.root.left);
  first.root.left.data = 0;
  assertTree(second, [1, 2, 3]);
});
