!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Forestry=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var traversal = _dereq_('./traversal'),
	Node = _dereq_('./Node'),
	parse = _dereq_('./parse');

module.exports = {
	TRAVERSAL_TYPES: traversal.TYPES,
	Node: Node,
	parse: parse
};

},{"./Node":2,"./parse":3,"./traversal":4}],2:[function(_dereq_,module,exports){
'use strict';

var traversal = _dereq_('./traversal'),
	traversalTypesArr = Object.keys(traversal.processes);

function Node(data) {
	this.children = [];
	this.parent = null;
	this.data = data;
}

Node.prototype.isRoot = function () {
	return !this.parent;
};

Node.prototype.isLeaf = function () {
	return this.children.length === 0;
};

Node.prototype.index = function () {
	for (var i = this.parent.children.length; --i >= 0;) {
		if (this === this.parent.children[i]) {
			return i;
		}
	}
	return null; 
};

Node.prototype.level = function () {
	var level = -1;
	this.climb(function () {
		++level;
	});
	return level;
};

Node.prototype.addChild = function (node) {
	if (!(node instanceof Node)) {
		throw new TypeError('Passed arg must be of type Node');
	}
	node.parent = this;
	this.children.push(node);
	return this;
};

Node.prototype.remove = function () {
	if (!this.isRoot()) {
		var children = this.parent.children;
		this.parent.children = [];
		for(var i = -1, len = children.length; ++i < len;) {
			if (children[i] !== this) {
				this.parent.children[this.parent.children.length] = children[i];
			}
		}
		this.parent = null;
	}
    return this;
};

Node.prototype.getRoot = function () {
	var node = this;
	while (node.parent) {
		node = node.parent;
	}
	return node;
};

Node.prototype.climb = function (op) {
	var node = this;
	do {
		op(node);
	} while ((node = node.parent));
};

Node.prototype.traverse = function (op, traversalType) {
	traversalType = traversalType ? traversalType : traversal.TYPES.DFS_PRE;
	if (traversalTypesArr.indexOf(traversalType) < 0) {
		throw new Error('Traversal type is not valid. It must be one of ' + traversalTypesArr.join(', ') + '.');
	}
	traversal.processes[traversalType](this, op);	
	return this;
};

Node.prototype.find = function (term, BFS) {	
	var found = null;
	this.traverse(function (node) {
		if (term(node)) {
			found = node;
			return null;
		}
	}, BFS);
	return found;
};

Node.prototype.all = function (term, BFS) {
	var found = [],
	idx = 0;
	this.traverse(function (node) {
		if (term(node)) {
			found[idx++] = node;
		}
	}, BFS);
	return found;
};

Node.prototype.reduce = function (acc, func, BFS) {
	this.traverse(function (node) {
		acc = func(acc, node);
	}, BFS);
	return acc;
};

function cloneData(data, cloneFunc) {
	if (typeof data.clone === 'function') {
		return data.clone();
	}
	if (cloneFunc) {
		return cloneFunc(data);
	}
	return data;
}

Node.prototype.clone = function (dataCloneFunc) {
	var rootNode = new Node(cloneData(this.data, dataCloneFunc)),
		arr = [[rootNode, this]],
		len = 1,
		newNode,
		childArr,
		p;
		
	while (len > 0) {
		p = arr[--len];
		childArr = p[1].children;
		for (var i = 0, l = childArr.length; i < l; i++) {
			newNode = new Node(cloneData(childArr[i].data, dataCloneFunc));
			p[0].addChild(newNode);
			arr[len++] = [newNode, childArr[i]];
		}
	}
	return rootNode;
};

module.exports = Node;


},{"./traversal":4}],3:[function(_dereq_,module,exports){
'use strict';

var Node = _dereq_('./Node');

function createNode(obj, childrenProp, valueProp) {
	if (valueProp) {
		return new Node(obj[valueProp]);
	}
	var data = {},
		objKeys = Object.keys(obj);
	for (var i = 0, len = objKeys.length; i < len; i++) {
		if (objKeys[i] !== childrenProp) {
			data[objKeys[i]] = obj[objKeys[i]];
		}
	}
	return new Node(data); 
}

function asArray(children) {
	if (children) {
		if (children.constructor === Array) {
			return children;
		}
		if (typeof children === 'object') {
			var childrenArr = [],
				keys = Object.keys(children);
			for(var i = 0, l = keys.length; i < l; i++) {
				if (children.hasOwnProperty(keys[i])) {
					if (typeof children[keys[i]] !== 'object' || children[keys[i]].constructor === Array) {
						throw new TypeError('Each child must be of type \'object\'');
					}
					childrenArr[i] = children[keys[i]];
					childrenArr[i]._key = keys[i];
				}
			}
			return childrenArr;
		}
		throw new TypeError('\'Children\' property can only be either an Object or Array');
	}
	return [];
}

function parse(obj, childrenProp, dataProp) {

	if (typeof obj !== 'object' || obj.constructor === Array) {
		throw new TypeError('Passed arg must be an object');
	}
	var rootNode = createNode(obj, childrenProp, dataProp),
		arr = [[rootNode, obj]],
		len = 1,
		newNode,
		childArr,
		p;
		
	childrenProp = childrenProp || 'children';

	while (len > 0) {
		p = arr[--len];
		childArr = asArray(p[1][childrenProp]);
		for (var i = 0, l = childArr.length; i < l; i++) {
			newNode = createNode(childArr[i], childrenProp, dataProp);
			p[0].addChild(newNode);
			arr[len++] = [newNode, childArr[i]];
		}
	}
	return rootNode;
}

module.exports = parse;

},{"./Node":2}],4:[function(_dereq_,module,exports){
'use strict';

function breadthFirstOp(node, op) {
	var arr = [node],
	idx = 0,
	i,
		l,
		len = 0;
	while (idx <= len) {	
		node = arr[idx++];
		if (op(node) === null) {
			break;
		}
		for (i = -1, l = node.children.length; ++i < l;) {
			arr[++len] = node.children[i];
		}
	}
}

function depthFirstOpPre(node, op) {
	var arr = [node],
	i,
	idx = 0;
	while(idx >= 0) {
		node = arr[idx--];
		if (op(node) === null) {
			break;	
		}
		for (i = node.children.length; --i >= 0;) {
			arr[++idx] = node.children[i];
		}
	}
}

function depthFirstOpPost(node, op) {
	var arr = [node],
	i,
	idx = 0;
	while (idx >= 0) {
		node = arr[idx];
		if ((arr[idx + 1] && arr[idx + 1].parent === node) || node.isLeaf()) {
			--idx;
			if (op(node) === null) {
				break;
			}
			continue;
		}
		for (i = node.children.length; --i >= 0;) {
			arr[++idx] = node.children[i];
		}
	}
}

var TYPES = {
		BFS: 'BFS',
		DFS_PRE: 'DFS_PRE',
		DFS_POST: 'DFS_POST'
	},
	processes = {};

processes[TYPES.BFS] = breadthFirstOp;
processes[TYPES.DFS_PRE] = depthFirstOpPre;
processes[TYPES.DFS_POST] = depthFirstOpPost;

module.exports = {
	TYPES: TYPES,
	processes: processes
};

},{}]},{},[1])(1)
});
