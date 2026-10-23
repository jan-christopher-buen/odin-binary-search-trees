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

test('includes follows left and right paths for present and missing values', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  for (const value of [1, 3, 4, 5, 7]) assert.equal(tree.includes(value), true);
  for (const value of [-1, 0, 2.5, 8]) assert.equal(tree.includes(value), false);
  assert.equal(new Tree([]).includes(1), false);
});

test('insert handles empty trees, both directions, duplicates, and zero equality', () => {
  const tree = new Tree([]);
  assert.equal(tree.insert(4), undefined);
  const root = tree.root;
  for (const value of [2, 6, 1, 3, 5, 7, 3, 4, 0, -0, -2.5, 1.5]) tree.insert(value);
  assert.equal(tree.root, root);
  assertTree(tree, [-2.5, 0, 1, 1.5, 2, 3, 4, 5, 6, 7]);
  assert.equal(tree.includes(-0), true);
  assert.equal(tree.deleteItem(-0), undefined);
  assert.equal(tree.includes(0), false);
  assertTree(tree, [-2.5, 1, 1.5, 2, 3, 4, 5, 6, 7]);
});

test('insert does not automatically rebuild or balance a skewed tree', () => {
  const tree = new Tree([]);
  for (const value of [1, 2, 3, 4, 5]) tree.insert(value);
  assert.equal(tree.root.data, 1);
  assert.equal(tree.root.left, null);
  assert.equal(tree.root.right.right.right.right.data, 5);
  assertTree(tree, [1, 2, 3, 4, 5]);
});

test('delete removes a leaf and treats absent values as a no-op', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  assert.equal(tree.deleteItem(1), undefined);
  assertTree(tree, [2, 3, 4, 5, 6, 7]);
  const root = tree.root;
  assert.equal(tree.deleteItem(99), undefined);
  tree.deleteItem(1);
  assert.equal(tree.root, root);
  assertTree(tree, [2, 3, 4, 5, 6, 7]);
});

test('delete reconnects a non-root node with only a left child', () => {
  const tree = new Tree([]);
  for (const value of [10, 5, 3]) tree.insert(value);
  tree.deleteItem(5);
  assert.equal(tree.root.left.data, 3);
  assertTree(tree, [3, 10]);
});

test('delete reconnects a non-root node with only a right child', () => {
  const tree = new Tree([]);
  for (const value of [10, 15, 18]) tree.insert(value);
  tree.deleteItem(15);
  assert.equal(tree.root.right.data, 18);
  assertTree(tree, [10, 18]);
});

test('delete handles root as a leaf and with either single child', () => {
  const leaf = new Tree([10]);
  assert.equal(leaf.deleteItem(10), undefined);
  assert.equal(leaf.root, null);
  assert.equal(leaf.deleteItem(10), undefined);
  for (const child of [5, 15]) {
    const tree = new Tree([10]);
    tree.insert(child);
    tree.deleteItem(10);
    assert.equal(tree.root.data, child);
    assertTree(tree, [child]);
  }
});

test('two-child deletion removes the successor and retains its right child', () => {
  const tree = new Tree([]);
  for (const value of [20, 10, 40, 30, 50, 25, 35, 27]) tree.insert(value);
  tree.deleteItem(20);
  assert.equal(tree.root.data, 25);
  assert.equal(tree.root.right.left.left.data, 27);
  assert.equal(tree.includes(20), false);
  assertTree(tree, [10, 25, 27, 30, 35, 40, 50]);
  tree.deleteItem(40);
  assertTree(tree, [10, 25, 27, 30, 35, 50]);
});

test('two-child deletion handles an immediate right successor with a right child', () => {
  const tree = new Tree([]);
  for (const value of [10, 5, 15, 20]) tree.insert(value);
  tree.deleteItem(10);
  assert.equal(tree.root.data, 15);
  assert.equal(tree.root.right.data, 20);
  assertTree(tree, [5, 15, 20]);
});

test('mixed repeated deletion preserves strict ordering until the tree is empty', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  const stages = [
    [4, [1, 2, 3, 5, 6, 7]],
    [1, [2, 3, 5, 6, 7]],
    [7, [2, 3, 5, 6]],
    [2, [3, 5, 6]],
    [6, [3, 5]],
    [3, [5]],
    [5, []],
  ];
  for (const [value, expected] of stages) {
    assert.equal(tree.deleteItem(value), undefined);
    assertTree(tree, expected);
  }
  assert.equal(tree.root, null);
  tree.insert(8);
  assertTree(tree, [8]);
});

