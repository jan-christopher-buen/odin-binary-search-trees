# Binary Search Trees

A binary search tree built with JavaScript classes and ES modules for [The Odin Project's Binary Search Trees assignment](https://www.theodinproject.com/lessons/javascript-binary-search-trees). It starts balanced, supports direct node-based mutations and four traversal orders, and can be explicitly rebalanced. This is a Node.js console project with no external dependencies.

## Features

- Balanced construction from unsorted numeric arrays, with duplicate removal.
- Iterative lookup, insertion, and deletion, including two-child deletion using an inorder successor.
- Breadth-first traversal and recursive inorder, preorder, and postorder traversal.
- Value-based height and depth queries, plus a single-pass balance check covering every node.
- Explicit rebalancing that preserves current values without sorting them again.
- A random-data driver and a sideways tree printer.

## Run

Install Node.js and npm. Verified in WSL2 with Node **v24.22.0** and npm **11.19.1**. No dependency installation or build step is required.

```sh
npm start
npm test
```

The driver generates twenty random integers from 0 through 99 and prints the initial tree and all four traversal orders. It then inserts 101 through 108 to form a long right-hand chain, rebalances, and prints the rebuilt tree and traversals. Values vary between runs; the balance states are:

```text
Initially balanced: true
After ascending inserts, balanced: false
After rebalance, balanced: true
```

## Usage

```js
import { Tree } from './tree.js';
import { prettyPrint } from './pretty-print.js';

const tree = new Tree([7, 3, 1, 5, 3]);
console.log(tree.includes(5)); // true

tree.insert(9);
tree.deleteItem(3);
const values = [];
tree.inOrderForEach((value) => values.push(value));
console.log(values); // [1, 5, 7, 9]
console.log(tree.depth(5)); // 0, after replacing the root's data with its successor

tree.rebalance();
console.log(tree.isBalanced()); // true
prettyPrint(tree.root);
```

## API

`Node` is a named export from `node.js`. `new Node(data, left = null, right = null)` stores the data and child references. `Tree` is a named export from `tree.js`.

| API | Behavior and return value |
| --- | --- |
| `new Tree(array)` | Copy, sort numerically, deduplicate, and build a balanced tree |
| `root` | Root Node, or `null` when empty |
| `includes(value)` | Return `true` if present, otherwise `false` |
| `insert(value)` | Insert a new value; duplicates are a no-op; return `undefined` |
| `deleteItem(value)` | Remove a value; missing values are a no-op; return `undefined` |
| `levelOrderForEach(callback)` | Visit values breadth-first; return `undefined` |
| `inOrderForEach(callback)` | Visit left subtree, value, right subtree; return `undefined` |
| `preOrderForEach(callback)` | Visit value, left subtree, right subtree; return `undefined` |
| `postOrderForEach(callback)` | Visit left subtree, right subtree, value; return `undefined` |
| `height(value)` | Return longest edge count to a leaf; `0` for a leaf, `undefined` if absent |
| `depth(value)` | Return edge count from root; `0` for root, `undefined` if absent |
| `isBalanced()` | Return whether every node's subtree heights differ by at most one; `true` when empty |
| `rebalance()` | Rebuild from current inorder values and replace root; return `undefined` |
| `prettyPrint(node)` | Print a sideways tree; return `undefined`; no output for a null/undefined node |

Traversals require a function callback, including on empty trees. Missing or non-function callbacks throw `TypeError` with a callback-required message. Each callback receives one numeric value, once per visited node. Empty trees invoke no callbacks. Callback return values are ignored and exceptions propagate to the caller.

## Input and design choices

The assignment requires BST ordering, unique values, traversal callbacks, edge-based metrics, and explicit rebalancing. This implementation adds these input policies:

- The constructor requires an array of finite primitive numbers. Non-array inputs, sparse arrays, non-number elements, `NaN`, and infinities throw `TypeError`.
- `includes`, `insert`, `deleteItem`, `height`, and `depth` also require finite primitive numbers and throw `TypeError` otherwise. Validation happens before mutation.
- Negative numbers, zero, and finite fractions are supported without coercion. `-0` and `0` represent the same value.
- Constructor input is copied; frozen arrays work. The original array is neither changed nor retained as backing storage.

The explicit `undefined` returns for mutation and traversal methods are project choices. `root` is exposed for inspection and pretty printing; use the Tree methods to change values so ordering remains valid.

For every node, **all** values in its left subtree are smaller and **all** values in its right subtree are larger. The initial builder removes adjacent duplicates after sorting, then chooses midpoints using index ranges rather than recursively slicing arrays. Nodes and child references are the authoritative storage.

Insertion links a new leaf without rebuilding. Deletion reconnects a surviving child or, for two children, copies the smallest value in the right subtree and removes that successor from its previous position, retaining any right child it had.

The balance check computes subtree heights in one postorder pass and propagates an unbalanced sentinel. Checking only the root is insufficient: equally tall root subtrees can each contain an unbalanced chain.

Construction is balanced, but insertions and deletions **do not rebalance automatically**. `rebalance()` collects sorted, unique inorder values and reuses the midpoint builder without sorting again. This is not an AVL or red-black tree, and rebalancing may replace Node objects.

## Complexity

Let `N` be constructor input length, `n` the number of distinct nodes, `h` the current tree height, and `s` the number of nodes in the subtree selected by `height(value)`. Constant-time empty and leaf cases are implicit in the bounds below. Callback execution time is excluded.

| Operation | Time | Auxiliary space, excluding node storage |
| --- | --- | --- |
| Constructor | O(N) validation/deduplication + numeric sorting (typically O(N log N)) + O(n) node building | O(N) own arrays and O(log n) build stack, plus engine-dependent sorting space |
| Build from sorted unique values | O(n) | O(log n) stack; creates O(n) nodes |
| `includes`, `insert`, `deleteItem` | O(h) | O(1), using iterative traversal |
| `depth(value)` | O(h) | O(1) |
| `height(value)` | O(h + s), including lookup | O(h) recursive stack in the worst case |
| `levelOrderForEach` | O(n) | O(n), because the array queue retains visited nodes |
| Inorder, preorder, postorder | O(n) | O(h) recursive stack |
| `isBalanced()` | O(n) worst case | O(h) recursive stack |
| `rebalance()` | O(n), with no sorting | O(n) collected values, O(h) traversal stack, and O(log n) build stack; creates O(n) replacement nodes |

Lookup and mutations take O(log n) when balanced and O(n) when skewed. Node storage is O(n). A consumer collecting traversal output into an array adds O(n) output space. JavaScript's sorting algorithm and workspace are engine-dependent; the constructor does not assume a universal sorting-space guarantee. During rebalancing, old and replacement nodes can coexist until unreachable nodes are garbage collected. Console formatting and pretty-print output are outside the Tree operation bounds above.

## Testing and limitations

The deterministic suite covers construction, invalid inputs, input preservation, duplicate handling, full-subtree ordering after mutations, each deletion case, exact traversal orders, callback contracts, height/depth, descendant imbalance, and rebalancing after edits. Verified with Node v24.22.0: **36 tests passed, 0 failed** using `npm test`. The random driver also verifies the `true → false → true` balance sequence with assertions.

Recursive DFS, height, balance, rebalancing, and pretty-print helpers can encounter JavaScript call-stack limits on extremely deep trees. Mutation during traversal is unsupported. Direct edits to public nodes or root can violate invariants and are not validated by subsequent operations.

## Project organization and learning outcomes

- `node.js`: node data and child references.
- `tree.js`: construction, lookup, mutations, traversals, metrics, and rebalancing.
- `pretty-print.js`: the assignment-provided presentation helper.
- `main.js`: random-input console demonstration.
- `tree.test.js`: deterministic tests using `node:test` and `node:assert/strict`.

This project practices recursive base cases, iterative reference updates, successor-based deletion, breadth-first and depth-first traversal, subtree invariants, and the relationship between tree shape and operation cost.
