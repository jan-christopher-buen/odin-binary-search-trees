import assert from 'node:assert/strict';
import { Tree } from './tree.js';
import { prettyPrint } from './pretty-print.js';

const input = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
const tree = new Tree(input);

function showBalance(label, expected) {
  const balanced = tree.isBalanced();
  console.log(`${label}: ${balanced}`);
  assert.equal(balanced, expected);
}

function printTraversals() {
  for (const [label, method] of [
    ['Level order', 'levelOrderForEach'],
    ['Preorder', 'preOrderForEach'],
    ['Postorder', 'postOrderForEach'],
    ['Inorder', 'inOrderForEach'],
  ]) {
    const values = [];
    tree[method]((value) => values.push(value));
    console.log(`${label}: ${values.join(', ')}`);
  }
}

console.log('Random starting values:', input.join(', '));
showBalance('Initially balanced', true);
prettyPrint(tree.root);
printTraversals();

const additions = [101, 102, 103, 104, 105, 106, 107, 108];
for (const value of additions) tree.insert(value);
console.log('\nInserted ascending values:', additions.join(', '));
showBalance('After ascending inserts, balanced', false);

tree.rebalance();
console.log('\nRebalanced tree:');
showBalance('After rebalance, balanced', true);
prettyPrint(tree.root);
printTraversals();