test('invalid values throw before mutation in search, insertion, and deletion', () => {
  const tree = new Tree([1, 2, 3]);
  const root = tree.root;
  for (const value of [undefined, null, false, '2', NaN, Infinity, -Infinity,
    {}, [], new Number(2), 2n, Symbol('n'), () => 2]) {
    for (const method of ['includes', 'insert', 'deleteItem']) {
      assert.throws(() => tree[method](value), TypeError);
    }
    assert.equal(tree.root, root);
    assertTree(tree, [1, 2, 3]);
  }
});

const traversalCases = [
  ['levelOrderForEach', [4, 2, 6, 1, 3, 5, 7]],
  ['inOrderForEach', [1, 2, 3, 4, 5, 6, 7]],
  ['preOrderForEach', [4, 2, 1, 3, 6, 5, 7]],
  ['postOrderForEach', [1, 3, 2, 5, 7, 6, 4]],
];

for (const [method, expected] of traversalCases) {
  test(`${method} passes each value once in the required order`, () => {
    const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
    const values = [];
    const result = tree[method]((...args) => {
      assert.equal(args.length, 1);
      assert.equal(typeof args[0], 'number');
      values.push(args[0]);
      return 'ignored callback return';
    });
    assert.equal(result, undefined);
    assert.deepEqual(values, expected);
    assertTree(tree, [1, 2, 3, 4, 5, 6, 7]);
  });
}

test('all traversals handle empty and singleton trees', () => {
  for (const [method] of traversalCases) {
    let calls = 0;
    assert.equal(new Tree([])[method](() => { calls += 1; }), undefined);
    assert.equal(calls, 0);
    const values = [];
    assert.equal(new Tree([42])[method]((value) => values.push(value)), undefined);
    assert.deepEqual(values, [42]);
  }
});

test('all traversals require a function even when the tree is empty', () => {
  for (const tree of [new Tree([]), new Tree([1, 2, 3])]) {
    for (const [method] of traversalCases) {
      for (const callback of [undefined, null, false, 0, '', {}, [], 'callback']) {
        assert.throws(() => tree[method](callback), { name: 'TypeError', message: /callback.*required/i });
      }
    }
  }
});

test('all traversals propagate callback errors and stop visiting', () => {
  const error = new Error('callback failure');
  for (const [method] of traversalCases) {
    const tree = new Tree([1, 2, 3]);
    let calls = 0;
    assert.throws(() => tree[method](() => {
      calls += 1;
      throw error;
    }), (actual) => actual === error);
    assert.equal(calls, 1);
    assertTree(tree, [1, 2, 3]);
  }
});

test('height and depth count edges for root, internal nodes, and leaves', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  assert.equal(tree.depth(4), 0);
  assert.equal(tree.height(4), 2);
  assert.equal(tree.depth(2), 1);
  assert.equal(tree.height(2), 1);
  assert.equal(tree.depth(7), 2);
  assert.equal(tree.height(7), 0);
  assert.equal(tree.depth(99), undefined);
  assert.equal(tree.height(99), undefined);
});

test('height and depth work on empty, singleton, and fractional-value trees', () => {
  const empty = new Tree([]);
  assert.equal(empty.height(1), undefined);
  assert.equal(empty.depth(1), undefined);
  const singleton = new Tree([0]);
  assert.equal(singleton.height(-0), 0);
  assert.equal(singleton.depth(-0), 0);
  const tree = new Tree([-2, 0, 1.5]);
  assert.equal(tree.height(0), 1);
  assert.equal(tree.depth(1.5), 1);
});

test('metrics follow link changes after insertion and deletion', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  tree.insert(8);
  tree.insert(9);
  assert.equal(tree.height(4), 4);
  assert.equal(tree.height(6), 3);
  assert.equal(tree.depth(9), 4);
  tree.deleteItem(7);
  assert.equal(tree.height(4), 3);
  assert.equal(tree.depth(9), 3);
  assert.equal(tree.height(7), undefined);
  tree.deleteItem(4);
  assert.equal(tree.root.data, 5);
  assert.equal(tree.depth(5), 0);
  assert.equal(tree.height(5), 3);
  assertTree(tree, [1, 2, 3, 5, 6, 8, 9]);
});

test('height and depth reject invalid values even on empty trees', () => {
  for (const tree of [new Tree([]), new Tree([1, 2, 3])]) {
    for (const value of [undefined, null, false, '2', NaN, Infinity, -Infinity,
      {}, [], new Number(2), 2n, Symbol('n')]) {
      assert.throws(() => tree.height(value), TypeError);
      assert.throws(() => tree.depth(value), TypeError);
    }
  }
});

