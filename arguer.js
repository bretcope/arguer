/**
 * 
 * @param args {arguments}
 * @param format {Array}
 * @returns {{}|Error} A hash table with the names of each format elements as keys. Optional format elements which were not fulfilled by an argument are undefined. If the arguments failed to parse correctly, the returned object will be an Error object.
 */
var arguer = module.exports = function (args, format)
{
	var deficit = format.length - args.length;

	if (format._optional === undefined)
	{
		format._optional = 0;
		var f;
		for (var x in format)
		{
			var f = format[x];
			if (f && typeof f === 'object' && (f.optional || f.mutex || f.requires || f.requiredBy || ('default' in f)))
			{
				f.optional = true;
				format._optional++;

				f.mutex = f.mutex ? (f.mutex instanceof Array ? f.mutex : [f.mutex]) : [];
				f.requires = f.requires ? (f.requires instanceof Array ? f.requires : [f.requires]) : [];
				f.requiredBy = f.requiredBy ? (f.requiredBy instanceof Array ? f.requiredBy : [f.requiredBy]) : [];
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
	var argDex = 0, mutex, requires, requiredBy;
	for (var i = 0; i < format.length; i++)
	{
		item = format[i];

		if (typeof item === 'string')
		{
			result[item] = args[argDex];
			argDex++;
		}
		else
		{
			// failure conditions
			if (
				(item.type && typeof args[argDex] !== item.type) ||
				(item.nType && typeof args[argDex] === item.nType) ||
				(item.instance && !(args[argDex] instanceof item.instance)) ||
				(item.nInstance && args[argDex] instanceof item.nInstance) ||
				(item.mutex && item.mutex.some(function (prop) { return result[prop] !== undefined; })) ||
				(item.requires && item.requires.some(function (prop) { return result[prop] === undefined; }))
			)
			{
				if (
					item.optional && optionalSkipped < deficit && 
					(item.requiredBy && item.requiredBy.every(function (prop) { return result[prop] === undefined; }))
				)
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

				result[item.name] = args[argDex];
				argDex++;
			}
		}
	}

	return result;
};

arguer.thrower = function (args, format)
{
	var a = arguer(args, format);
	if (a instanceof Error)
		throw a;

	return a;
};

// vim: noet sw=4 ts=4
