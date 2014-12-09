/* global describe, it, beforeEach, before */

'use strict';

var assert = require('assert'),
	Forestry = require('../src/Forestry'),
	Node = Forestry.Node;

describe('Forestry.Node', function () {

	describe('constructor', function () {
		it('returns correctly populated Forestry.Node object', function () {
			var fn = new Node('value');

			assert.equal(fn.data, 'value');
			assert.equal(fn.parent, null);
			assert(fn.children instanceof Array);
			assert.equal(fn.children.length, 0);
		});

	});

	describe('prototype methods', function () {
		
		var root;
		beforeEach(function () {
			root = new Node('a');
			root.addChild(new Node('a/1')).children[0].addChild(new Node('a/1/i'));
			root.addChild(new Node('a/2'));
		});	

		describe('getRoot', function () {
			it('should return the root of the tree the node belongs to', function () {
				assert.equal(root.children[0].getRoot(), root);
				assert.equal(root.children[0].children[0].getRoot(), root);	
			});
		});

		describe('isRoot', function () {
			it('should return true if node is the root of a tree', function () {
				assert.equal(root.isRoot(), true);
			});
			
			it('should return false if node is not root of a tree', function () {
				assert.equal(root.children[0].isRoot(), false);
				assert.equal(root.children[0].children[0].isRoot(), false);
			});
		});
		
		describe('isLeaf', function () {
			it('should return true if node has no children', function () {
				assert.equal(root.children[0].children[0].isLeaf(), true);
			});

			it('should return false if child has children', function () {
				assert.equal(root.children[1].isLeaf(). false);
				assert.equal(root.isLeaf(), false);
			});
		});
		
		describe('level', function () {
			it('returns the correct level of the node', function () {
				assert.equal(root.children[1].level(), 1);
				assert.equal(root.children[0].children[0].level(), 2);
			});
		});

		describe('index', function () {
			it('returns the index of the node within it\'s parents children array', function () {
				assert.equal(root.children[1].index(), 1);
				assert.equal(root.children[0].children[0].index(), 0);
			});
		});

		describe('addChild', function () {

			it('adds child and sets parent properly', function () {
				root.addChild(new Node('val'));
				assert.equal(root.children[2].data, 'val');
				assert(root.children[2].children instanceof Array);
				assert.equal(root.children[2].children.length, 0);
			});
			
			it('throws error if passed in arg is not of type Node', function () {
				assert.throws(function () {
					root.addChild('wrong!');
				}, TypeError, 'Passed arg must be of type Node');
				assert.throws(function () {
					root.addChild(123);
				}, TypeError, 'Passed arg must be of type Node');
				assert.throws(function () {
					root.addChild({});
				}, TypeError, 'Passed arg must be of type Node');
				assert.throws(function () {
					root.addChild(null);
				}, TypeError, 'Passed arg must be of type Node');
				assert.throws(function () {
					root.addChild(undefined);
				}, TypeError, 'Passed arg must be of type Node');
			});
		});

		describe('remove', function () {
			it('removes the node from the tree (and by association the node\'s children)', function () {
				var temp0 = root.children[0],
					temp1 = root.children[1],
				    removed;
				removed = root.children[0].remove();
				assert.equal(root.children.length, 1);
				assert.equal(root.children[0], temp1);
				assert.equal(removed, temp0);
			});
		});

		describe('traverse', function () {
			it('defaults to depth first - pre', function () {
					var i = 0;
					function transform (node) {
						node.data = i++;
					}
					root.traverse(transform);

					assert.equal(root.data, 0);
					assert.equal(root.children[0].data, 1);
					assert.equal(root.children[0].children[0].data, 2);
					assert.equal(root.children[1].data, 3);
			});

			describe('breadth first', function () {
				it('processes nodes in the correct order', function () {
					var i = 0;
					function transform (node) {
						node.data = i++;
					}
					assert.equal(root.data, 'a');
					assert.equal(root.children[0].data, 'a/1');
					assert.equal(root.children[1].data, 'a/2');
					root.traverse(transform, Forestry.TRAVERSAL_TYPES.BFS);

					assert.equal(root.data, 0);
					assert.equal(root.children[0].data, 1);
					assert.equal(root.children[1].data, 2);
					assert.equal(root.children[0].children[0].data, 3);
				});	

			});			
			
			describe('depth first - pre', function () {
				it('processes nodes in the correct order', function () {
					var i = 0;
					function transform (node) {
						node.data = i++;
					}
					assert.equal(root.data, 'a');
					assert.equal(root.children[0].data, 'a/1');
					assert.equal(root.children[1].data, 'a/2');
					root.traverse(transform, Forestry.TRAVERSAL_TYPES.DFS_PRE);

					assert.equal(root.data, 0);
					assert.equal(root.children[0].data, 1);
					assert.equal(root.children[0].children[0].data, 2);
					assert.equal(root.children[1].data, 3);
				});	
			});
			
			describe('depth first - post', function () {
				it('processes nodes in correct order', function () {
					var i = 0;
					function transform (node) {
						node.data = i++;
					}
					assert.equal(root.data, 'a');
					assert.equal(root.children[0].data, 'a/1');
					assert.equal(root.children[1].data, 'a/2');
					root.traverse(transform, Forestry.TRAVERSAL_TYPES.DFS_POST);

					assert.equal(root.data, 3);
					assert.equal(root.children[0].data, 1);
					assert.equal(root.children[0].children[0].data, 0);
					assert.equal(root.children[1].data, 2);
				});	
			});
		});
		
		describe('find', function () {
			it('returns node if found', function () {
				function func(node) {
					return node.data === 'a/1/i';
				}
				var found = root.find(func);
				assert.equal(found, root.children[0].children[0]);

				function funcII(node) {
					return node.data.split('/').length === 2;
				}
				found = root.find(funcII);
				assert.equal(found, root.children[0]);
			});

			it('returns null if no node found', function () {
				function func(node) {
					return node.data.length > 20;
				}
				var found = root.find(func);
				assert.equal(found, null);
			});
		});
		
		describe('all', function () {
			it('returns node if found', function () {
				var regex = new RegExp('a/.*');
				function func(node) {
					return node.data.match(regex);
				}
				var found = root.all(func);
				assert.equal(found.length, 3);
				assert.equal(found[0], root.children[0]);
				assert.equal(found[2], root.children[1]);
				assert.equal(found[1], root.children[0].children[0]);

				function funcII(node) {
					return node.data.split('/').length === 2;
				}
				found = root.all(funcII);
				assert.equal(found.length, 2);
				assert.equal(found[0], root.children[0]);
				assert.equal(found[1], root.children[1]);
			});

			it('returns empty array if no node found', function () {
				function func(node) {
					return node.data.length > 20;
				}
				var found = root.all(func);
				assert.equal(found.length, 0);
			});
		});
		
		describe('reduce', function () {
			it('reduces tree using passed in function', function () {
				function sum(acc, node) {
					acc += node.data.length;
					return acc;
				}
				assert.equal(root.reduce(0, sum), 12);
				assert.equal(root.children[0].reduce(10, sum), 18);
			});
		});


		describe('clone', function () {
			
			it('returns a clone of the tree', function () {
				assert.equal(root.data, 'a');
				assert.equal(root.children[0].data, 'a/1');
				assert.equal(root.children[1].data, 'a/2');
				
				var clone = root.clone();
				assert.equal(clone.data, 'a');
				assert.equal(clone.children[0].data, 'a/1');
				assert.equal(clone.children[1].data, 'a/2');

				assert.notEqual(root, clone);
				assert.notEqual(root.children[0], clone.children[0]);
				assert.notEqual(root.children[0].children[0], clone.children[0].children[0]);
				assert.notEqual(root.children[1], clone.children[1]);
			});	
		});
	});
});