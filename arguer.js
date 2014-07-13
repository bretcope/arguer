"use strict";

module.exports = arguer;

/**
 * 
 * @this {Array} A format array.
 * @returns {{}|Error} A hash table with the names of each format elements as keys. Optional format elements which were not fulfilled by an argument are undefined. If the arguments failed to parse correctly, the returned object will be an Error object.
 */
function arguer ()
{
	// backwards compatibility shim
	if (!this)
		return arguer.apply(arguments[1], arguments[0]);
	
	var format = this;
	var deficit = format.length - arguments.length;

	if (format._optional === undefined)
	{
		format._optional = 0;
		var f;
		for (var x = 0; x < format.length; x++)
		{
			f = format[x];
			if (f && typeof f === 'object' && (f.optional || f.mutex || f.requires || f.requiredBy || ('default' in f)))
			{
				f.optional = true;
				format._optional++;
				
				if (f.mutex && !(f.mutex instanceof Array))
					f.mutex = [ f.mutex ];
				
				if (f.requires && !(f.requires instanceof Array))
					f.requires = [ f.requires ];
				
				if (f.requiredBy && !(f.requiredBy instanceof Array))
					f.requiredBy = [ f.requiredBy ];
			}
		}
	}

	var result = {};

	if (deficit > format._optional)
	{ 
		return new Error('Not enough arguments provided.');
	}

	var optionalIncluded = 0;
	var optionalSkipped = 0;
	var item;
	var argDex = 0;
	
	function isDefined (prop) { return result[prop] !== undefined; }
	function isUndefined (prop) { return result[prop] === undefined; }
	
	for (var i = 0; i < format.length; i++)
	{
		item = format[i];

		if (typeof item === 'string')
		{
			result[item] = arguments[argDex];
			argDex++;
		}
		else
		{
			// failure conditions
			if ((item.type && typeof arguments[argDex] !== item.type) ||
				(item.nType && typeof arguments[argDex] === item.nType) ||
				(item.instance && !(arguments[argDex] instanceof item.instance)) ||
				(item.nInstance && arguments[argDex] instanceof item.nInstance) ||
				(item.mutex && item.mutex.some(isDefined)) ||
				(item.requires && item.requires.some(isUndefined)))
			{
				if (item.optional && optionalSkipped < deficit &&
					(!item.requiredBy || item.requiredBy.every(isUndefined)))
				{
					result[item.name] = item.default;
					optionalSkipped++;
				}
				else
				{
					return new Error('Invalid Arguments');
				}
			}
			else
			{
				if (item.optional)
				{
					if ((format._optional - optionalIncluded) > deficit)
					{
						optionalIncluded++
					}
					else
					{
						optionalSkipped++;
						result[item.name] = item.default;
						continue;
					}
				}

				result[item.name] = arguments[argDex];
				argDex++;
			}
		}
	}

	return result;
};

arguer.thrower = function ()
{
	var a;
	if (this)
		a = arguer.apply(this, arguments);
	else
		a = arguer.apply(arguments[1], arguments[0]); // backwards compatibility shim
	
	if (a instanceof Error)
		throw a;

	return a;
};

// vim: noet sw=4 ts=4
