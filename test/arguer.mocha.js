'use strict';

var arguer = require('../');
var assert = require('assert');
var util = require('util');

function tester(format)
{
	return function ()
	{
		var args = arguer.apply(format, arguments);
		if (args instanceof Error)
		{
			args.message += ': ' + util.inspect([].slice.call(arguments, 0));
			throw args;
		}
		return args;
	};
}


suite('arguer', function ()
{
	test('basic', function ()
	{
		var _testFormat = ['a', {name: 'b', optional: true}, 'c'];
		var test = tester(_testFormat);
		test('hello', 'world');
		assert.throws(function () { test('hello'); });
	}); 

	test('requires', function ()
	{
		var _testFormat = [
			{
				name: 'a',
				type: 'string',
			},
			{
				name: 'b',
				type: 'number',
				requires: 'a'
			},
		];

		var test = tester(_testFormat);

		test('foo');
		test('foo', 1);
		assert.throws(function () { test(1); });
		assert.throws(function () { test('foo', 'bar'); });
	});

	test('requiredBy', function ()
	{
		var _testFormat = [
			{
				name: 'a',
				type: 'string'
			},
			{
				name: 'b',
				type: 'number',
				requiredBy: 'a'
			}
		];

		var test = tester(_testFormat);

		test('foo', 1);
		assert.throws(function () { test('foo'); });
	});

	test('mutex', function ()
	{
		var _testFormat = [
			'a',
			{
				name: 'b',
				optional: true,
				type: 'number'
			},
			{
				name: 'c',
				mutex: 'b',
				type: 'string'
			}
		];

		var test = tester(_testFormat);
		test('foo');
		test('foo', 1);
		test('foo', 'bar');
		assert.throws(function () { test('foo', 'bar', 1); });
	});

	test('multi-requires', function ()
	{
		var _testFormat = [
			{
				name: 'a',
				type: 'string'
			},
			{
				name: 'b',
				type: 'number'
			},
			{
				name: 'c',
				instance: Array,
				requires: ['a','b']
			}
		];

		var test = tester(_testFormat);

		test('a', 1);
		test('a', 1, []);

		assert.throws(function () { test([]); });
		assert.throws(function () { test('foo', []); });
		assert.throws(function () { test(1, []); });
	});

	test('multi-requiredBy', function ()
	{
		var _testFormat = [
			{
				name: 'a',
				type: 'string',
				optional: true
			},
			{
				name: 'b',
				type: 'number',
				mutex: 'a'
			},
			{
				name: 'c',
				instance: Array,
				requiredBy: ['a','b']
			}
		];

		var test = tester(_testFormat);

		test('foo', []);
		test(1, []);

		assert.throws(function () { test('foo'); });
		assert.throws(function () { test(1); });
	});

	test('multi-mutex', function ()
	{
		var _testFormat = [
			{
				name: 'a',
				type: 'string',
				mutex: ['b','c']
			},
			{
				name: 'b',
				type: 'number',
				mutex: ['a','c']
			},
			{
				name: 'c',
				instance: Array,
				mutex: ['a','b']
			}
		];

		var test = tester(_testFormat);

		test('foo');
		test(1);
		test([]);
		assert.throws(function () { test('foo', 1); });
		assert.throws(function () { test('foo', []); });
		assert.throws(function () { test(1, []); });
		assert.throws(function () { test('foo', 1, []); });
	}); 
});

// vim: ts=4 sw=4 noet