test('empty, singleton, and balanced trees report balanced', () => {
  for (const values of [[], [1], [1, 2], [7, 6, 5, 4, 3, 2, 1]]) {
    const tree = new Tree(values);
    assert.equal(tree.isBalanced(), true);
  }
});

test('both right-skewed and left-skewed trees report unbalanced', () => {
  for (const values of [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]]) {
    const tree = new Tree([]);
    for (const value of values) tree.insert(value);
    assert.equal(tree.isBalanced(), false);
    assertTree(tree, [1, 2, 3, 4, 5]);
    tree.deleteItem(values[0]);
    assert.equal(tree.isBalanced(), false);
  }
});

test('equal root-subtree heights do not hide unbalanced descendants', () => {
  const tree = new Tree([]);
  for (const value of [10, 5, 15, 4, 16, 3, 17]) tree.insert(value);
  assert.equal(tree.height(5), 2);
  assert.equal(tree.height(15), 2);
  assert.equal(tree.isBalanced(), false);
  assertTree(tree, [3, 4, 5, 10, 15, 16, 17]);
});

test('rebalance handles empty, singleton, and already-balanced trees', () => {
  const empty = new Tree([]);
  assert.equal(empty.rebalance(), undefined);
  assert.equal(empty.root, null);
  assert.equal(empty.isBalanced(), true);
  const singleton = new Tree([5]);
  singleton.rebalance();
  assertTree(singleton, [5]);
  assert.equal(singleton.height(5), 0);
  const balanced = new Tree([1, 2, 3, 4, 5, 6, 7]);
  assert.equal(balanced.rebalance(), undefined);
  assertTree(balanced, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(balanced.isBalanced(), true);
});

test('rebalance turns a sorted insertion chain into a balanced tree', () => {
  const tree = new Tree([]);
  for (const value of [1, 2, 3, 4, 5, 6, 7]) tree.insert(value);
  assert.equal(tree.isBalanced(), false);
  assert.equal(tree.height(1), 6);
  assert.equal(tree.rebalance(), undefined);
  assert.equal(tree.isBalanced(), true);
  assertBalancedConstruction(tree.root);
  assert.equal(tree.root.data, 4);
  assert.equal(tree.height(4), 2);
  assertTree(tree, [1, 2, 3, 4, 5, 6, 7]);
});

test('rebalance preserves current mutations and supports subsequent search and edits', () => {
  const tree = new Tree([1, 2, 3, 4, 5, 6, 7]);
  tree.deleteItem(2);
  tree.deleteItem(6);
  for (const value of [8, 9, 10, 11, 12, 12]) tree.insert(value);
  assert.equal(tree.isBalanced(), false);
  tree.rebalance();
  assert.equal(tree.isBalanced(), true);
  assertTree(tree, [1, 3, 4, 5, 7, 8, 9, 10, 11, 12]);
  assert.equal(tree.includes(2), false);
  assert.equal(tree.includes(6), false);
  assert.equal(tree.includes(12), true);
  tree.insert(2);
  tree.deleteItem(11);
  assertTree(tree, [1, 2, 3, 4, 5, 7, 8, 9, 10, 12]);
  tree.rebalance();
  assert.equal(tree.isBalanced(), true);
  assertTree(tree, [1, 2, 3, 4, 5, 7, 8, 9, 10, 12]);
});

test('rebalancing one instance leaves another unchanged', () => {
  const first = new Tree([1, 2, 3]);
  const second = new Tree([1, 2, 3]);
  const secondRoot = second.root;
  first.insert(4);
  first.insert(5);
  first.deleteItem(1);
  first.rebalance();
  assertTree(first, [2, 3, 4, 5]);
  assert.equal(first.isBalanced(), true);
  assert.equal(second.root, secondRoot);
  assertTree(second, [1, 2, 3]);
});

test('driver growth sequence unbalances even duplicate-heavy starting arrays', () => {
  for (const input of [new Array(20).fill(0), new Array(20).fill(99),
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]]) {
    const tree = new Tree(input);
    assert.equal(tree.isBalanced(), true);
    for (const value of [101, 102, 103, 104, 105, 106, 107, 108]) tree.insert(value);
    assert.equal(tree.isBalanced(), false);
    tree.rebalance();
    assert.equal(tree.isBalanced(), true);
    assertBalancedConstruction(tree.root);
    for (const value of [101, 102, 103, 104, 105, 106, 107, 108]) {
      assert.equal(tree.includes(value), true);
    }
  }
});
