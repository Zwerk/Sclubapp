cordova.define("cordova-plugin-ms-azure-mobile-apps.AzureMobileServices", function(require, exports, module) {
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved
// azure-mobile-apps-client - v2.0.1
// ----------------------------------------------------------------------------

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WindowsAzure = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (Buffer,process){
// Copyright (c) 2012, Mark Cavage. All rights reserved.
// Copyright 2015 Joyent, Inc.

var assert = _dereq_('assert');
var Stream = _dereq_('stream').Stream;
var util = _dereq_('util');


///--- Globals

/* JSSTYLED */
var UUID_REGEXP = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;


///--- Internal

function _capitalize(str) {
    return (str.charAt(0).toUpperCase() + str.slice(1));
}

function _toss(name, expected, oper, arg, actual) {
    throw new assert.AssertionError({
        message: util.format('%s (%s) is required', name, expected),
        actual: (actual === undefined) ? typeof (arg) : actual(arg),
        expected: expected,
        operator: oper || '===',
        stackStartFunction: _toss.caller
    });
}

function _getClass(arg) {
    return (Object.prototype.toString.call(arg).slice(8, -1));
}

function noop() {
    // Why even bother with asserts?
}


///--- Exports

var types = {
    bool: {
        check: function (arg) { return typeof (arg) === 'boolean'; }
    },
    func: {
        check: function (arg) { return typeof (arg) === 'function'; }
    },
    string: {
        check: function (arg) { return typeof (arg) === 'string'; }
    },
    object: {
        check: function (arg) {
            return typeof (arg) === 'object' && arg !== null;
        }
    },
    number: {
        check: function (arg) {
            return typeof (arg) === 'number' && !isNaN(arg);
        }
    },
    finite: {
        check: function (arg) {
            return typeof (arg) === 'number' && !isNaN(arg) && isFinite(arg);
        }
    },
    buffer: {
        check: function (arg) { return Buffer.isBuffer(arg); },
        operator: 'Buffer.isBuffer'
    },
    array: {
        check: function (arg) { return Array.isArray(arg); },
        operator: 'Array.isArray'
    },
    stream: {
        check: function (arg) { return arg instanceof Stream; },
        operator: 'instanceof',
        actual: _getClass
    },
    date: {
        check: function (arg) { return arg instanceof Date; },
        operator: 'instanceof',
        actual: _getClass
    },
    regexp: {
        check: function (arg) { return arg instanceof RegExp; },
        operator: 'instanceof',
        actual: _getClass
    },
    uuid: {
        check: function (arg) {
            return typeof (arg) === 'string' && UUID_REGEXP.test(arg);
        },
        operator: 'isUUID'
    }
};

function _setExports(ndebug) {
    var keys = Object.keys(types);
    var out;

    /* re-export standard assert */
    if (process.env.NODE_NDEBUG) {
        out = noop;
    } else {
        out = function (arg, msg) {
            if (!arg) {
                _toss(msg, 'true', arg);
            }
        };
    }

    /* standard checks */
    keys.forEach(function (k) {
        if (ndebug) {
            out[k] = noop;
            return;
        }
        var type = types[k];
        out[k] = function (arg, msg) {
            if (!type.check(arg)) {
                _toss(msg, k, type.operator, arg, type.actual);
            }
        };
    });

    /* optional checks */
    keys.forEach(function (k) {
        var name = 'optional' + _capitalize(k);
        if (ndebug) {
            out[name] = noop;
            return;
        }
        var type = types[k];
        out[name] = function (arg, msg) {
            if (arg === undefined || arg === null) {
                return;
            }
            if (!type.check(arg)) {
                _toss(msg, k, type.operator, arg, type.actual);
            }
        };
    });

    /* arrayOf checks */
    keys.forEach(function (k) {
        var name = 'arrayOf' + _capitalize(k);
        if (ndebug) {
            out[name] = noop;
            return;
        }
        var type = types[k];
        var expected = '[' + k + ']';
        out[name] = function (arg, msg) {
            if (!Array.isArray(arg)) {
                _toss(msg, expected, type.operator, arg, type.actual);
            }
            var i;
            for (i = 0; i < arg.length; i++) {
                if (!type.check(arg[i])) {
                    _toss(msg, expected, type.operator, arg, type.actual);
                }
            }
        };
    });

    /* optionalArrayOf checks */
    keys.forEach(function (k) {
        var name = 'optionalArrayOf' + _capitalize(k);
        if (ndebug) {
            out[name] = noop;
            return;
        }
        var type = types[k];
        var expected = '[' + k + ']';
        out[name] = function (arg, msg) {
            if (arg === undefined || arg === null) {
                return;
            }
            if (!Array.isArray(arg)) {
                _toss(msg, expected, type.operator, arg, type.actual);
            }
            var i;
            for (i = 0; i < arg.length; i++) {
                if (!type.check(arg[i])) {
                    _toss(msg, expected, type.operator, arg, type.actual);
                }
            }
        };
    });

    /* re-export built-in assertions */
    Object.keys(assert).forEach(function (k) {
        if (k === 'AssertionError') {
            out[k] = assert[k];
            return;
        }
        if (ndebug) {
            out[k] = noop;
            return;
        }
        out[k] = assert[k];
    });

    /* export ourselves (for unit tests _only_) */
    out._setExports = _setExports;

    return out;
}

module.exports = _setExports(process.env.NODE_NDEBUG);

}).call(this,{"isBuffer":_dereq_("../is-buffer/index.js")},_dereq_('_process'))
},{"../is-buffer/index.js":32,"_process":34,"assert":2,"stream":51,"util":55}],2:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":55}],3:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types'),
    expressions = _dereq_('./expressions');

module.exports = types.defineClass(null, {
    visit: function (expr) {
        return expr.accept(this);
    },

    visitConstant: function (expr) {
        return expr;
    },

    visitFloatConstant: function (expr) {
        return expr;
    },

    visitBinary: function (expr) {
        var left = null;
        var right = null;

        if (expr.left !== null) {
            left = this.visit(expr.left);
        }
        if (expr.right !== null) {
            right = this.visit(expr.right);
        }
        if (left != expr.left || right != expr.right) {
            return new expressions.Binary(left, right, expr.expressionType);
        }

        return expr;
    },

    visitUnary: function (expr) {
        var operand = this.visit(expr.operand);
        if (operand != expr.operand) {
            return new expressions.Unary(operand, expr.expressionType);
        }
        return expr;
    },

    visitMember: function (expr) {
        return expr;
    },

    visitParameter: function (expr) {
        return expr;
    },

    visitFunction: function (expr) {
        var updated = false;

        var instance = expr.instance;
        if (expr.instance) {
            instance = this.visit(expr.instance);
            if (instance != expr.instance) {
                updated = true;
            }
        }

        var args = [expr.args.length],
            i = 0,
            self = this;
        expr.args.forEach(function (arg) {
            var newArg = self.visit(arg);
            args[i++] = arg;
            if (newArg != arg) {
                updated = true;
            }
        });

        if (updated) {
            return new expressions.FunctionCall(instance, expr.memberInfo, args);
        }
        return expr;
    }
});

},{"./expressions":6,"./utilities/types":12}],4:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types'),
    ExpressionVisitor = _dereq_('./ExpressionVisitor'),
    expressions = _dereq_('./expressions');

var SqlBooleanizer = types.deriveClass(ExpressionVisitor, null, {
    visitUnary: function (expr) {
        var operand = this.visit(expr.operand);

        if (operand && expr.expressionType == 'Not') {
            // Convert expression 'x' to a boolean expression '(x = true)' since
            // the SQL Not operator requires a boolean expression (not a BIT)
            return new expressions.Unary(ensureExpressionIsBoolean(operand), 'Not');
        }

        if (operand != expr.operand) {
            return new expressions.Unary(operand, expr.expressionType);
        }

        return expr;
    },

    visitBinary: function (expr) {
        var left = null;
        var right = null;

        // first visit the expressions to do any sub conversions, before
        // doing any transformations below
        if (expr.left !== null) {
            left = this.visit(expr.left);
        }
        if (expr.right !== null) {
            right = this.visit(expr.right);
        }

        if ((expr.expressionType == 'And') || (expr.expressionType == 'Or')) {
            // both operands must be boolean expressions
            left = ensureExpressionIsBoolean(left);
            right = ensureExpressionIsBoolean(right);
        }
        else if ((expr.expressionType == 'Equal') || (expr.expressionType == 'NotEqual')) {
            // remove any comparisons between boolean and bit
            var converted = rewriteBitComparison(left, right);
            if (converted) {
                return converted;
            }
        }

        if (left != expr.left || right != expr.right) {
            return new expressions.Binary(left, right, expr.expressionType);
        }

        return expr;
    }
});

// if a boolean expression is being compared to a bit expression, convert
// by removing the comparison. E.g. (endswith('value', title) eq false) => not(endswith('value', title))
function rewriteBitComparison(left, right) {
    if (isBooleanExpression(left) && isBitConstant(right)) {
        return (right.value === true) ? left : new expressions.Unary(left, 'Not');
    }
    else if (isBooleanExpression(right) && isBitConstant(left)) {
        return (left.value === true) ? right : new expressions.Unary(right, 'Not');
    }

    // no conversion necessary
    return null;
}

// returns true if the expression is the constant 'true' or 'false'
function isBitConstant(expr) {
    return (expr.expressionType == 'Constant') && (expr.value === true || expr.value === false);
}

// if the expression isn't boolean, convert to a boolean expression (e.g. (isDiscontinued) => (isDiscontinued = 1))
function ensureExpressionIsBoolean(expr) {
    if (!isBooleanExpression(expr)) {
        return new expressions.Binary(expr, new expressions.Constant(true), 'Equal');
    }
    return expr;
}

function isBooleanExpression(expr) {
    if (!expr) {
        return false;
    }

    // see if this is a logical boolean expression
    switch (expr.expressionType) {
        case 'And':
        case 'Or':
        case 'GreaterThan':
        case 'GreaterThanOrEqual':
        case 'LessThan':
        case 'LessThanOrEqual':
        case 'Not':
        case 'Equal':
        case 'NotEqual':
            return true;
        default:
            break;
    }

    // boolean odata functions
    if (expr.expressionType == 'Call') {
        switch (expr.memberInfo.memberName) {
            case 'startswith':
            case 'endswith':
            case 'substringof':
                return true;
            default:
                break;
        }
    }

    return false;
}

module.exports = function (expr) {
    var booleanizer = new SqlBooleanizer();

    expr = booleanizer.visit(expr);
    expr = ensureExpressionIsBoolean(expr);

    return expr;
};

},{"./ExpressionVisitor":3,"./expressions":6,"./utilities/types":12}],5:[function(_dereq_,module,exports){
(function (Buffer){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types'),
    expressions = _dereq_('./expressions'),
    ExpressionVisitor = _dereq_('./ExpressionVisitor');

function ctor(tableMetadata) {
    this.tableMetadata = tableMetadata;
}

var TypeConverter = types.deriveClass(ExpressionVisitor, ctor, {
    visitBinary: function (expr) {
        var left = expr.left ? this.visit(expr.left) : null;
        var right = expr.right ? this.visit(expr.right) : null;

        if (this._isStringConstant(left) && this._isBinaryMemberAccess(right)) {
            left.value = new Buffer(left.value, 'base64');
        }
        else if (this._isStringConstant(right) && this._isBinaryMemberAccess(left)) {
            right.value = new Buffer(right.value, 'base64');
        }

        if (left != expr.left || right != expr.right) {
            return new expressions.Binary(left, right, expr.expressionType);
        }

        return expr;
    },

    _isStringConstant: function(expr) {
        return expr &&
               expr.expressionType === 'Constant' &&
               types.isString(expr.value);
    },

    _isBinaryMemberAccess: function (expr) {
        return expr &&
               expr.expressionType === 'MemberAccess' &&
               types.isString(expr.member) && // tableConfig.binaryColumns is not currently used - hard coded __version column
               ((this.tableMetadata.binaryColumns && this.tableMetadata.binaryColumns.indexOf(expr.member.toLowerCase()) > -1) || expr.member.toLowerCase() === 'version');
    }
});

module.exports = function (expr, tableMetadata) {
    return new TypeConverter(tableMetadata).visit(expr);
};

}).call(this,_dereq_("buffer").Buffer)
},{"./ExpressionVisitor":3,"./expressions":6,"./utilities/types":12,"buffer":24}],6:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types');

var Expression = types.defineClass(
    null, {
        accept: function (visitor) {
            return visitor.visit(this);
        }
    },
    null);

module.exports = {
    MappedMemberInfo: types.defineClass(
        function (type, memberName, isStatic, isMethod) {
            this.type = type;
            this.memberName = memberName;
            this.isStatic = isStatic;
            this.isMethod = isMethod;
        }, null, null),

    Constant: types.deriveClass(
        Expression,
        function (value) {
            this.value = value;
            this.expressionType = 'Constant';
        }, {
            accept: function (visitor) {
                return visitor.visitConstant(this);
            }
        },
        null),

    FloatConstant: types.deriveClass(
        Expression,
        function (value) {
            this.value = value;
            this.expressionType = 'FloatConstant';
        }, {
            accept: function (visitor) {
                return visitor.visitFloatConstant(this);
            }
        },
        null),

    Binary: types.deriveClass(
        Expression,
        function (left, right, expressionType) {
            this.left = left;
            this.right = right;
            this.expressionType = expressionType;
        }, {
            accept: function (visitor) {
                return visitor.visitBinary(this);
            }
        },
        null),

    Unary: types.deriveClass(
        Expression,
        function (operand, expressionType) {
            this.operand = operand;
            this.expressionType = expressionType;
        }, {
            accept: function (visitor) {
                return visitor.visitUnary(this);
            }
        },
        null),

    Member: types.deriveClass(
        Expression,
        // member may be either a member name or a MappedMemberInfo
        function (instance, member) {
            this.instance = instance;
            this.member = member;
            this.expressionType = 'MemberAccess';
        }, {
            accept: function (visitor) {
                return visitor.visitMember(this);
            }
        },
        null),

    FunctionCall: types.deriveClass(
        Expression,
        function (instance, memberInfo, args) {
            this.instance = instance;
            this.memberInfo = memberInfo;
            this.args = args;
            this.expressionType = 'Call';
        }, {
            accept: function (visitor) {
                return visitor.visitFunction(this);
            }
        },
        null),

    Parameter: types.defineClass(
        function () {
            this.ExpressionType = 'Parameter';
        }, {
            accept: function (visitor) {
                return visitor.visitParameter(this);
            }
        },
        null),

    Convert: types.deriveClass(
        Expression,
        function (desiredType, operand) {
            this.desiredType = desiredType;
            this.operand = operand;
            this.expressionType = 'Convert';
        }, {
            accept: function (visitor) {
                return visitor.visitUnary(this);
            }
        },
        null)
};

},{"./utilities/types":12}],7:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types'),
    util = _dereq_('util'),
    parseOData = _dereq_('./parseOData'),
    ExpressionVisitor = _dereq_('./ExpressionVisitor'),
    convertTypes = _dereq_('./convertTypes'),
    booleanize = _dereq_('./booleanize'),
    helpers = _dereq_('./helpers'),
    expressions = _dereq_('./expressions');

function ctor(tableConfig) {
    this.tableConfig = tableConfig || {};
    this.flavor = this.tableConfig.flavor || 'mssql';
    this.statement = { sql: '', parameters: [], multiple: true };
    this.paramNumber = 0;
    this.parameterPrefix = 'p';

    if (this.flavor !== 'sqlite') {
        this.schemaName = this.tableConfig.schema || 'dbo';
    }
}

var SqlFormatter = types.deriveClass(ExpressionVisitor, ctor, {
    format: function (query) {
        // if a skip is requested but no top is defined, we need
        // to still generate the paging query, so default top to
        // max. Really when doing paging, the user should also be
        // specifying a top explicitly however.
        if (query.skip > 0 && (query.take === undefined || query.take === null)) {
            if (this.flavor !== 'sqlite') {
                query.take = 9007199254740992; // Number.MAX_SAFE_INTEGER + 1; // ES6
            } else {
                // A negative LIMIT in sqlite returns all rows.
                query.take = -1;
            }
        }

        var statements = [];

        this.statement.sql = this._formatQuery(query).trim();
        statements.push(this.statement);

        if (query.inlineCount === 'allpages' || query.includeTotalCount) {
            this.statement = { sql: '', parameters: [], multiple: true };
            this.statement.sql = this._formatCountQuery(helpers.formatTableName(this.schemaName, query.table), query).trim();
            statements.push(this.statement);
        }

        return statements;
    },

    _formatQuery: function (query) {

        if (this.flavor !== 'sqlite' && query.skip >= 0 && query.take >= 0 && query.skip !== null && query.take !== null) {
            return this._formatPagedQuery(query);
        }

        var takeClause = '',
            skipClause = '',
            whereClause = '',
            orderbyClause = '',
            limit = -1,
            formattedSql,
            selection = query.selections ? this._formatSelection(query.selections) : '*';

        // set the top clause to be the minimumn of the top
        // and result limit values if either has been set.
        var resultLimit = query.resultLimit || Number.MAX_VALUE;
        if (query.take >= 0 && query.take !== null) {
            limit = Math.min(resultLimit, query.take);
        } else if (resultLimit != Number.MAX_VALUE) {
            limit = query.resultLimit;
        }

        if (this.flavor !== 'sqlite') {
            if (limit != -1) {
                takeClause = 'TOP ' + limit.toString() + ' ';
            }
        } else {
            if (query.skip > 0) {
                skipClause = ' OFFSET ' + query.skip.toString();
            }

            // Specifiy a take clause if either skip or limit is specified.
            // Note: SQLite needs LIMIT for OFFSET to work.
            if (query.skip > 0 || limit >= 0) {
                takeClause = ' LIMIT ' + limit.toString();
            }
        }

        var filter = this._formatFilter(query);
        if (filter.length > 0) {
            whereClause = ' WHERE ' + filter;
        }

        var ordering = this._formatOrderBy(query);
        if (ordering.length > 0) {
            orderbyClause = ' ORDER BY ' + ordering;
        }

        var tableName = helpers.formatTableName(this.schemaName, query.table);

        if (this.flavor !== 'sqlite') {
            formattedSql = util.format("SELECT %s%s FROM %s%s%s", takeClause, selection, tableName, whereClause, orderbyClause);
        } else {
            formattedSql = util.format("SELECT %s FROM %s%s%s%s%s", selection, tableName, whereClause, orderbyClause, takeClause, skipClause);
        }

        return formattedSql;
    },

    _formatPagedQuery: function (query) {
        var formattedSql, selection = '';

        if (query.selections) {
            selection = this._formatSelection(query.selections);
        } else {
            selection = "*";
        }

        var filter = this._formatFilter(query, '(1 = 1)');
        var ordering = this._formatOrderBy(query, '[id]');

        // Plug all the pieces into the template to get the paging sql
        var tableName = helpers.formatTableName(this.schemaName, query.table);
        formattedSql = util.format(
            "SELECT %s " +
            "FROM %s " +
            "WHERE %s " +
            "ORDER BY %s " +
            "OFFSET %d ROWS FETCH NEXT %d ROWS ONLY",
            selection, tableName, filter, ordering, query.skip,  query.take);

        return formattedSql;
    },

    _formatCountQuery: function (table, query) {
        var filter;

        if (query.filters || query.id !== undefined || this.tableConfig.supportsSoftDelete) {
            this.statement.sql = '';
            filter = this._formatFilter(query);
        }

        var sql = 'SELECT COUNT(*) AS [count] FROM ' + table;
        if (filter) {
            sql += ' WHERE ' + filter;
        }
        return sql;
    },

    _formatOrderBy: function (query, defaultOrder) {
        if (!query.ordering) {
            return defaultOrder || '';
        }

        var orderings = parseOData.orderBy(query.ordering),
            order = '',
            self = this;

        orderings.forEach(function (ordering) {
            if (order.length > 0) {
                order += ', ';
            }
            self.statement.sql = '';
            self.visit(ordering.selector);
            if (!ordering.ascending) {
                self.statement.sql += ' DESC';
            }
            order += self.statement.sql;
        });

        return order;
    },

    _formatSelection: function (selection, prefix) {
        var formattedSelection = '',
            columns = selection.split(',');

        columns.forEach(function (column) {
            var member = column.trim();
            if (formattedSelection.length > 0) {
                formattedSelection += ', ';
            }
            formattedSelection += (prefix || '') + helpers.formatMember(member);
        });

        return formattedSelection;
    },

    _formatFilter: function (query, defaultFilter) {
        // if we already have a parsed filter use it,
        // otherwise parse the filter
        var filterExpr;
        if (query.filters && query.filters.length > 0) {
            filterExpr = parseOData(query.filters);
        }

        if (query.id !== undefined) {
            var id = this.tableConfig.hasStringId ? "'" + query.id.replace(/'/g, "''") + "'" : query.id;
            var idFilterExpr = parseOData(util.format('(id eq %s)', id));

            // append the id filter to any existing filter
            if (filterExpr) {
                filterExpr = new expressions.Binary(filterExpr, idFilterExpr, 'And');
            }
            else {
                filterExpr = idFilterExpr;
            }
        }

        // if soft delete is enabled filter out deleted records
        if (this.tableConfig.softDelete && !query.includeDeleted) {
            var deletedFilter = parseOData(util.format('(deleted eq false)'));
            if (filterExpr) {
                filterExpr = new expressions.Binary(filterExpr, deletedFilter, 'And');
            }
            else {
                filterExpr = deletedFilter;
            }
        }

        if (!filterExpr) {
            return defaultFilter || '';
        }

        this.statement.sql = '';
        filterExpr = this._finalizeExpression(filterExpr);
        this.visit(filterExpr);

        return this.statement.sql;
    },

    // run the final query translation pipeline on the specified
    // expression, modifying the expression tree as needed
    _finalizeExpression: function (expr) {
        expr = booleanize(expr);
        expr = convertTypes(expr, this.tableConfig);
        return expr;
    },

    visitBinary: function (expr) {
        this.statement.sql += '(';

        var left = null;
        var right = null;

        // modulo requires the dividend to be an integer, monetary or numeric
        // rewrite the expression to convert to numeric, allowing the DB to apply
        // rounding if needed. our default data type for number is float which
        // is incompatible with modulo.
        if (expr.expressionType == 'Modulo') {
            expr.left = new expressions.Convert('numeric', expr.left);
        }

        if (expr.left) {
            left = this.visit(expr.left);
        }

        if (expr.right && (expr.right.value === null)) {
            // inequality expressions against a null literal have a special
            // translation in SQL
            if (expr.expressionType == 'Equal') {
                this.statement.sql += ' IS NULL';
            }
            else if (expr.expressionType == 'NotEqual') {
                this.statement.sql += ' IS NOT NULL';
            }
        }
        else {
            switch (expr.expressionType) {
                case 'Equal':
                    this.statement.sql += ' = ';
                    break;
                case 'NotEqual':
                    this.statement.sql += ' != ';
                    break;
                case 'LessThan':
                    this.statement.sql += ' < ';
                    break;
                case 'LessThanOrEqual':
                    this.statement.sql += ' <= ';
                    break;
                case 'GreaterThan':
                    this.statement.sql += ' > ';
                    break;
                case 'GreaterThanOrEqual':
                    this.statement.sql += ' >= ';
                    break;
                case 'And':
                    this.statement.sql += ' AND ';
                    break;
                case 'Or':
                    this.statement.sql += ' OR ';
                    break;
                case 'Concat':
                    if (this.flavor === 'sqlite') {
                        this.statement.sql += ' || ';
                    } else {
                        this.statement.sql += ' + ';
                    }
                    break;
                case 'Add':
                    this.statement.sql += ' + ';
                    break;
                case 'Subtract':
                    this.statement.sql += ' - ';
                    break;
                case 'Multiply':
                    this.statement.sql += ' * ';
                    break;
                case 'Divide':
                    this.statement.sql += ' / ';
                    break;
                case 'Modulo':
                    this.statement.sql += ' % ';
                    break;
            }

            if (expr.right) {
                right = this.visit(expr.right);
            }
        }

        this.statement.sql += ')';

        if ((left !== expr.left) || (right !== expr.right)) {
            return new expressions.Binary(left, right);
        }

        return expr;
    },

    visitConstant: function (expr) {
        if (expr.value === null) {
            this.statement.sql += 'NULL';
            return expr;
        }

        this.statement.sql += this._createParameter(expr.value);

        return expr;
    },

    visitFloatConstant: function (expr) {
        if (expr.value === null) {
            this.statement.sql += 'NULL';
            return expr;
        }

        this.statement.sql += this._createParameter(expr.value, 'float');

        return expr;
    },

    _createParameter: function (value, type) {
        var parameter = {
            name: this.parameterPrefix + (++this.paramNumber).toString(),
            pos: this.paramNumber,
            value: value,
            type: type
        };

        this.statement.parameters.push(parameter);

        return '@' + this.parameterPrefix + this.paramNumber.toString();
    },

    visitMember: function (expr) {
        if (typeof expr.member === 'string') {
            this.statement.sql += helpers.formatMember(expr.member);
        }
        else {
            this._formatMappedMember(expr);
        }

        return expr;
    },

    visitUnary: function (expr) {
        if (expr.expressionType == 'Not') {
            this.statement.sql += 'NOT ';
            this.visit(expr.operand);
        }
        else if (expr.expressionType == 'Convert') {
            this.statement.sql += util.format("CONVERT(%s, ", expr.desiredType);
            this.visit(expr.operand);
            this.statement.sql += ')';
        }

        return expr;
    },

    visitFunction: function (expr) {
        if (expr.memberInfo) {
            this._formatMappedFunction(expr);
        }
        return expr;
    },

    _formatMappedFunction: function (expr) {
        if (expr.memberInfo.type == 'string') {
            this._formatMappedStringMember(expr.instance, expr.memberInfo, expr.args);
        }
        else if (expr.memberInfo.type == 'date') {
            this._formatMappedDateMember(expr.instance, expr.memberInfo, expr.args);
        }
        else if (expr.memberInfo.type == 'math') {
            this._formatMappedMathMember(expr.instance, expr.memberInfo, expr.args);
        }
    },

    _formatMappedMember: function (expr) {
        if (expr.member.type == 'string') {
            this._formatMappedStringMember(expr.instance, expr.member, null);
        }
    },

    _formatMappedDateMember: function (instance, mappedMemberInfo, args) {
        var functionName = mappedMemberInfo.memberName;

        if (functionName == 'day') {
            this.statement.sql += 'DAY(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (mappedMemberInfo.memberName == 'month') {
            this.statement.sql += 'MONTH(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (mappedMemberInfo.memberName == 'year') {
            this.statement.sql += 'YEAR(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (mappedMemberInfo.memberName == 'hour') {
            this.statement.sql += 'DATEPART(HOUR, ';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (mappedMemberInfo.memberName == 'minute') {
            this.statement.sql += 'DATEPART(MINUTE, ';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (mappedMemberInfo.memberName == 'second') {
            this.statement.sql += 'DATEPART(SECOND, ';
            this.visit(instance);
            this.statement.sql += ')';
        }
    },

    _formatMappedMathMember: function (instance, mappedMemberInfo, args) {
        var functionName = mappedMemberInfo.memberName;

        if (functionName == 'floor') {
            this.statement.sql += 'FLOOR(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (functionName == 'ceiling') {
            this.statement.sql += 'CEILING(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (functionName == 'round') {
            // Use the 'away from zero' midpoint rounding strategy - when
            // a number is halfway between two others, it is rounded toward
            // the nearest number that is away from zero.
            this.statement.sql += 'ROUND(';
            this.visit(instance);
            this.statement.sql += ', 0)';
        }
    },

    _formatMappedStringMember: function (instance, mappedMemberInfo, args) {
        var functionName = mappedMemberInfo.memberName;

        if (functionName == 'substringof') {
            this.statement.sql += '(';
            this.visit(instance);

            this.statement.sql += ' LIKE ';

            // form '%' + <arg> + '%'
            this.statement.sql += "('%' + ";
            this.visit(args[0]);
            this.statement.sql += " + '%')";

            this.statement.sql += ')';
        }
        else if (functionName == 'startswith') {
            this.statement.sql += '(';
            this.visit(instance);

            this.statement.sql += ' LIKE ';

            // form '<arg> + '%'
            this.statement.sql += '(';
            this.visit(args[0]);
            this.statement.sql += " + '%')";

            this.statement.sql += ')';
        }
        else if (functionName == 'endswith') {
            this.statement.sql += '(';
            this.visit(instance);

            this.statement.sql += ' LIKE ';

            // form '%' + '<arg>
            this.statement.sql += "('%' + ";
            this.visit(args[0]);
            this.statement.sql += ')';

            this.statement.sql += ')';
        }
        else if (functionName == 'concat') {
            if (this.flavor !== 'sqlite') {
                // Rewrite as an string addition with appropriate conversions.
                // Note: due to sql operator precidence, we only need to inject a
                // single conversion - the other will be upcast to string.
                if (!isConstantOfType(args[0], 'string')) {
                    args[0] = new expressions.Convert(helpers.getSqlType(''), args[0]);
                } else if (!isConstantOfType(args[1], 'string')) {
                    args[1] = new expressions.Convert(helpers.getSqlType(''), args[1]);
                }
            }
            var concat = new expressions.Binary(args[0], args[1], 'Concat');
            this.visit(concat);
        }
        else if (functionName == 'tolower') {
            this.statement.sql += 'LOWER(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (functionName == 'toupper') {
            this.statement.sql += 'UPPER(';
            this.visit(instance);
            this.statement.sql += ')';
        }
        else if (functionName == 'length') {
            // special translation since SQL LEN function doesn't
            // preserve trailing spaces
            this.statement.sql += '(LEN(';
            this.visit(instance);
            this.statement.sql += " + 'X') - 1)";
        }
        else if (functionName == 'trim') {
            this.statement.sql += 'LTRIM(RTRIM(';
            this.visit(instance);
            this.statement.sql += '))';
        }
        else if (functionName == 'indexof') {
            if (this.flavor === 'sqlite') {
                this.statement.sql += "(INSTR(";
                this.visit(args[0]);
                this.statement.sql += ", ";
                this.visit(instance);
                this.statement.sql += ') - 1)';
            } else {
                this.statement.sql += "(PATINDEX('%' + ";
                this.visit(args[0]);
                this.statement.sql += " + '%', ";
                this.visit(instance);
                this.statement.sql += ') - 1)';
            }
        }
        else if (functionName == 'replace') {
            this.statement.sql += "REPLACE(";
            this.visit(instance);
            this.statement.sql += ", ";
            this.visit(args[0]);
            this.statement.sql += ", ";
            this.visit(args[1]);
            this.statement.sql += ')';
        }
        else if (functionName == 'substring') {
            if (this.flavor === 'sqlite') {
                this.statement.sql += 'SUBSTR(';
            } else {
                this.statement.sql += 'SUBSTRING(';
            }
            this.visit(instance);

            this.statement.sql += ", ";
            this.visit(args[0]);
            this.statement.sql += " + 1, ";  // need to add 1 since SQL is 1 based, but OData is zero based

            if (args.length == 1) {
                // Overload not taking an explicit length. The
                // LEN of the entire expression is used in this case
                // which means everything after the start index will
                // be taken.
                this.statement.sql += 'LEN(';
                this.visit(instance);
                this.statement.sql += ')';
            }
            else if (args.length == 2) {
                // overload taking a length
                this.visit(args[1]);
            }

            this.statement.sql += ')';
        }
    }
});

function isConstantOfType(expr, type) {
    return (expr.expressionType == 'Constant') && (typeof expr.value === type);
}

// query should be in the format as generated by query.js toOData function
module.exports = function (query, tableConfig) {
    query.table = (tableConfig && (tableConfig.containerName || tableConfig.databaseTableName || tableConfig.name)) || query.table;
    var formatter = new SqlFormatter(tableConfig);
    return formatter.format(query);
};

module.exports.filter = function (query, parameterPrefix, tableConfig) {
    var formatter = new SqlFormatter(tableConfig);
    formatter.parameterPrefix = parameterPrefix || 'p';
    formatter._formatFilter(query);
    return formatter.statement;
};

},{"./ExpressionVisitor":3,"./booleanize":4,"./convertTypes":5,"./expressions":6,"./helpers":8,"./parseOData":10,"./utilities/types":12,"util":55}],8:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var types = _dereq_('./utilities/types'),
    strings = _dereq_('./utilities/strings');

var helpers = module.exports = {
    // Performs the following validations on the specified identifier:
    // - first char is alphabetic or an underscore
    // - all other characters are alphanumeric or underscore
    // - the identifier is LTE 128 in length
    isValidIdentifier: function (identifier) {
        if (!identifier || !types.isString(identifier) || identifier.length > 128) {
            return false;
        }

        for (var i = 0; i < identifier.length; i++) {
            var char = identifier[i];
            if (i === 0) {
                if (!(strings.isLetter(char) || (char == '_'))) {
                    return false;
                }
            } else {
                if (!(strings.isLetter(char) || strings.isDigit(char) || (char == '_'))) {
                    return false;
                }
            }
        }

        return true;
    },

    validateIdentifier: function (identifier) {
        if (!this.isValidIdentifier(identifier)) {
            throw new Error(identifier + " is not a valid identifier. Identifiers must be under 128 characters in length, start with a letter or underscore, and can contain only alpha-numeric and underscore characters.");
        }
    },

    formatTableName: function (schemaName, tableName) {

        this.validateIdentifier(tableName);

        if (schemaName !== undefined) {
            schemaName = module.exports.formatSchemaName(schemaName);
            this.validateIdentifier(schemaName);
            return '[' + schemaName + '].[' + tableName + ']';
        }

        return '[' + tableName + ']';
    },

    formatSchemaName: function (appName) {
        // Hyphens are not supported in schema names
        return appName.replace(/-/g, '_');
    },

    formatMember: function (memberName) {
        this.validateIdentifier(memberName);
        return '[' + memberName + ']';
    },

    getSqlType: function (value, primaryKey) {
        if(value === undefined || value === null)
            throw new Error('Cannot create column for null or undefined value');

        switch (value.constructor) {
            case String:
                // 900 bytes is the maximum length for a primary key - http://stackoverflow.com/questions/10555642/varcharmax-column-not-allowed-to-be-a-primary-key-in-sql-server
                return primaryKey ? "NVARCHAR(255)" : "NVARCHAR(MAX)";
            case Number:
                return primaryKey ? "INT" : "FLOAT(53)";
            case Boolean:
                return "BIT";
            case Date:
                return "DATETIMEOFFSET(7)";
            default:
                throw new Error("Unable to map value " + value.toString() + " to a SQL type.");
        }
    },

    getPredefinedColumnType: function (value) {
        switch(value) {
            case 'string':
                return 'NVARCHAR(MAX)';
            case 'number':
                return 'FLOAT(53)';
            case 'boolean':
            case 'bool':
                return 'BIT';
            case 'datetime':
            case 'date':
                return 'DATETIMEOFFSET(7)';
        }

        throw new Error('Unrecognised column type: ' + value);
    },

    getPredefinedType: function (value) {
        switch(value) {
            case 'nvarchar':
                return 'string';
            case 'float':
                return 'number';
            case 'bit':
                return 'boolean';
            case 'datetimeoffset':
                return 'datetime';
            case 'timestamp':
                return 'string';
            default:
                return value;
        }
    },

    getSystemPropertiesDDL: function () {
        return {
            version: 'version ROWVERSION NOT NULL',
            createdAt: 'createdAt DATETIMEOFFSET(7) NOT NULL DEFAULT CONVERT(DATETIMEOFFSET(7),SYSUTCDATETIME(),0)',
            updatedAt: 'updatedAt DATETIMEOFFSET(7) NOT NULL DEFAULT CONVERT(DATETIMEOFFSET(7),SYSUTCDATETIME(),0)',
            deleted: 'deleted bit NOT NULL DEFAULT 0'
        };
    },

    getSystemProperties: function () {
        return Object.keys(helpers.getSystemPropertiesDDL());
    },

    isSystemProperty: function (property) {
        return helpers.getSystemProperties().some(function (systemProperty) { return property === systemProperty; });
    },
};

},{"./utilities/strings":11,"./utilities/types":12}],9:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
var format = _dereq_('./format');

module.exports = {
    format: format
};

},{"./format":7}],10:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var util = _dereq_('util'),
    types = _dereq_('./utilities/types'),
    strings = _dereq_('./utilities/strings'),
    expressions = _dereq_('./expressions');

function ctor(expression) {
    this.keywords = this._createKeywords();

    // define the default root parameter for all member expressions
    this.it = new expressions.Parameter();

    this.text = expression;
    this.textLen = this.text.length;
    this.token = {};
    this._setTextPos(0);
    this._nextToken();
}

var ODataParser = types.defineClass(ctor, {
    parse: function () {
        var expr = this._parseExpression();

        this._validateToken('End', 'Syntax error');
        return expr;
    },

    parseOrdering: function () {
        var orderings = [];
        while (true) {
            var expr = this._parseExpression();
            var ascending = true;
            if (this._tokenIdentifierIs('asc')) {
                this._nextToken();
            }
            else if (this._tokenIdentifierIs('desc')) {
                this._nextToken();
                ascending = false;
            }
            orderings.push({
                selector: expr,
                ascending: ascending
            });
            if (this.token.id != 'Comma') {
                break;
            }
            this._nextToken();
        }
        this._validateToken('End', 'Syntax error');
        return orderings;
    },

    _tokenIdentifierIs: function (id) {
        return this.token.id == 'Identifier' && id == this.token.text;
    },

    _parseExpression: function () {
        return this._parseLogicalOr();
    },

    // 'or' operator
    _parseLogicalOr: function () {
        var left = this._parseLogicalAnd();
        while (this.token.id == 'Or') {
            this._nextToken();
            var right = this._parseLogicalAnd();
            left = new expressions.Binary(left, right, 'Or');
        }
        return left;
    },

    // 'and' operator
    _parseLogicalAnd: function () {
        var left = this._parseComparison();
        while (this.token.id == 'And') {
            this._nextToken();
            var right = this._parseComparison();
            left = new expressions.Binary(left, right, 'And');
        }
        return left;
    },

    _parseComparison: function () {
        var left = this._parseAdditive();
        while (this.token.id == 'Equal' || this.token.id == 'NotEqual' || this.token.id == 'GreaterThan' ||
            this.token.id == 'GreaterThanEqual' || this.token.id == 'LessThan' || this.token.id == 'LessThanEqual') {

            var opId = this.token.id;
            this._nextToken();
            var right = this._parseAdditive();

            switch (opId) {
                case 'Equal':
                    left = new expressions.Binary(left, right, 'Equal');
                    break;
                case 'NotEqual':
                    left = new expressions.Binary(left, right, 'NotEqual');
                    break;
                case 'GreaterThan':
                    left = new expressions.Binary(left, right, 'GreaterThan');
                    break;
                case 'GreaterThanEqual':
                    left = new expressions.Binary(left, right, 'GreaterThanOrEqual');
                    break;
                case 'LessThan':
                    left = new expressions.Binary(left, right, 'LessThan');
                    break;
                case 'LessThanEqual':
                    left = new expressions.Binary(left, right, 'LessThanOrEqual');
                    break;
            }
        }
        return left;
    },

    // 'add','sub' operators
    _parseAdditive: function () {
        var left = this._parseMultiplicative();
        while (this.token.id == 'Add' || this.token.id == 'Sub') {
            var opId = this.token.id;
            this._nextToken();
            var right = this._parseMultiplicative();
            switch (opId) {
                case 'Add':
                    left = new expressions.Binary(left, right, 'Add');
                    break;
                case 'Sub':
                    left = new expressions.Binary(left, right, 'Subtract');
                    break;
            }
        }
        return left;
    },

    // 'mul', 'div', 'mod' operators
    _parseMultiplicative: function () {
        var left = this._parseUnary();
        while (this.token.id == 'Multiply' || this.token.id == 'Divide' ||
                this.token.id == 'Modulo') {
            var opId = this.token.id;
            this._nextToken();
            var right = this._parseUnary();
            switch (opId) {
                case 'Multiply':
                    left = new expressions.Binary(left, right, 'Multiply');
                    break;
                case 'Divide':
                    left = new expressions.Binary(left, right, 'Divide');
                    break;
                case 'Modulo':
                    left = new expressions.Binary(left, right, 'Modulo');
                    break;
            }
        }
        return left;
    },

    // -, 'not' unary operators
    _parseUnary: function () {
        if (this.token.id == 'Minus' || this.token.id == 'Not') {
            var opId = this.token.id;
            var opPos = this.token.pos;
            this._nextToken();
            if (opId == 'Minus' && (this.token.id == 'IntegerLiteral' ||
                this.token.id == 'RealLiteral')) {
                this.token.text = "-" + this.token.text;
                this.token.pos = opPos;
                return this._parsePrimary();
            }

            var expr = this._parseUnary();
            if (opId == 'Minus') {
                expr = new expressions.Unary(expr, 'Negate');
            } else {
                expr = new expressions.Unary(expr, 'Not');
            }
            return expr;
        }
        return this._parsePrimary();
    },

    _parsePrimary: function () {
        var expr = this._parsePrimaryStart();
        while (true) {
            if (this.token.id == 'Dot') {
                this._nextToken();
                expr = this._parseMemberAccess(expr);
            }
            else {
                break;
            }
        }
        return expr;
    },

    _parseMemberAccess: function (instance) {
        var errorPos = this.token.pos;
        var id = this._getIdentifier();
        this._nextToken();
        if (this.token.id == 'OpenParen') {
            var mappedFunction = this._mapFunction(id);
            if (mappedFunction !== null) {
                return this._parseMappedFunction(mappedFunction, errorPos);
            }
            else {
                throw this._parseError(util.format("Unknown identifier '%s'", id), errorPos);
            }
        }
        else {
            return new expressions.Member(instance, id);
        }
    },

    _parseMappedFunction: function (mappedMember, errorPos) {
        var mappedMemberName = mappedMember.memberName;
        var args;
        var instance = null;

        this._beginValidateFunction(mappedMemberName, errorPos);

        if (this.token.id == 'OpenParen') {
            args = this._parseArgumentList();

            this._completeValidateFunction(mappedMemberName, args);

            if (mappedMember.mapParams) {
                mappedMember.mapParams(args);
            }

            // static methods need to include the target
            if (!mappedMember.isStatic) {
                if (args.length === 0) {
                    throw this._parseError(
                        util.format("No applicable method '%s' exists in type '%s'", mappedMember.memberName, mappedMember.type), errorPos);
                }

                instance = args[0];
                args = args.slice(1);
            }
            else {
                instance = null;
            }
        }
        else {
            // if it is a function it should begin with a '('
            throw this._parseError("'(' expected");
        }

        if (mappedMember.isMethod) {
            // a mapped function
            return new expressions.FunctionCall(instance, mappedMember, args);
        }
        else {
            // a mapped Property/Field
            return new expressions.Member(instance, mappedMember);
        }
    },

    _beginValidateFunction: function (functionName, errorPos) {
        if (functionName === 'replace') {
            // Security: nested calls to replace must be prevented to avoid an exploit
            // wherein the client can force the server to allocate arbitrarily large
            // strings.
            if (this.inStringReplace) {
                throw this._parseError("Calls to 'replace' cannot be nested.", errorPos);
            }
            this.inStringReplace = true;
        }
    },

    _completeValidateFunction: function (functionName, functionArgs, errorPos) {
        // validate parameters
        switch (functionName) {
            case 'day':
            case 'month':
            case 'year':
            case 'hour':
            case 'minute':
            case 'second':
            case 'floor':
            case 'ceiling':
            case 'round':
            case 'tolower':
            case 'toupper':
            case 'length':
            case 'trim':
                this._validateFunctionParameters(functionName, functionArgs, 1);
                break;
            case 'substringof':
            case 'startswith':
            case 'endswith':
            case 'concat':
            case 'indexof':
                this._validateFunctionParameters(functionName, functionArgs, 2);
                break;
            case 'replace':
                this._validateFunctionParameters(functionName, functionArgs, 3);
                // Security: we limit the replacement value to avoid an exploit
                // wherein the client can force the server to allocate arbitrarily large
                // strings.
                var replaceArg = functionArgs[2];
                if ((replaceArg.expressionType !== 'Constant') || (replaceArg.value.length > 100)) {
                    throw this._parseError("The third parameter to 'replace' must be a string constant less than 100 in length.", errorPos);
                }
                break;
            case 'substring':
                if (functionArgs.length != 2 && functionArgs.length != 3) {
                    throw new Error("Function 'substring' requires 2 or 3 parameters.");
                }
                break;
        }

        this.inStringReplace = false;
    },

    _validateFunctionParameters: function (functionName, args, expectedArgCount) {
        if (args.length !== expectedArgCount) {
            var error = util.format("Function '%s' requires %d %s",
                functionName, expectedArgCount, (expectedArgCount > 1) ? "parameters." : "parameter.");
            throw new Error(error);
        }
    },

    _parseArgumentList: function () {
        this._validateToken('OpenParen', "'(' expected");
        this._nextToken();
        var args = this.token.id != 'CloseParen' ? this._parseArguments() : [];
        this._validateToken('CloseParen', "')' or ',' expected");
        this._nextToken();
        return args;
    },

    _parseArguments: function () {
        var args = [];
        while (true) {
            args.push(this._parseExpression());
            if (this.token.id != 'Comma') {
                break;
            }
            this._nextToken();
        }
        return args;
    },

    _mapFunction: function (functionName) {
        var mappedMember = this._mapStringFunction(functionName);
        if (mappedMember !== null) {
            return mappedMember;
        }

        mappedMember = this._mapDateFunction(functionName);
        if (mappedMember !== null) {
            return mappedMember;
        }

        mappedMember = this._mapMathFunction(functionName);
        if (mappedMember !== null) {
            return mappedMember;
        }

        return null;
    },

    _mapStringFunction: function (functionName) {
        if (functionName == 'startswith') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'endswith') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'length') {
            return new expressions.MappedMemberInfo('string', functionName, false, false);
        }
        else if (functionName == 'toupper') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'tolower') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'trim') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'substringof') {
            var memberInfo = new expressions.MappedMemberInfo('string', functionName, false, true);
            memberInfo.mapParams = function (args) {
                // reverse the order of arguments for string.Contains
                var tmp = args[0];
                args[0] = args[1];
                args[1] = tmp;
            };
            return memberInfo;
        }
        else if (functionName == 'indexof') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'replace') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'substring') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'trim') {
            return new expressions.MappedMemberInfo('string', functionName, false, true);
        }
        else if (functionName == 'concat') {
            return new expressions.MappedMemberInfo('string', functionName, true, true);
        }

        return null;
    },

    _mapDateFunction: function (functionName) {
        if (functionName == 'day') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        else if (functionName == 'month') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        else if (functionName == 'year') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        if (functionName == 'hour') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        else if (functionName == 'minute') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        else if (functionName == 'second') {
            return new expressions.MappedMemberInfo('date', functionName, false, true);
        }
        return null;
    },

    _mapMathFunction: function (functionName) {
        if (functionName == 'floor') {
            return new expressions.MappedMemberInfo('math', functionName, false, true);
        }
        else if (functionName == 'ceiling') {
            return new expressions.MappedMemberInfo('math', functionName, false, true);
        }
        else if (functionName == 'round') {
            return new expressions.MappedMemberInfo('math', functionName, false, true);
        }
        return null;
    },

    _getIdentifier: function () {
        this._validateToken('Identifier', 'Identifier expected');
        return this.token.text;
    },

    _parsePrimaryStart: function () {
        switch (this.token.id) {
            case 'Identifier':
                return this._parseIdentifier();
            case 'StringLiteral':
                return this._parseStringLiteral();
            case 'IntegerLiteral':
                return this._parseIntegerLiteral();
            case 'RealLiteral':
                return this._parseRealLiteral();
            case 'OpenParen':
                return this._parseParenExpression();
            default:
                throw this._parseError('Expression expected');
        }
    },

    _parseIntegerLiteral: function () {
        this._validateToken('IntegerLiteral');
        var text = this.token.text;

        // parseInt will return the integer portion of the string, and won't
        // error on something like '1234xyz'.
        var value = parseInt(text, 10);
        if (isNaN(value) || (value != text)) {
            throw this._parseError(util.format("Invalid integer literal '%s'", text));
        }

        this._nextToken();
        if (this.token.text.toUpperCase() == 'L') {
            // in JS there is only one type of integer number, so this code is only here
            // to parse the OData 'L/l' correctly
            this._nextToken();
            return new expressions.Constant(value);
        }
        return new expressions.Constant(value);
    },

    _parseRealLiteral: function () {
        this._validateToken('RealLiteral');
        var text = this.token.text;

        var last = text.slice(-1);
        if (last.toUpperCase() == 'F' || last.toUpperCase() == 'M' || last.toUpperCase() == 'D') {
            // in JS there is only one floating point type,
            // so terminating F/f, M/m, D/d have no effect.
            text = text.slice(0, -1);
        }

        var value = parseFloat(text);

        if (isNaN(value) || (value != text)) {
            throw this._parseError(util.format("Invalid real literal '%s'", text));
        }

        this._nextToken();
        return new expressions.FloatConstant(value);
    },

    _parseParenExpression: function () {
        this._validateToken('OpenParen', "'(' expected");
        this._nextToken();
        var e = this._parseExpression();
        this._validateToken('CloseParen', "')' or operator expected");
        this._nextToken();
        return e;
    },

    _parseIdentifier: function () {
        this._validateToken('Identifier');
        var value = this.keywords[this.token.text];
        if (value) {
            // type construction has the format of type'value' e.g. datetime'2001-04-01T00:00:00Z'
            // therefore if the next character is a single quote then we try to
            // interpret this as type construction else its a normal member access
            if (typeof value === 'string' && this.ch == '\'') {
                return this._parseTypeConstruction(value);
            }
            else if (typeof value !== 'string') {  // this is a constant
                this._nextToken();
                return value;
            }
        }

        if (this.it !== null) {
            return this._parseMemberAccess(this.it);
        }

        throw this._parseError(util.format("Unknown identifier '%s'", this.token.text));
    },

    _parseTypeConstruction: function (type) {
        var typeIdentifier = this.token.text;
        var errorPos = this.token.pos;
        this._nextToken();
        var typeExpression = null;

        if (this.token.id == 'StringLiteral') {
            errorPos = this.token.pos;
            var stringExpr = this._parseStringLiteral();
            var literalValue = stringExpr.value;
            var date = null;

            try {
                if (type == 'datetime') {
                    date = strings.parseISODate(literalValue);
                    if (date) {
                        typeExpression = new expressions.Constant(date);
                    }
                }
                else if (type == 'datetimeoffset') {
                    date = strings.parseDateTimeOffset(literalValue);
                    if (date) {
                        typeExpression = new expressions.Constant(date);
                    }
                }
            }
            catch (e) {
                throw this._parseError(e, errorPos);
            }
        }

        if (!typeExpression) {
            throw this._parseError(util.format("Invalid '%s' type creation expression", typeIdentifier), errorPos);
        }

        return typeExpression;
    },

    _parseStringLiteral: function () {
        this._validateToken('StringLiteral');
        // Unwrap string (remove surrounding quotes) and unwrap escaped quotes.
        var s = this.token.text.substr(1, this.token.text.length - 2).replace(/''/g, "'");

        this._nextToken();
        return new expressions.Constant(s);
    },

    _validateToken: function (tokenId, error) {
        if (this.token.id != tokenId) {
            throw this._parseError(error || 'Syntax error');
        }
    },

    _createKeywords: function () {
        return {
            "true": new expressions.Constant(true),
            "false": new expressions.Constant(false),
            "null": new expressions.Constant(null),

            // type keywords
            datetime: 'datetime',
            datetimeoffset: 'datetimeoffset'
        };
    },

    _setTextPos: function (pos) {
        this.textPos = pos;
        this.ch = this.textPos < this.textLen ? this.text[this.textPos] : '\\0';
    },

    _nextToken: function () {
        while (this._isWhiteSpace(this.ch)) {
            this._nextChar();
        }
        var t; // TokenId
        var tokenPos = this.textPos;
        switch (this.ch) {
            case '(':
                this._nextChar();
                t = 'OpenParen';
                break;
            case ')':
                this._nextChar();
                t = 'CloseParen';
                break;
            case ',':
                this._nextChar();
                t = 'Comma';
                break;
            case '-':
                this._nextChar();
                t = 'Minus';
                break;
            case '/':
                this._nextChar();
                t = 'Dot';
                break;
            case '\'':
                var quote = this.ch;
                do {
                    this._nextChar();
                    while (this.textPos < this.textLen && this.ch != quote) {
                        this._nextChar();
                    }

                    if (this.textPos == this.textLen) {
                        throw this._parseError("Unterminated string literal", this.textPos);
                    }
                    this._nextChar();
                }
                while (this.ch == quote);
                t = 'StringLiteral';
                break;
            default:
                if (this._isIdentifierStart(this.ch) || this.ch == '@' || this.ch == '_') {
                    do {
                        this._nextChar();
                    }
                    while (this._isIdentifierPart(this.ch) || this.ch == '_');
                    t = 'Identifier';
                    break;
                }
                if (strings.isDigit(this.ch)) {
                    t = 'IntegerLiteral';
                    do {
                        this._nextChar();
                    }
                    while (strings.isDigit(this.ch));
                    if (this.ch == '.') {
                        t = 'RealLiteral';
                        this._nextChar();
                        this._validateDigit();
                        do {
                            this._nextChar();
                        }
                        while (strings.isDigit(this.ch));
                    }
                    if (this.ch == 'E' || this.ch == 'e') {
                        t = 'RealLiteral';
                        this._nextChar();
                        if (this.ch == '+' || this.ch == '-') {
                            this._nextChar();
                        }
                        this._validateDigit();
                        do {
                            this._nextChar();
                        }
                        while (strings.isDigit(this.ch));
                    }
                    if (this.ch == 'F' || this.ch == 'f' || this.ch == 'M' || this.ch == 'm' || this.ch == 'D' || this.ch == 'd') {
                        t = 'RealLiteral';
                        this._nextChar();
                    }
                    break;
                }
                if (this.textPos == this.textLen) {
                    t = 'End';
                    break;
                }
                throw this._parseError("Syntax error '" + this.ch + "'", this.textPos);
        }
        this.token.id = t;
        this.token.text = this.text.substr(tokenPos, this.textPos - tokenPos);
        this.token.pos = tokenPos;

        this.token.id = this._reclassifyToken(this.token);
    },

    _reclassifyToken: function (token) {
        if (token.id == 'Identifier') {
            if (token.text == "or") {
                return 'Or';
            }
            else if (token.text == "add") {
                return 'Add';
            }
            else if (token.text == "and") {
                return 'And';
            }
            else if (token.text == "div") {
                return 'Divide';
            }
            else if (token.text == "sub") {
                return 'Sub';
            }
            else if (token.text == "mul") {
                return 'Multiply';
            }
            else if (token.text == "mod") {
                return 'Modulo';
            }
            else if (token.text == "ne") {
                return 'NotEqual';
            }
            else if (token.text == "not") {
                return 'Not';
            }
            else if (token.text == "le") {
                return 'LessThanEqual';
            }
            else if (token.text == "lt") {
                return 'LessThan';
            }
            else if (token.text == "eq") {
                return 'Equal';
            }
            else if (token.text == "ge") {
                return 'GreaterThanEqual';
            }
            else if (token.text == "gt") {
                return 'GreaterThan';
            }
        }

        return token.id;
    },

    _nextChar: function () {
        if (this.textPos < this.textLen) {
            this.textPos++;
        }
        this.ch = this.textPos < this.textLen ? this.text[this.textPos] : '\\0';
    },

    _isWhiteSpace: function (ch) {
        return (/\s/).test(ch);
    },

    _validateDigit: function () {
        if (!strings.isDigit(this.ch)) {
            throw this._parseError('Digit expected', this.textPos);
        }
    },

    _parseError: function (error, pos) {
        pos = pos || this.token.pos || 0;
        return new Error(error + ' (at index ' + pos + ')');
    },

    _isIdentifierStart: function (ch) {
        return strings.isLetter(ch);
    },

    _isIdentifierPart: function (ch) {
        if (this._isIdentifierStart(ch)) {
            return true;
        }

        if (strings.isDigit(ch)) {
            return true;
        }

        if (ch == '_' || ch == '-') {
            return true;
        }

        return false;
    }
});

module.exports = function (predicate) {
    return new ODataParser(predicate).parse();
};

module.exports.orderBy = function (ordering) {
    return new ODataParser(ordering).parseOrdering();
};

},{"./expressions":6,"./utilities/strings":11,"./utilities/types":12,"util":55}],11:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Regex to validate string ids to ensure that it does not include any characters which can be used within a URI
var stringIdValidatorRegex = /([\u0000-\u001F]|[\u007F-\u009F]|["\+\?\\\/\`]|^\.{1,2}$)/;

// Match YYYY-MM-DDTHH:MM:SS.sssZ, with the millisecond (.sss) part optional
// Note: we only support a subset of ISO 8601
var iso8601Regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})(\.(\d{3}))?Z$/;

// Match MS Date format "\/Date(1336003790912-0700)\/"
var msDateRegex = /^\/Date\((-?)(\d+)(([+\-])(\d{2})(\d{2})?)?\)\/$/;

var strings = module.exports = {
    isLetter: function (ch) {
        return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
    },

    isDigit: function (ch) {
        return ch >= '0' && ch <= '9';
    },

    isValidStringId: function (id) {
        return !stringIdValidatorRegex.test(id);
    },

    // remove starting and finishing quotes and remove quote escaping from the middle of a string
    getVersionFromEtag: function (etag) {
        return etag.replace(/^"|\\(?=")|"$/g, '');
    },

    getEtagFromVersion: function (version) {
        return '"' + version.replace(/\"/g, '\\"') + '"';
    },

    convertDate: function (value) {
        var date = strings.parseISODate(value);
        if (date) {
            return date;
        }

        date = strings.parseMsDate(value);
        if (date) {
            return date;
        }

        return null;
    },

    // attempt to parse the value as an ISO 8601 date (e.g. 2012-05-03T00:06:00.638Z)
    parseISODate: function (value) {
        if (iso8601Regex.test(value)) {
            return strings.parseDateTimeOffset(value);
        }

        return null;
    },

    // parse a date and convert to UTC
    parseDateTimeOffset: function (value) {
        var ms = Date.parse(value);
        if (!isNaN(ms)) {
            return new Date(ms);
        }
        return null;
    },

    // attempt to parse the value as an MS date (e.g. "\/Date(1336003790912-0700)\/")
    parseMsDate: function (value) {
        var match = msDateRegex.exec(value);
        if (match) {
            // Get the ms and offset
            var milliseconds = parseInt(match[2], 10);
            var offsetMinutes = 0;
            if (match[5]) {
                var hours = parseInt(match[5], 10);
                var minutes = parseInt(match[6] || '0', 10);
                offsetMinutes = (hours * 60) + minutes;
            }

            // Handle negation
            if (match[1] === '-') {
                milliseconds = -milliseconds;
            }
            if (match[4] === '-') {
                offsetMinutes = -offsetMinutes;
            }

            var date = new Date();
            date.setTime(milliseconds + offsetMinutes * 60000);
            return date;
        }
        return null;
    },

    parseBoolean: function (bool) {
        if (bool === undefined || bool === null || typeof bool !== 'string') {
            return undefined;
        } else if (bool.toLowerCase() === 'true') {
            return true;
        } else if (bool.toLowerCase() === 'false') {
            return false;
        } else {
            return undefined;
        }
    }
};

},{}],12:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
var types = module.exports = {
    curry: function (fn) {
        var slice = Array.prototype.slice,
            args = slice.call(arguments, 1);
        return function () {
            return fn.apply(null, args.concat(slice.call(arguments)));
        };
    },

    extend: function (target, members) {
        for (var member in members) {
            if(members.hasOwnProperty(member))
                target[member] = members[member];
        }
        return target;
    },

    defineClass: function (ctor, instanceMembers, classMembers) {
        ctor = ctor || function () { };
        if (instanceMembers) {
            types.extend(ctor.prototype, instanceMembers);
        }
        if (classMembers) {
            types.extend(ctor, classMembers);
        }
        return ctor;
    },

    deriveClass: function (baseClass, ctor, instanceMembers) {
        var basePrototype = baseClass.prototype;
        var prototype = {};
        types.extend(prototype, basePrototype);

        var getPrototype = function (name, fn) {
            return function () {
                var tmp = this._super;
                this._super = basePrototype;
                var ret = fn.apply(this, arguments);
                this._super = tmp;
                return ret;
            };
        };

        if (instanceMembers)
            for (var name in instanceMembers)
                if(instanceMembers.hasOwnProperty(name))
                    // Check if we're overwriting an existing function
                    prototype[name] = typeof instanceMembers[name] === 'function' && typeof basePrototype[name] === 'function' ?
                        getPrototype(name, instanceMembers[name]) :
                        instanceMembers[name];

        ctor = ctor ?
            (function (fn) {
                return function () {
                    var tmp = this._super;
                    this._super = basePrototype;
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    return ret;
                };
            })(ctor)
            : function () { };

        ctor.prototype = prototype;
        ctor.prototype.constructor = ctor;
        return ctor;
    },

    classof: function (o) {
        if (o === null) {
            return 'null';
        }
        if (o === undefined) {
            return 'undefined';
        }
        return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
    },

    isArray: function (o) {
        return types.classof(o) === 'array';
    },

    isObject: function (o) {
        return types.classof(o) === 'object';
    },

    isDate: function (o) {
        return types.classof(o) === 'date';
    },

    isFunction: function (o) {
        return types.classof(o) === 'function';
    },

    isString: function (o) {
        return types.classof(o) === 'string';
    },

    isNumber: function (o) {
        return types.classof(o) === 'number';
    },

    isError: function (o) {
        return types.classof(o) === 'error';
    },

    isGuid: function (value) {
        return types.isString(value) && /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/.test(value);
    },

    isEmpty: function (obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
};

},{}],13:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var JS, JavaScript, JavaScriptToQueryVisitor, PartialEvaluator, esprima;

  esprima = _dereq_('esprima');

  JS = _dereq_('./JavaScriptNodes');

  PartialEvaluator = _dereq_('./PartialEvaluator').PartialEvaluator;

  JavaScriptToQueryVisitor = _dereq_('./JavaScriptToQueryVisitor').JavaScriptToQueryVisitor;


  /*
   * Define operations on JavaScript
   */

  exports.JavaScript = JavaScript = (function() {
    function JavaScript() {}


    /*
     * Static method to transform a constraint specified as a function into
     * a QueryExpression tree.
     */

    JavaScript.transformConstraint = function(func, env) {

      /*
       * Parse the body of the function into a JavaScriptExpression tree
       * (into a context that also contains its source and manually reified
       * environment)
       */
      var context, translator;
      context = JavaScript.getExpression(func, env);

      /*
       * Evaluate any independent subexpressions and turn them into
       * literals.
       */
      context.expression = PartialEvaluator.evaluate(context);

      /*
       * Convert the JavaScriptExpression tree into a QueryExpression tree
       */
      translator = new JavaScriptToQueryVisitor(context);
      return translator.visit(context.expression);
    };


    /*
     * Static method to walk a projection specified as a function and
     * determine which fields it uses.
     */

    JavaScript.getProjectedFields = function(func) {

      /*
       * This currently returns an empty array which indicates all fields.
       * At some point we'll need to go through and walk the expression
       * tree for func and see exactly which fields it uses.  This is
       * complicated by the fact that we support arbitrary expressions and
       * could for example pass 'this' to a nested lambda which means we
       * can't just check for MemberExpressions (though in that case we'll
       * probably just default to [] rather than trying to do alias
       * analysis across function calls, etc.)
       */
      return [];
    };


    /*
     * Turn a function and its explicitly passed environment into an
     * expression tree
     */

    JavaScript.getExpression = function(func, env) {

      /*
       * An anonymous function isn't considered a valid program, so we'll wrap
       * it in an assignment statement to keep the parser happy
       */
      var environment, expr, i, j, len, name, names, program, ref, ref1, ref10, ref11, ref12, ref13, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, source;
      source = "var _$$_stmt_$$_ = " + func + ";";

      /*
       * Use esprima to parse the source of the function body (and have it
       * return source locations in character ranges )
       */
      program = esprima.parse(source, {
        range: true

        /*
         * Get the expression from return statement of the function body to use
         * as our lambda expression
         */
      });
      expr = (program != null ? program.type : void 0) === 'Program' && (program != null ? (ref = program.body) != null ? ref.length : void 0 : void 0) === 1 && ((ref1 = program.body[0]) != null ? ref1.type : void 0) === 'VariableDeclaration' && ((ref2 = program.body[0]) != null ? (ref3 = ref2.declarations) != null ? ref3.length : void 0 : void 0) === 1 && ((ref4 = program.body[0].declarations[0]) != null ? ref4.type : void 0) === 'VariableDeclarator' && ((ref5 = program.body[0].declarations[0]) != null ? (ref6 = ref5.init) != null ? ref6.type : void 0 : void 0) === 'FunctionExpression' && ((ref7 = program.body[0].declarations[0].init) != null ? (ref8 = ref7.body) != null ? ref8.type : void 0 : void 0) === 'BlockStatement' && ((ref9 = program.body[0].declarations[0].init.body) != null ? (ref10 = ref9.body) != null ? ref10.length : void 0 : void 0) === 1 && ((ref11 = program.body[0].declarations[0].init.body.body[0]) != null ? ref11.type : void 0) === 'ReturnStatement' && ((ref12 = program.body[0].declarations[0].init.body.body[0]) != null ? ref12.argument : void 0);
      if (!expr) {
        throw "Expected a predicate with a single return statement, not " + func;
      }

      /*
       * Create the environment mqpping parameters to values
       */
      names = (ref13 = program.body[0].declarations[0].init.params) != null ? ref13.map(function(p) {
        return p.name;
      }) : void 0;
      if (names.length > env.length) {
        throw "Expected value(s) for parameter(s) " + names.slice(env.length);
      } else if (env.length > names.length) {
        throw "Expected parameter(s) for value(s) " + env.slice(names.length);
      }
      environment = {};
      for (i = j = 0, len = names.length; j < len; i = ++j) {
        name = names[i];
        environment[name] = env[i];
      }
      return {

        /*
         * Return the environment context
         */
        source: source,
        expression: expr,
        environment: environment
      };
    };

    return JavaScript;

  })();

}).call(this);

},{"./JavaScriptNodes":14,"./JavaScriptToQueryVisitor":15,"./PartialEvaluator":18,"esprima":27}],14:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */


/*
 * Define the Esprima node structure for JavaScript parse trees.  This is mostly
 * identical to the SpiderMonkey API defined at
 * https://developer.mozilla.org/en/SpiderMonkey/Parser_API without any of the
 * SpiderMonkey specifics and a few simplifications made by Esprima (i.e. it
 * doesn't have separate objects for operator types, etc.).
 *
 * It's important to note that the Esprima parse tree will return object literals
 * and not instances of these types.  They're provided primarily for reference
 * and for easily constructing new subtrees during transformations by visitors.
 */


/* Get the base Node and Visitor classes. */

(function() {
  var ArrayExpression, ArrayPattern, AssignmentExpression, BinaryExpression, BlockStatement, BreakStatement, CallExpression, CatchClause, ConditionalExpression, ContinueStatement, DebuggerStatement, Declaration, DoWhileStatement, EmptyStatement, Expression, ExpressionStatement, ForInStatement, ForStatement, Function, FunctionDeclaration, FunctionExpression, Identifier, IfStatement, JavaScriptNode, JavaScriptVisitor, LabeledStatement, Literal, LogicalExpression, MemberExpression, NewExpression, Node, ObjectExpression, ObjectPattern, Pattern, Program, ReturnStatement, SequenceExpression, Statement, SwitchCase, SwitchStatement, ThisExpression, ThrowStatement, TryStatement, UnaryExpression, UpdateExpression, VariableDeclaration, VariableDeclarator, Visitor, WhileStatement, WithStatement, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = _dereq_('./Node'), Node = ref.Node, Visitor = ref.Visitor;


  /*
   * Base node for all JavaScript nodes.
   */

  exports.JavaScriptNode = JavaScriptNode = (function(superClass) {
    extend(JavaScriptNode, superClass);

    function JavaScriptNode() {
      JavaScriptNode.__super__.constructor.call(this);
    }

    return JavaScriptNode;

  })(Node);


  /*
   * Base visitor for all JavaScript nodes.
   */

  exports.JavaScriptVisitor = JavaScriptVisitor = (function(superClass) {
    extend(JavaScriptVisitor, superClass);

    function JavaScriptVisitor() {
      JavaScriptVisitor.__super__.constructor.call(this);
    }

    JavaScriptVisitor.prototype.JavaScriptNode = function(node) {
      return node;
    };

    return JavaScriptVisitor;

  })(Visitor);


  /*
   * A complete program source tree.
   */

  exports.Program = Program = (function(superClass) {
    extend(Program, superClass);


    /*
     * @elements: [Statement]
     */

    function Program(elements) {
      this.elements = elements;
      Program.__super__.constructor.call(this);
    }

    return Program;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Program = function(node) {
    node = this.JavaScriptNode(node);
    node.elements = this.visit(node.elements);
    return node;
  };


  /*
   * A function declaration or expression. The body of the function is a  block
   * statement.
   */

  exports.Function = Function = (function(superClass) {
    extend(Function, superClass);


    /*
     * @id: Identifier | null
     * @params: [Pattern]
     * @body: BlockStatement
     */

    function Function(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      Function.__super__.constructor.call(this);
    }

    return Function;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Function = function(node) {
    node = this.JavaScriptNode(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * Any statement.
   */

  exports.Statement = Statement = (function(superClass) {
    extend(Statement, superClass);

    function Statement() {
      Statement.__super__.constructor.call(this);
    }

    return Statement;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Statement = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };


  /*
   * An empty statement, i.e., a solitary semicolon.
   */

  exports.EmptyStatement = EmptyStatement = (function(superClass) {
    extend(EmptyStatement, superClass);

    function EmptyStatement() {
      EmptyStatement.__super__.constructor.call(this);
    }

    return EmptyStatement;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.EmptyStatement = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };


  /*
   * A block statement, i.e., a sequence of statements surrounded by braces.
   */

  exports.BlockStatement = BlockStatement = (function(superClass) {
    extend(BlockStatement, superClass);


    /*
     * @body: [Statement]
     */

    function BlockStatement(body) {
      this.body = body;
      BlockStatement.__super__.constructor.call(this);
    }

    return BlockStatement;

  })(Statement);

  JavaScriptVisitor.prototype.BlockStatement = function(node) {
    node = this.Statement(node);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * An expression statement, i.e., a statement consisting of a single expression.
   */

  exports.ExpressionStatement = ExpressionStatement = (function(superClass) {
    extend(ExpressionStatement, superClass);

    function ExpressionStatement() {
      ExpressionStatement.__super__.constructor.call(this);
    }

    return ExpressionStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ExpressionStatement = function(node) {
    node = this.Statement(node);
    return node;
  };


  /*
   * An if statement.
   */

  exports.IfStatement = IfStatement = (function(superClass) {
    extend(IfStatement, superClass);


    /*
     * @test: Expression
     * @consequent: Statement
     * @alternate: Statement | null
     */

    function IfStatement(test, consequent, alternate) {
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      IfStatement.__super__.constructor.call(this);
    }

    return IfStatement;

  })(Statement);

  JavaScriptVisitor.prototype.IfStatement = function(node) {
    node = this.Statement(node);
    node.test = this.visit(node.test);
    node.consequent = this.visit(node.consequent);
    node.alternate = this.visit(node.alternate);
    return node;
  };


  /*
   * A labeled statement, i.e., a statement prefixed by a break/continue label.
   */

  exports.LabeledStatement = LabeledStatement = (function(superClass) {
    extend(LabeledStatement, superClass);


    /*
     * @label: Identifier
     * @body: Statement
     */

    function LabeledStatement(label, body) {
      this.label = label;
      this.body = body;
      LabeledStatement.__super__.constructor.call(this);
    }

    return LabeledStatement;

  })(Statement);

  JavaScriptVisitor.prototype.LabeledStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A break statement.
   */

  exports.BreakStatement = BreakStatement = (function(superClass) {
    extend(BreakStatement, superClass);


    /*
     * @label: Identifier | null
     */

    function BreakStatement(label) {
      this.label = label;
      BreakStatement.__super__.constructor.call(this);
    }

    return BreakStatement;

  })(Statement);

  JavaScriptVisitor.prototype.BreakStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    return node;
  };


  /*
  A continue statement.
   */

  exports.ContinueStatement = ContinueStatement = (function(superClass) {
    extend(ContinueStatement, superClass);


    /*
    @label: Identifier | null
     */

    function ContinueStatement(label) {
      this.label = label;
      ContinueStatement.__super__.constructor.call(this);
    }

    return ContinueStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ContinueStatement = function(node) {
    node = this.Statement(node);
    node.label = this.visit(node.label);
    return node;
  };


  /*
   * A with statement.
   */

  exports.WithStatement = WithStatement = (function(superClass) {
    extend(WithStatement, superClass);


    /*
     * @object: Expression
     * @body: Statement
     */

    function WithStatement(object, body) {
      this.object = object;
      this.body = body;
      WithStatement.__super__.constructor.call(this);
    }

    return WithStatement;

  })(Statement);

  JavaScriptVisitor.prototype.WithStatement = function(node) {
    node = this.Statement(node);
    node.object = this.visit(node.object);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A switch statement.
   */

  exports.SwitchStatement = SwitchStatement = (function(superClass) {
    extend(SwitchStatement, superClass);


    /*
     * @discriminant: Expression
     * @cases: [SwitchCase]
     */

    function SwitchStatement(discriminant, cases) {
      this.discriminant = discriminant;
      this.cases = cases;
      SwitchStatement.__super__.constructor.call(this);
    }

    return SwitchStatement;

  })(Statement);

  JavaScriptVisitor.prototype.SwitchStatement = function(node) {
    node = this.Statement(node);
    node.discriminant = this.visit(node.discriminant);
    node.cases = this.visit(node.cases);
    return node;
  };


  /*
   * A return statement.
   */

  exports.ReturnStatement = ReturnStatement = (function(superClass) {
    extend(ReturnStatement, superClass);


    /*
     * @argument: Expression | null
     */

    function ReturnStatement(argument) {
      this.argument = argument;
      ReturnStatement.__super__.constructor.call(this);
    }

    return ReturnStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ReturnStatement = function(node) {
    node = this.Statement(node);
    node.argument = this.visit(node.argument);
    return node;
  };


  /*
   * A throw statement.
   */

  exports.ThrowStatement = ThrowStatement = (function(superClass) {
    extend(ThrowStatement, superClass);


    /*
     * @argument: Expression
     */

    function ThrowStatement(argument) {
      this.argument = argument;
      ThrowStatement.__super__.constructor.call(this);
    }

    return ThrowStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ThrowStatement = function(node) {
    node = this.Statement(node);
    node.argument = this.visit(node.argument);
    return node;
  };


  /*
   * A try statement.
   */

  exports.TryStatement = TryStatement = (function(superClass) {
    extend(TryStatement, superClass);


    /*
     * @block: BlockStatement
     * @handlers: [CatchClause]
     * @finalizer: BlockStatement | null
     */

    function TryStatement(block, handlers, finalizer) {
      this.block = block;
      this.handlers = handlers;
      this.finalizer = finalizer;
      TryStatement.__super__.constructor.call(this);
    }

    return TryStatement;

  })(Statement);

  JavaScriptVisitor.prototype.TryStatement = function(node) {
    node = this.Statement(node);
    node.block = this.visit(node.block);
    node.handlers = this.visit(node.handlers);
    node.finalizer = this.visit(node.finalizer);
    return node;
  };


  /*
   * A while statement.
   */

  exports.WhileStatement = WhileStatement = (function(superClass) {
    extend(WhileStatement, superClass);


    /*
     * @test: Expression
     * @body: Statement
     */

    function WhileStatement(test, body) {
      this.test = test;
      this.body = body;
      WhileStatement.__super__.constructor.call(this);
    }

    return WhileStatement;

  })(Statement);

  JavaScriptVisitor.prototype.WhileStatement = function(node) {
    node = this.Statement(node);
    node.test = this.visit(node.test);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A do/while statement.
   */

  exports.DoWhileStatement = DoWhileStatement = (function(superClass) {
    extend(DoWhileStatement, superClass);


    /*
     * @body: Statement
     * @test: Expression
     */

    function DoWhileStatement(body, test) {
      this.body = body;
      this.test = test;
      DoWhileStatement.__super__.constructor.call(this);
    }

    return DoWhileStatement;

  })(Statement);

  JavaScriptVisitor.prototype.DoWhileStatement = function(node) {
    node = this.Statement(node);
    node.body = this.visit(node.body);
    node.test = this.visit(node.test);
    return node;
  };


  /*
   * A for statement.
   */

  exports.ForStatement = ForStatement = (function(superClass) {
    extend(ForStatement, superClass);


    /*
     * @init: VariableDeclaration | Expression | null
     * @test: Expression | null
     * @update: Expression | null
     * @body: Statement
     */

    function ForStatement(init, test, update, body) {
      this.init = init;
      this.test = test;
      this.update = update;
      this.body = body;
      ForStatement.__super__.constructor.call(this);
    }

    return ForStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ForStatement = function(node) {
    node = this.Statement(node);
    node.init = this.visit(node.init);
    node.test = this.visit(node.test);
    node.update = this.visit(node.update);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A for/in statement, or, if each is true, a for each/in statement.
   */

  exports.ForInStatement = ForInStatement = (function(superClass) {
    extend(ForInStatement, superClass);


    /*
     * @left: VariableDeclaration |  Expression
     * @right: Expression
     * @body: Statement
     */

    function ForInStatement(left, right, body) {
      this.left = left;
      this.right = right;
      this.body = body;
      ForInStatement.__super__.constructor.call(this);
    }

    return ForInStatement;

  })(Statement);

  JavaScriptVisitor.prototype.ForInStatement = function(node) {
    node = this.Statement(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A debugger statement.
   */

  exports.DebuggerStatement = DebuggerStatement = (function(superClass) {
    extend(DebuggerStatement, superClass);

    function DebuggerStatement() {
      DebuggerStatement.__super__.constructor.call(this);
    }

    return DebuggerStatement;

  })(Statement);

  JavaScriptVisitor.prototype.DebuggerStatement = function(node) {
    node = this.Statement(node);
    return node;
  };


  /*
   * Any declaration node. Note that declarations are considered statements; this
   * is because declarations can appear in any statement context in the language.
   */

  exports.Declaration = Declaration = (function(superClass) {
    extend(Declaration, superClass);

    function Declaration() {
      Declaration.__super__.constructor.call(this);
    }

    return Declaration;

  })(Statement);

  JavaScriptVisitor.prototype.Declaration = function(node) {
    node = this.Statement(node);
    return node;
  };


  /*
   * A function declaration.  Note: The id field cannot be null.
   */

  exports.FunctionDeclaration = FunctionDeclaration = (function(superClass) {
    extend(FunctionDeclaration, superClass);


    /*
     * @id: Identifier
     * @params: [ Pattern ]
     * @body: BlockStatement | Expression
     */

    function FunctionDeclaration(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      FunctionDeclaration.__super__.constructor.call(this);
    }

    return FunctionDeclaration;

  })(Declaration);

  JavaScriptVisitor.prototype.FunctionDeclaration = function(node) {
    node = this.Declaration(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A variable declaration, via one of var, let, or const.
   */

  exports.VariableDeclaration = VariableDeclaration = (function(superClass) {
    extend(VariableDeclaration, superClass);


    /*
     * @declarations: [ VariableDeclarator ]
     * @kind: "var"
     */

    function VariableDeclaration(declarations, kind) {
      this.declarations = declarations;
      this.kind = kind;
      VariableDeclaration.__super__.constructor.call(this);
    }

    return VariableDeclaration;

  })(Declaration);

  JavaScriptVisitor.prototype.VariableDeclaration = function(node) {
    node = this.Declaration(node);
    node.declarations = this.visit(node.declarations);
    return node;
  };


  /*
   * A variable declarator.  Note: The id field cannot be null.
   */

  exports.VariableDeclarator = VariableDeclarator = (function(superClass) {
    extend(VariableDeclarator, superClass);


    /*
     * @id: Pattern
     * @init: Expression | null
     */

    function VariableDeclarator(id, init) {
      this.id = id;
      this.init = init;
      VariableDeclarator.__super__.constructor.call(this);
    }

    return VariableDeclarator;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.VariableDeclarator = function(node) {
    node = this.JavaScriptNode(node);
    node.id = this.visit(node.id);
    node.init = this.visit(node.init);
    return node;
  };


  /*
   * Any expression node. Since the left-hand side of an assignment may be any
   * expression in general, an expression can also be a pattern.
   */

  exports.Expression = Expression = (function(superClass) {
    extend(Expression, superClass);

    function Expression() {
      return Expression.__super__.constructor.apply(this, arguments);
    }

    Expression.prototype.constuctor = function() {
      return Expression.__super__.constuctor.call(this);
    };

    return Expression;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Expression = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };


  /*
   * A this expression.
   */

  exports.ThisExpression = ThisExpression = (function(superClass) {
    extend(ThisExpression, superClass);

    function ThisExpression() {
      ThisExpression.__super__.constructor.call(this);
    }

    return ThisExpression;

  })(Expression);

  JavaScriptVisitor.prototype.ThisExpression = function(node) {
    node = this.Expression(node);
    return node;
  };


  /*
   * An array expression.
   */

  exports.ArrayExpression = ArrayExpression = (function(superClass) {
    extend(ArrayExpression, superClass);


    /*
     * @elements: [ Expression | null ]
     */

    function ArrayExpression(elements) {
      this.elements = elements;
      ArrayExpression.__super__.constructor.call(this);
    }

    return ArrayExpression;

  })(Expression);

  JavaScriptVisitor.prototype.ArrayExpression = function(node) {
    node = this.Expression(node);
    node.elements = this.visit(node.elements);
    return node;
  };


  /*
   * An object expression. A literal property in an object expression can have
   * either a string or number as its value.  Ordinary property initializers have a
   * kind value "init"; getters and setters have the kind values "get" and "set",
   * respectively.
   */

  exports.ObjectExpression = ObjectExpression = (function(superClass) {
    extend(ObjectExpression, superClass);


    /*
     * @properties: [ { key: Literal | Identifier,
     *                 value: Expression,
     *                 kind: "init" | "get" | "set" } ];
     */

    function ObjectExpression(properties) {
      this.properties = properties;
      ObjectExpression.__super__.constructor.call(this);
    }

    return ObjectExpression;

  })(Expression);

  JavaScriptVisitor.prototype.ObjectExpression = function(node) {
    var i, len, ref1, setter;
    node = this.Expression(node);
    ref1 = node.properties;
    for (i = 0, len = ref1.length; i < len; i++) {
      setter = ref1[i];
      setter.key = this.visit(setter.key);
      setter.value = this.visit(setter.value);
    }
    return node;
  };


  /*
   * A function expression.
   */

  exports.FunctionExpression = FunctionExpression = (function(superClass) {
    extend(FunctionExpression, superClass);


    /*
     * @id: Identifier | null
     * @params: [ Pattern ]
     * @body: BlockStatement | Expression
     */

    function FunctionExpression(id, params, body) {
      this.id = id;
      this.params = params;
      this.body = body;
      FunctionExpression.__super__.constructor.call(this);
    }

    return FunctionExpression;

  })(Expression);

  JavaScriptVisitor.prototype.FunctionExpression = function(node) {
    node = this.Expression(node);
    node.id = this.visit(node.id);
    node.params = this.visit(node.params);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * A sequence expression, i.e., a comma-separated sequence of expressions.
   */

  exports.SequenceExpression = SequenceExpression = (function(superClass) {
    extend(SequenceExpression, superClass);


    /*
     * @expressions: [ Expression ]
     */

    function SequenceExpression(expressions) {
      this.expressions = expressions;
      SequenceExpression.__super__.constructor.call(this);
    }

    return SequenceExpression;

  })(Expression);

  JavaScriptVisitor.prototype.SequenceExpression = function(node) {
    node = this.Expression(node);
    node.expressions = this.visit(node.expressions);
    return node;
  };


  /*
   * A unary operator expression.
   */

  exports.UnaryExpression = UnaryExpression = (function(superClass) {
    extend(UnaryExpression, superClass);


    /*
     * @operator: "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
     * @prefix: boolean
     * @argument: Expression
     */

    function UnaryExpression(operator, prefix, argument) {
      this.operator = operator;
      this.prefix = prefix;
      this.argument = argument;
      UnaryExpression.__super__.constructor.call(this);
    }

    return UnaryExpression;

  })(Expression);

  JavaScriptVisitor.prototype.UnaryExpression = function(node) {
    node = this.Expression(node);
    node.argument = this.visit(node.argument);
    return node;
  };


  /*
   * A binary operator expression.
   */

  exports.BinaryExpression = BinaryExpression = (function(superClass) {
    extend(BinaryExpression, superClass);


    /*
     * @operator: "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">="
     *     | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%"
     *     | "|" | "&" | "^" | "in" | "instanceof" | ".."
     * @left: Expression
     * @right: Expression
     */

    function BinaryExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      BinaryExpression.__super__.constructor.call(this);
    }

    return BinaryExpression;

  })(Expression);

  JavaScriptVisitor.prototype.BinaryExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };


  /*
   * An assignment operator expression.
   */

  exports.AssignmentExpression = AssignmentExpression = (function(superClass) {
    extend(AssignmentExpression, superClass);


    /*
     * @operator: "=" | "+=" | "-=" | "*=" | "/=" | "%="
     *     | "<<=" | ">>=" | ">>>=" | "|=" | "^=" | "&=";
     * @left: Expression
     * @right: Expression
     */

    function AssignmentExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      AssignmentExpression.__super__.constructor.call(this);
    }

    return AssignmentExpression;

  })(Expression);

  JavaScriptVisitor.prototype.AssignmentExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };


  /*
   * An update (increment or decrement) operator expression.
   */

  exports.UpdateExpression = UpdateExpression = (function(superClass) {
    extend(UpdateExpression, superClass);


    /*
     * @operator: "++" | "--"
     * @argument: Expression
     * @prefix: boolean
     */

    function UpdateExpression(operator, argument, prefix) {
      this.operator = operator;
      this.argument = argument;
      this.prefix = prefix;
      UpdateExpression.__super__.constructor.call(this);
    }

    return UpdateExpression;

  })(Expression);

  JavaScriptVisitor.prototype.UpdateExpression = function(node) {
    node = this.Expression(node);
    node.argument = this.visit(node.argument);
    return node;
  };


  /*
   * A logical operator expression.
   */

  exports.LogicalExpression = LogicalExpression = (function(superClass) {
    extend(LogicalExpression, superClass);


    /*
     * @operator: "||" | "&&"
     * @left: Expression
     * @right: Expression
     */

    function LogicalExpression(operator, left, right) {
      this.operator = operator;
      this.left = left;
      this.right = right;
      LogicalExpression.__super__.constructor.call(this);
    }

    return LogicalExpression;

  })(Expression);

  JavaScriptVisitor.prototype.LogicalExpression = function(node) {
    node = this.Expression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };


  /*
   * A conditional expression, i.e., a ternary ?/: expression.
   */

  exports.ConditionalExpression = ConditionalExpression = (function(superClass) {
    extend(ConditionalExpression, superClass);


    /*
     * @test: Expression
     * @alternate: Expression
     * @consequent: Expression
     */

    function ConditionalExpression(test, alternate, consequent) {
      this.test = test;
      this.alternate = alternate;
      this.consequent = consequent;
      ConditionalExpression.__super__.constructor.call(this);
    }

    return ConditionalExpression;

  })(Expression);

  JavaScriptVisitor.prototype.ConditionalExpression = function(node) {
    node = this.Expression(node);
    node.test = this.visit(node.test);
    node.alternate = this.visit(node.alternate);
    node.consequent = this.visit(node.consequent);
    return node;
  };


  /*
   * A new expression.
   */

  exports.NewExpression = NewExpression = (function(superClass) {
    extend(NewExpression, superClass);


    /*
     * @callee: Expression
     * @arguments: [ Expression ] | null
     */

    function NewExpression(callee, _arguments) {
      this.callee = callee;
      this["arguments"] = _arguments;
      NewExpression.__super__.constructor.call(this);
    }

    return NewExpression;

  })(Expression);

  JavaScriptVisitor.prototype.NewExpression = function(node) {
    node = this.Expression(node);
    node.callee = this.visit(node.callee);
    node["arguments"] = this.visit(node["arguments"]);
    return node;
  };


  /*
   * A function or method call expression.
   */

  exports.CallExpression = CallExpression = (function(superClass) {
    extend(CallExpression, superClass);


    /*
     * @callee: Expression
     * @arguments: [ Expression ]
     */

    function CallExpression(callee, _arguments) {
      this.callee = callee;
      this["arguments"] = _arguments;
      CallExpression.__super__.constructor.call(this);
    }

    return CallExpression;

  })(Expression);

  JavaScriptVisitor.prototype.CallExpression = function(node) {
    node = this.Expression(node);
    node.callee = this.visit(node.callee);
    node["arguments"] = this.visit(node["arguments"]);
    return node;
  };


  /*
   * A member expression. If computed === true, the node corresponds to a computed
   * e1[e2] expression and property is an Expression. If computed === false, the
   * node corresponds to a static e1.x expression and property is an Identifier.
   */

  exports.MemberExpression = MemberExpression = (function(superClass) {
    extend(MemberExpression, superClass);


    /*
     * @object: Expression
     * @property: Identifier | Expression
     * @computed : boolean
     */

    function MemberExpression(object, property, computed) {
      this.object = object;
      this.property = property;
      this.computed = computed;
      MemberExpression.__super__.constructor.call(this);
    }

    return MemberExpression;

  })(Expression);

  JavaScriptVisitor.prototype.MemberExpression = function(node) {
    node = this.Expression(node);
    node.object = this.visit(node.object);
    node.property = this.visit(node.property);
    return node;
  };


  /*
   * JavaScript 1.7 introduced destructuring assignment and binding forms.  All
   * binding forms (such as function parameters, variable declarations, and catch
   * block headers), accept array and object destructuring patterns in addition to
   * plain identifiers. The left-hand sides of assignment expressions can be
   * arbitrary expressions, but in the case where the expression is an object or
   * array literal, it is interpreted by SpiderMonkey as a destructuring pattern.
   *
   * Since the left-hand side of an assignment can in general be any expression, in
   * an assignment context, a pattern can be any expression. In binding positions
   * (such as function parameters, variable declarations, and catch headers),
   * patterns can only be identifiers in the base case, not arbitrary expressions.
   */

  exports.Pattern = Pattern = (function(superClass) {
    extend(Pattern, superClass);

    function Pattern() {
      Pattern.__super__.constructor.call(this);
    }

    return Pattern;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Pattern = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };


  /*
   * An object-destructuring pattern. A literal property in an object pattern can
   * have either a string or number as its value.
   */

  exports.ObjectPattern = ObjectPattern = (function(superClass) {
    extend(ObjectPattern, superClass);


    /*
     * @properties: [ { key: Literal | Identifier, value: Pattern } ]
     */

    function ObjectPattern(properties) {
      this.properties = properties;
      ObjectPattern.__super__.constructor.call(this);
    }

    return ObjectPattern;

  })(Pattern);

  JavaScriptVisitor.prototype.ObjectPattern = function(node) {
    var i, len, ref1, setter;
    node = this.Pattern(node);
    ref1 = node.properties;
    for (i = 0, len = ref1.length; i < len; i++) {
      setter = ref1[i];
      setter.key = this.visit(setter.key);
      setter.value = this.visit(setter.value);
    }
    return node;
  };


  /*
   * An array-destructuring pattern.
   */

  exports.ArrayPattern = ArrayPattern = (function(superClass) {
    extend(ArrayPattern, superClass);


    /*
     * @elements: [ Pattern | null ]
     */

    function ArrayPattern(elements) {
      this.elements = elements;
      ArrayPattern.__super__.constructor.call(this);
    }

    return ArrayPattern;

  })(Pattern);

  JavaScriptVisitor.prototype.ArrayPattern = function(node) {
    node = this.Pattern(node);
    node.elements = this.visit(node.elements);
    return node;
  };


  /*
   * A case (if test is an Expression) or default (if test === null) clause in the
   * body of a switch statement.
   */

  exports.SwitchCase = SwitchCase = (function(superClass) {
    extend(SwitchCase, superClass);


    /*
     * @test: Expression | null
     * @consequent: [ Statement ]
     */

    function SwitchCase(test, consequent) {
      this.test = test;
      this.consequent = consequent;
      SwitchCase.__super__.constructor.call(this);
    }

    return SwitchCase;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.SwitchCase = function(node) {
    node = this.JavaScriptNode(node);
    node.test = this.visit(node.test);
    node.consequent = this.visit(node.consequent);
    return node;
  };


  /*
   * A catch clause following a try block. The optional guard property corresponds
   * to the optional expression guard on the bound variable.
   */

  exports.CatchClause = CatchClause = (function(superClass) {
    extend(CatchClause, superClass);


    /*
     * @param: Pattern
     * @body: BlockStatement
     */

    function CatchClause(param, body) {
      this.param = param;
      this.body = body;
      CatchClause.__super__.constructor.call(this);
    }

    return CatchClause;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.CatchClause = function(node) {
    node = this.JavaScriptNode(node);
    node.param = this.visit(node.param);
    node.body = this.visit(node.body);
    return node;
  };


  /*
   * An identifier. Note that an identifier may be an expression or a destructuring
   * pattern.
   */

  exports.Identifier = Identifier = (function(superClass) {
    extend(Identifier, superClass);


    /*
     * @name: string
     */

    function Identifier(name) {
      this.name = name;
      Identifier.__super__.constructor.call(this);
    }

    return Identifier;

  })(JavaScriptNode);

  JavaScriptVisitor.prototype.Identifier = function(node) {
    node = this.JavaScriptNode(node);
    return node;
  };


  /*
   * A literal token. Note that a literal can be an expression.
   */

  exports.Literal = Literal = (function(superClass) {
    extend(Literal, superClass);


    /*
     * @value: string | boolean | null | number | RegExp
     */

    function Literal(value) {
      this.value = value;
      Literal.__super__.constructor.call(this);
    }

    return Literal;

  })(Expression);

  JavaScriptVisitor.prototype.Literal = function(node) {
    node = this.Expression(node);
    return node;
  };

}).call(this);

},{"./Node":16}],15:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var JS, JavaScriptToQueryVisitor, Q, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = _dereq_('./Utilities');

  JS = _dereq_('./JavaScriptNodes');

  Q = _dereq_('./QueryNodes');


  /*
   * Walk the JavaScriptExpression tree and convert its nodes into QueryExpression
   * trees
   */

  exports.JavaScriptToQueryVisitor = JavaScriptToQueryVisitor = (function(superClass) {
    extend(JavaScriptToQueryVisitor, superClass);

    function JavaScriptToQueryVisitor(context) {
      this.context = context;
    }


    /* Get the source code for a given node */

    JavaScriptToQueryVisitor.prototype.getSource = function(node) {
      var ref, ref1;
      return this.context.source.slice(node != null ? (ref = node.range) != null ? ref[0] : void 0 : void 0, +((node != null ? (ref1 = node.range) != null ? ref1[1] : void 0 : void 0) - 1) + 1 || 9e9);
    };


    /* Throw an exception for an invalid node. */

    JavaScriptToQueryVisitor.prototype.invalid = function(node) {
      throw "The expression '" + (this.getSource(node)) + "'' is not supported.";
    };


    /* Unary expressions just map operators */

    JavaScriptToQueryVisitor.prototype.translateUnary = function(node, mapping) {
      var op, value;
      op = mapping[node.operator];
      if (op) {
        value = this.visit(node.argument);
        return new Q.UnaryExpression(op, value);
      } else {
        return null;
      }
    };


    /* Binary expressions just map operators */

    JavaScriptToQueryVisitor.prototype.translateBinary = function(node, mapping) {
      var left, op, right;
      op = mapping[node.operator];
      if (op) {
        left = this.visit(node.left);
        right = this.visit(node.right);
        return new Q.BinaryExpression(op, left, right);
      } else {
        return null;
      }
    };


    /*
     * The base visit method will throw exceptions for any nodes that remain
     * untransformed (which allows us to only bother defining meaningful
     * translations)
     */

    JavaScriptToQueryVisitor.prototype.visit = function(node) {
      var visited;
      visited = JavaScriptToQueryVisitor.__super__.visit.call(this, node);
      if (node === visited) {
        this.invalid(node);
      }
      return visited;
    };

    JavaScriptToQueryVisitor.prototype.MemberExpression = function(node) {
      var expr;
      expr = (function() {
        var ref, ref1, ref2, ref3;
        if ((node != null ? (ref = node.object) != null ? ref.type : void 0 : void 0) === 'ThisExpression' && (node != null ? (ref1 = node.property) != null ? ref1.type : void 0 : void 0) === 'Identifier') {

          /* Simple member access */
          return new Q.MemberExpression(node.property.name);
        } else if ((node != null ? (ref2 = node.object) != null ? ref2.type : void 0 : void 0) === 'MemberExpression' && ((ref3 = node.object.object) != null ? ref3.type : void 0) === 'ThisExpression' && node.property.type === 'Identifier') {

          /* Methods that look like properties */
          if (node.property.name === 'length') {
            return new Q.InvocationExpression(Q.Methods.Length, new Q.MemberExpression(node.object.property.name));
          }
        }
      })();
      return expr != null ? expr : JavaScriptToQueryVisitor.__super__.MemberExpression.call(this, node);
    };

    JavaScriptToQueryVisitor.prototype.Literal = function(node) {
      return new Q.ConstantExpression(node.value);
    };

    JavaScriptToQueryVisitor.prototype.UnaryExpression = function(node) {
      var mapping, ref;
      if (node.operator === '+') {

        /* Ignore the + in '+52' */
        return this.visit(node.argument);
      } else {
        mapping = {
          '!': Q.UnaryOperators.Not,
          '-': Q.UnaryOperators.Negate
        };
        return (ref = this.translateUnary(node, mapping)) != null ? ref : JavaScriptToQueryVisitor.__super__.UnaryExpression.call(this, node);
      }
    };

    JavaScriptToQueryVisitor.prototype.UpdateExpression = function(node) {
      var mapping, ref;
      mapping = {
        '++': Q.UnaryOperators.Increment,
        '--': Q.UnaryOperators.Decrement
      };
      return (ref = this.translateUnary(node, mapping)) != null ? ref : JavaScriptToQueryVisitor.__super__.UpdateExpression.call(this, node);
    };

    JavaScriptToQueryVisitor.prototype.LogicalExpression = function(node) {
      var mapping, ref;
      mapping = {
        '&&': Q.BinaryOperators.And,
        '||': Q.BinaryOperators.Or
      };
      return (ref = this.translateBinary(node, mapping)) != null ? ref : JavaScriptToQueryVisitor.__super__.LogicalExpression.call(this, node);
    };

    JavaScriptToQueryVisitor.prototype.BinaryExpression = function(node) {
      var k, left, mapping, properties, ref, v, value;
      mapping = {
        '+': Q.BinaryOperators.Add,
        '-': Q.BinaryOperators.Subtract,
        '*': Q.BinaryOperators.Multiply,
        '/': Q.BinaryOperators.Divide,
        '%': Q.BinaryOperators.Modulo,
        '>': Q.BinaryOperators.GreaterThan,
        '>=': Q.BinaryOperators.GreaterThanOrEqual,
        '<': Q.BinaryOperators.LessThan,
        '<=': Q.BinaryOperators.LessThanOrEqual,
        '!=': Q.BinaryOperators.NotEqual,
        '!==': Q.BinaryOperators.NotEqual,
        '==': Q.BinaryOperators.Equal,
        '===': Q.BinaryOperators.Equal
      };
      return (function() {
        var ref1, ref2;
        if ((ref = this.translateBinary(node, mapping)) != null) {
          return ref;
        } else if (node.operator === 'in' && ((ref1 = node.right) != null ? ref1.type : void 0) === 'Literal' && _.isArray((ref2 = node.right) != null ? ref2.value : void 0)) {

          /*
           * Transform the 'varName in [x, y, z]' operator into a series of
           * comparisons like varName == x || varName == y || varName == z.
           */
          if (node.right.value.length > 0) {
            left = this.visit(node.left);
            return Q.QueryExpression.groupClauses(Q.BinaryOperators.Or, (function() {
              var i, len, ref3, results;
              ref3 = node.right.value;
              results = [];
              for (i = 0, len = ref3.length; i < len; i++) {
                value = ref3[i];

                /*
                 * If we've got an array of objects who each have
                 * a single property, we'll use the value of that
                 * property.  Otherwise we'll throw an exception.
                 */
                if (_.isObject(value)) {
                  properties = (function() {
                    var results1;
                    results1 = [];
                    for (k in value) {
                      v = value[k];
                      results1.push(v);
                    }
                    return results1;
                  })();
                  if ((properties != null ? properties.length : void 0) !== 1) {
                    throw "in operator requires comparison objects with a single field, not " + value + " (" + (JSON.stringify(value)) + "), for expression '" + (this.getSource(node)) + "'";
                  }
                  value = properties[0];
                }
                results.push(new Q.BinaryExpression(Q.BinaryOperators.Equal, left, new Q.ConstantExpression(value)));
              }
              return results;
            }).call(this));
          } else {

            /*
             * If the array of values is empty, change the query to
             * true == false since it can't be satisfied.
             */
            return new Q.BinaryExpression(Q.BinaryOperators.Equal, new Q.ConstantExpression(true), new Q.ConstantExpression(false));
          }
        } else {
          return JavaScriptToQueryVisitor.__super__.BinaryExpression.call(this, node);
        }
      }).call(this);
    };

    JavaScriptToQueryVisitor.prototype.CallExpression = function(node) {
      var expr, func, getSingleArg, getTwoArgs, member, method, ref;
      getSingleArg = (function(_this) {
        return function(name) {
          var ref;
          if (((ref = node["arguments"]) != null ? ref.length : void 0) !== 1) {
            throw "Function " + name + " expects one argument in expression '" + (_this.getSource(node)) + "'";
          }
          return _this.visit(node["arguments"][0]);
        };
      })(this);
      getTwoArgs = (function(_this) {
        return function(member, name) {
          var ref;
          if (((ref = node["arguments"]) != null ? ref.length : void 0) !== 2) {
            throw "Function " + name + " expects two arguments in expression '" + (_this.getSource(node)) + "'";
          }
          return [member, _this.visit(node["arguments"][0]), _this.visit(node["arguments"][1])];
        };
      })(this);

      /*
       * Translate known method calls that aren't attached to an instance.
       * Note that we can compare against the actual method because the
       * partial evaluator will have converted it into a literal for us.
       */
      func = node != null ? (ref = node.callee) != null ? ref.value : void 0 : void 0;
      expr = (function() {
        var ref1, ref2, ref3, ref4, ref5, ref6, ref7;
        if (func === Math.floor) {
          return new Q.InvocationExpression(Q.Methods.Floor, [getSingleArg('floor')]);
        } else if (func === Math.ceil) {
          return new Q.InvocationExpression(Q.Methods.Ceiling, [getSingleArg('ceil')]);
        } else if (func === Math.round) {
          return new Q.InvocationExpression(Q.Methods.Round, [getSingleArg('round')]);
        } else {

          /*
           * Translate methods dangling off an instance
           */
          if (node.callee.type === 'MemberExpression' && ((ref1 = node.callee.object) != null ? ref1.__hasThisExp : void 0) === true) {
            if ((node != null ? (ref2 = node.callee) != null ? (ref3 = ref2.object) != null ? ref3.type : void 0 : void 0 : void 0) === 'CallExpression') {
              member = this.visit(node.callee.object);
            } else {
              member = new Q.MemberExpression((ref4 = node.callee.object) != null ? (ref5 = ref4.property) != null ? ref5.name : void 0 : void 0);
            }
            method = (ref6 = node.callee) != null ? (ref7 = ref6.property) != null ? ref7.name : void 0 : void 0;
            if (method === 'toUpperCase') {
              return new Q.InvocationExpression(Q.Methods.ToUpperCase, [member]);
            } else if (method === 'toLowerCase') {
              return new Q.InvocationExpression(Q.Methods.ToLowerCase, [member]);
            } else if (method === 'trim') {
              return new Q.InvocationExpression(Q.Methods.Trim, [member]);
            } else if (method === 'indexOf') {
              return new Q.InvocationExpression(Q.Methods.IndexOf, [member, getSingleArg('indexOf')]);
            } else if (method === 'concat') {
              return new Q.InvocationExpression(Q.Methods.Concat, [member, getSingleArg('concat')]);
            } else if (method === 'substring' || method === 'substr') {
              return new Q.InvocationExpression(Q.Methods.Substring, getTwoArgs(member, 'substring'));
            } else if (method === 'replace') {
              return new Q.InvocationExpression(Q.Methods.Replace, getTwoArgs(member, 'replace'));
            } else if (method === 'getFullYear' || method === 'getUTCFullYear') {
              return new Q.InvocationExpression(Q.Methods.Year, [member]);
            } else if (method === 'getYear') {
              return new Q.BinaryExpression(Q.BinaryOperators.Subtract, new Q.InvocationExpression(Q.Methods.Year, [member]), new Q.ConstantExpression(1900));
            } else if (method === 'getMonth' || method === 'getUTCMonth') {

              /* getMonth is 0 indexed in JavaScript */
              return new Q.BinaryExpression(Q.BinaryOperators.Subtract, new Q.InvocationExpression(Q.Methods.Month, [member]), new Q.ConstantExpression(1));
            } else if (method === 'getDate' || method === 'getUTCDate') {
              return new Q.InvocationExpression(Q.Methods.Day, [member]);
            }
          }
        }
      }).call(this);
      return expr != null ? expr : JavaScriptToQueryVisitor.__super__.CallExpression.call(this, node);
    };

    return JavaScriptToQueryVisitor;

  })(JS.JavaScriptVisitor);

}).call(this);

},{"./JavaScriptNodes":14,"./QueryNodes":20,"./Utilities":21}],16:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var Node, Visitor, _;

  _ = _dereq_('./Utilities');


  /*
   * The base Node class for all expressions used for analysis and translation by
   * visitors.  It's designed to interop with other modules that create expression
   * trees using object literals with a type tag.
   */

  exports.Node = Node = (function() {

    /*
     * Type tag of the node that allows for eash dispatch in visitors.  This is
     * automatically set in the constructor (so it's important to call super() in
     * derived Node classes).
     */
    Node.prototype.type = 'Node';


    /*
     * Initializes a new instance of the Node class and sets its type tag.
     */

    function Node() {
      this.type = _.functionName(this.constructor);
    }

    return Node;

  })();


  /*
   * Base class for all visitors
   */

  exports.Visitor = Visitor = (function() {
    function Visitor() {}


    /*
     * Visit a node.
     */

    Visitor.prototype.visit = function(node) {
      var element, i, len, results;
      if (_.isArray(node)) {
        results = [];
        for (i = 0, len = node.length; i < len; i++) {
          element = node[i];
          results.push(this.visit(element));
        }
        return results;
      } else if (!(node != null ? node.type : void 0)) {
        return node;
      } else if (!_.isFunction(this[node.type])) {
        throw "Unsupported expression " + (this.getSource(node));
      } else {
        return this[node.type](node);
      }
    };


    /*
     * Get the source code corresponding to a node.
     */

    Visitor.prototype.getSource = function(node) {

      /* It is expected this will be overridden in derived visitors. */
      return null;
    };

    return Visitor;

  })();

}).call(this);

},{"./Utilities":21}],17:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var ODataFilterQueryVisitor, ODataProvider, Q, Query, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = _dereq_('./Utilities');

  Q = _dereq_('./QueryNodes');

  Query = _dereq_('./Query').Query;

  exports.ODataProvider = ODataProvider = (function() {
    function ODataProvider() {}


    /*
     * Convert a query into an OData URI.
     */

    ODataProvider.prototype.toQuery = function(query) {
      var odata, s, url;
      odata = this.toOData(query, true);
      url = "/" + odata.table;
      s = '?';
      if (odata.filters) {
        url += s + "$filter=" + odata.filters;
        s = '&';
      }
      if (odata.orderClauses) {
        url += s + "$orderby=" + odata.orderClauses;
        s = '&';
      }
      if (odata.skip) {
        url += s + "$skip=" + odata.skip;
        s = '&';
      }
      if (odata.take || odata.take === 0) {
        url += s + "$top=" + odata.take;
        s = '&';
      }
      if (odata.selections) {
        url += s + "$select=" + odata.selections;
        s = '&';
      }
      if (odata.includeTotalCount) {
        url += s + "$inlinecount=allpages";
      }
      if (odata.includeDeleted) {
        url += s + "__includeDeleted=true";
      }
      return url;
    };


    /*
     * Translate the query components into OData strings
     */

    ODataProvider.prototype.toOData = function(query, encodeForUri) {
      var asc, components, name, odata, order, orderClauses, ordering, ref, ref1;
      if (encodeForUri == null) {
        encodeForUri = false;
      }
      components = (ref = query != null ? query.getComponents() : void 0) != null ? ref : {};
      ordering = (function() {
        var ref1, results;
        ref1 = components != null ? components.ordering : void 0;
        results = [];
        for (name in ref1) {
          asc = ref1[name];
          results.push(asc ? name : name + " desc");
        }
        return results;
      })();
      orderClauses = (function() {
        var i, len, ref1, results;
        ref1 = components != null ? components.orderClauses : void 0;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          order = ref1[i];
          results.push(order.ascending ? order.name : order.name + " desc");
        }
        return results;
      })();
      return odata = {
        table: components != null ? components.table : void 0,
        filters: ODataFilterQueryVisitor.convert(components.filters, encodeForUri),
        ordering: ordering != null ? ordering.toString() : void 0,
        orderClauses: orderClauses != null ? orderClauses.toString() : void 0,
        skip: components != null ? components.skip : void 0,
        take: components != null ? components.take : void 0,
        selections: components != null ? (ref1 = components.selections) != null ? ref1.toString() : void 0 : void 0,
        includeTotalCount: components != null ? components.includeTotalCount : void 0,
        includeDeleted: components != null ? components.includeDeleted : void 0
      };
    };


    /*
     * Convert OData components into a query object
     */

    ODataProvider.prototype.fromOData = function(table, filters, ordering, skip, take, selections, includeTotalCount, includeDeleted) {
      var direction, field, i, item, j, len, len1, query, ref, ref1, ref2, ref3;
      query = new Query(table);
      if (filters) {
        query.where(filters);
      }
      if (skip || skip === 0) {
        query.skip(skip);
      }
      if (take || take === 0) {
        query.take(take);
      }
      if (includeTotalCount) {
        query.includeTotalCount();
      }
      if (includeDeleted) {
        query.includeDeleted();
      }
      ref1 = (ref = selections != null ? selections.split(',') : void 0) != null ? ref : [];
      for (i = 0, len = ref1.length; i < len; i++) {
        field = ref1[i];
        query.select(field.trim());
      }
      ref2 = (function() {
        var k, len1, ref2, ref3, results;
        ref3 = (ref2 = ordering != null ? ordering.split(',') : void 0) != null ? ref2 : [];
        results = [];
        for (k = 0, len1 = ref3.length; k < len1; k++) {
          item = ref3[k];
          results.push(item.trim().split(' '));
        }
        return results;
      })();
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        ref3 = ref2[j], field = ref3[0], direction = ref3[1];
        if ((direction != null ? direction.toUpperCase() : void 0) !== 'DESC') {
          query.orderBy(field);
        } else {
          query.orderByDescending(field);
        }
      }
      return query;
    };

    return ODataProvider;

  })();


  /*
   * Visitor that converts query expression trees into OData filter statements.
   */

  ODataFilterQueryVisitor = (function(superClass) {
    extend(ODataFilterQueryVisitor, superClass);

    function ODataFilterQueryVisitor(encodeForUri1) {
      this.encodeForUri = encodeForUri1;
    }

    ODataFilterQueryVisitor.convert = function(filters, encodeForUri) {
      var ref, visitor;
      visitor = new ODataFilterQueryVisitor(encodeForUri);
      return (ref = (filters ? visitor.visit(filters) : void 0)) != null ? ref : null;
    };

    ODataFilterQueryVisitor.prototype.toOData = function(value) {
      var text;
      if ((_.isNumber(value)) || (_.isBoolean(value))) {
        return value.toString();
      } else if (_.isString(value)) {
        value = value.replace(/'/g, "''");
        if ((this.encodeForUri != null) && this.encodeForUri === true) {
          value = encodeURIComponent(value);
        }
        return "'" + value + "'";
      } else if (_.isDate(value)) {

        /*
         * Dates are expected in the format
         *   "datetime'yyyy-mm-ddThh:mm[:ss[.fffffff]]'"
         * which JSON.stringify gives us by default
         */
        text = JSON.stringify(value);
        if (text.length > 2) {
          text = text.slice(1, +(text.length - 2) + 1 || 9e9);
        }
        text = text.replace(/(T\d{2}:\d{2}:\d{2})Z$/, function(all, time) {
          var msec;
          msec = String(value.getMilliseconds() + 1000).substring(1);
          return time + "." + msec + "Z";
        });
        return "datetime'" + text + "'";
      } else if (!value) {
        return "null";
      } else {
        throw "Unsupported literal value " + value;
      }
    };

    ODataFilterQueryVisitor.prototype.ConstantExpression = function(node) {
      return this.toOData(node.value);
    };

    ODataFilterQueryVisitor.prototype.MemberExpression = function(node) {
      return node.member;
    };

    ODataFilterQueryVisitor.prototype.UnaryExpression = function(node) {
      if (node.operator === Q.UnaryOperators.Not) {
        return "not " + (this.visit(node.operand));
      } else if (node.operator === Q.UnaryOperators.Negate) {
        return "(0 sub " + (this.visit(node.operand)) + ")";
      } else {
        throw "Unsupported operator " + node.operator;
      }
    };

    ODataFilterQueryVisitor.prototype.BinaryExpression = function(node) {
      var mapping, op;
      mapping = {
        And: 'and',
        Or: 'or',
        Add: 'add',
        Subtract: 'sub',
        Multiply: 'mul',
        Divide: 'div',
        Modulo: 'mod',
        GreaterThan: 'gt',
        GreaterThanOrEqual: 'ge',
        LessThan: 'lt',
        LessThanOrEqual: 'le',
        NotEqual: 'ne',
        Equal: 'eq'
      };
      op = mapping[node.operator];
      if (op) {
        return "(" + (this.visit(node.left)) + " " + op + " " + (this.visit(node.right)) + ")";
      } else {
        throw "Unsupported operator " + node.operator;
      }
    };

    ODataFilterQueryVisitor.prototype.InvocationExpression = function(node) {
      var mapping, method;
      mapping = {
        Length: 'length',
        ToUpperCase: 'toupper',
        ToLowerCase: 'tolower',
        Trim: 'trim',
        IndexOf: 'indexof',
        Replace: 'replace',
        Substring: 'substring',
        Concat: 'concat',
        Day: 'day',
        Month: 'month',
        Year: 'year',
        Floor: 'floor',
        Ceiling: 'ceiling',
        Round: 'round'
      };
      method = mapping[node.method];
      if (method) {
        return method + "(" + (this.visit(node.args)) + ")";
      } else {
        throw "Invocation of unsupported method " + node.method;
      }
    };

    ODataFilterQueryVisitor.prototype.LiteralExpression = function(node) {
      var ch, i, inString, len, literal, parenBalance, ref;
      literal = '';
      parenBalance = 0;
      inString = false;
      ref = node.queryString;
      for (i = 0, len = ref.length; i < len; i++) {
        ch = ref[i];
        if (parenBalance < 0) {
          break;
        } else if (inString) {
          literal += ch;
          inString = ch !== "'";
        } else if (ch === '?') {
          if ((!node.args) || (node.args.length <= 0)) {
            throw "Too few arguments for " + node.queryString + ".";
          }
          literal += this.toOData(node.args.shift());
        } else if (ch === "'") {
          literal += ch;
          inString = true;
        } else if (ch === '(') {
          parenBalance += 1;
          literal += ch;
        } else if (ch === ')') {
          parenBalance -= 1;
          literal += ch;
        } else {
          literal += ch;
        }
      }
      if (node.args && node.args.length > 0) {
        throw "Too many arguments for " + node.queryString;
      }
      if (parenBalance !== 0) {
        throw "Unbalanced parentheses in " + node.queryString;
      }
      if (literal.trim().length > 0) {
        return "(" + literal + ")";
      } else {
        return literal;
      }
    };

    return ODataFilterQueryVisitor;

  })(Q.QueryExpressionVisitor);

}).call(this);

},{"./Query":19,"./QueryNodes":20,"./Utilities":21}],18:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var IndependenceNominator, JS, PartialEvaluator, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = _dereq_('./Utilities');

  JS = _dereq_('./JavaScriptNodes');


  /*
   * Partially evaluate a complex expression in the context of its environment.
   * This allows us to support arbitrary JavaScript expressions even though we
   * only explicitly transform a subset of expressions into QueryExpressions.
   *
   * For example, assuming we have an expression like (x) -> @id == x + 1 with an
   * environment where x == 12, then the entire right hand side of the comparison
   * is independent of any values computed by the query and could be replaced with
   * the literal value 13.
   */

  exports.PartialEvaluator = PartialEvaluator = (function(superClass) {
    extend(PartialEvaluator, superClass);

    function PartialEvaluator(context1) {
      this.context = context1;
    }

    PartialEvaluator.prototype.visit = function(node) {
      var key, params, ref, ref1, ref2, ref3, source, thunk, value, values;
      if (!node.__independent || node.type === 'Literal' || (!node.type)) {

        /*
         * If the node isn't independent or it's already a literal, then
         * just keep walking the tree
         */
        return PartialEvaluator.__super__.visit.call(this, node);
      } else {

        /*
         * Otherwse we'll evaluate the node in the context of the
         * environment by either looking up identifiers directly or
         * evaluating whole sub expressions
         */
        if (node.type === 'Identifier' && this.context.environment[node.name]) {
          return new JS.Literal(this.context.environment[node.name]);
        } else {

          /*
           * Evaluate the source of the sub expression in the context
           * of the environment
           */
          source = this.context.source.slice(node != null ? (ref = node.range) != null ? ref[0] : void 0 : void 0, +((node != null ? (ref1 = node.range) != null ? ref1[1] : void 0 : void 0) - 1) + 1 || 9e9);
          params = (ref2 = (function() {
            var ref3, results;
            ref3 = this.context.environment;
            results = [];
            for (key in ref3) {
              value = ref3[key];
              results.push(key);
            }
            return results;
          }).call(this)) != null ? ref2 : [];
          values = (ref3 = (function() {
            var ref4, results;
            ref4 = this.context.environment;
            results = [];
            for (key in ref4) {
              value = ref4[key];
              results.push(JSON.stringify(value));
            }
            return results;
          }).call(this)) != null ? ref3 : [];
          thunk = "(function(" + params + ") { return " + source + "; })(" + values + ")";
          value = eval(thunk);
          return new JS.Literal(value);
        }
      }
    };

    PartialEvaluator.evaluate = function(context) {
      var evaluator, nominator;
      nominator = new IndependenceNominator(context);
      nominator.visit(context.expression);
      evaluator = new PartialEvaluator(context);
      return evaluator.visit(context.expression);
    };

    return PartialEvaluator;

  })(JS.JavaScriptVisitor);


  /*
   * Nominate independent nodes in an expression tree that don't depend on any
   * server side values.
   */

  exports.IndependenceNominator = IndependenceNominator = (function(superClass) {
    extend(IndependenceNominator, superClass);

    function IndependenceNominator(context1) {
      this.context = context1;
    }

    IndependenceNominator.prototype.Literal = function(node) {
      IndependenceNominator.__super__.Literal.call(this, node);
      node.__independent = true;
      node.__hasThisExp = false;
      return node;
    };

    IndependenceNominator.prototype.ThisExpression = function(node) {
      IndependenceNominator.__super__.ThisExpression.call(this, node);
      node.__independent = false;
      node.__hasThisExp = true;
      return node;
    };

    IndependenceNominator.prototype.Identifier = function(node) {
      IndependenceNominator.__super__.Identifier.call(this, node);
      node.__independent = true;
      node.__hasThisExp = false;
      return node;
    };

    IndependenceNominator.prototype.MemberExpression = function(node) {
      var ref;
      IndependenceNominator.__super__.MemberExpression.call(this, node);

      /*
       * Undo independence of identifiers when they're members of this.* or
       * this.member.* (the latter allows for member functions)
       */
      node.__hasThisExp = (ref = node.object) != null ? ref.__hasThisExp : void 0;
      if (node.__hasThisExp) {
        node.__independent = false;
        if (node != null) {
          node.property.__independent = false;
        }
      }
      return node;
    };

    IndependenceNominator.prototype.CallExpression = function(node) {
      IndependenceNominator.__super__.CallExpression.call(this, node);
      node.__hasThisExp = node.callee.__hasThisExp;
      return node;
    };

    IndependenceNominator.prototype.ObjectExpression = function(node) {
      var i, independence, j, len, len1, ref, ref1, setter;
      IndependenceNominator.__super__.ObjectExpression.call(this, node);

      /*
       * Prevent literal key identifiers from being evaluated out of
       * context
       */
      ref = node.properties;
      for (i = 0, len = ref.length; i < len; i++) {
        setter = ref[i];
        setter.key.__independent = false;
      }

      /*
       * An object literal is independent if all of its values are
       * independent
       */
      independence = true;
      ref1 = node.properties;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        setter = ref1[j];
        independence &= setter.value.__independent;
      }
      node.__independent = independence ? true : false;
      return node;
    };

    IndependenceNominator.prototype.visit = function(node) {

      /*
       * Call the base visit method which will both visit all of our
       * subexpressions and also call the couple of overrides above which
       * handle the base independence cases
       */
      var i, independence, isIndependent, len, name, v, value;
      IndependenceNominator.__super__.visit.call(this, node);

      /*
       * If the node's independence wasn't determined automatically by the
       * base cases above, then it's independence is determined by checking
       * all of its values and aggregating their independence
       */
      if (!(Object.prototype.hasOwnProperty.call(node, '__independent'))) {
        independence = true;
        isIndependent = function(node) {
          var ref;
          if (_.isObject(node)) {
            return (ref = value.__independent) != null ? ref : false;
          } else {
            return true;
          }
        };
        for (name in node) {
          value = node[name];
          if (_.isArray(value)) {
            for (i = 0, len = value.length; i < len; i++) {
              v = value[i];
              independence &= isIndependent(v);
            }
          } else if (_.isObject(value)) {
            independence &= isIndependent(value);
          }
        }

        /* &= will turn true/false into 1/0 so we'll turn it back */
        node.__independent = independence ? true : false;
      }
      return node;
    };

    return IndependenceNominator;

  })(JS.JavaScriptVisitor);

}).call(this);

},{"./JavaScriptNodes":14,"./Utilities":21}],19:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */


/* Pull in references */

(function() {
  var JavaScript, ODataProvider, Q, Query, _,
    slice = [].slice;

  _ = _dereq_('./Utilities');

  Q = _dereq_('./QueryNodes');

  JavaScript = _dereq_('./JavaScript').JavaScript;


  /*
   * Define a query that can be translated into a desired query language and
   * executed remotely.
   */

  exports.Query = Query = (function() {
    function Query(table, context) {
      var _context, _filters, _includeDeleted, _includeTotalCount, _orderClauses, _ordering, _projection, _selections, _skip, _table, _take, _version;
      if (!table || !(_.isString(table))) {
        throw 'Expected the name of a table!';
      }

      /* Store the table name and any extra context */
      _table = table;
      _context = context;

      /* Private Query component members */
      _filters = null;
      _projection = null;
      _selections = [];
      _ordering = {};
      _orderClauses = [];
      _skip = null;
      _take = null;
      _includeTotalCount = false;
      _includeDeleted = false;

      /*
       * Keep a version flag that's updated on each mutation so we can
       * track whether changes have been made.  This is to enable caching
       * of compiled queries without reevaluating unless necessary.
       */
      _version = 0;

      /* Get the individual components of the query */
      this.getComponents = function() {
        return {
          filters: _filters,
          selections: _selections,
          projection: _projection,
          ordering: _ordering,
          orderClauses: _orderClauses,
          skip: _skip,
          take: _take,
          table: _table,
          context: _context,
          includeTotalCount: _includeTotalCount,
          includeDeleted: _includeDeleted,
          version: _version
        };
      };

      /*
       * Set the individual components of the query (this is primarily
       * meant to be used for rehydrating a query).
       */
      this.setComponents = function(components) {
        var ascending, i, len, name, property, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
        _version++;
        _filters = (ref = components != null ? components.filters : void 0) != null ? ref : null;
        _selections = (ref1 = components != null ? components.selections : void 0) != null ? ref1 : [];
        _projection = (ref2 = components != null ? components.projection : void 0) != null ? ref2 : null;
        _skip = (ref3 = components != null ? components.skip : void 0) != null ? ref3 : null;
        _take = (ref4 = components != null ? components.take : void 0) != null ? ref4 : null;
        _includeTotalCount = (ref5 = components != null ? components.includeTotalCount : void 0) != null ? ref5 : false;
        _includeDeleted = (ref6 = components != null ? components.includeDeleted : void 0) != null ? ref6 : false;
        _table = (ref7 = components != null ? components.table : void 0) != null ? ref7 : null;
        _context = (ref8 = components != null ? components.context : void 0) != null ? ref8 : null;
        if (components != null ? components.orderClauses : void 0) {
          _orderClauses = (ref9 = components != null ? components.orderClauses : void 0) != null ? ref9 : [];
          _ordering = {};
          for (i = 0, len = _orderClauses.length; i < len; i++) {
            ref10 = _orderClauses[i], name = ref10.name, ascending = ref10.ascending;
            _ordering[name] = ascending;
          }
        } else {
          _ordering = (ref11 = components != null ? components.ordering : void 0) != null ? ref11 : {};
          _orderClauses = [];
          for (property in _ordering) {
            _orderClauses.push({
              name: property,
              ascending: !!_ordering[property]
            });
          }
        }
        return this;
      };

      /*
       * Add a constraint to a query.  Constraints can take the form of
       * a function with a single return statement, key/value pairs of
       * equality comparisons, or provider-specific literal strings (note
       * that not all providers support literals).
       */
      this.where = function() {
        var args, constraint, expr, name, value;
        constraint = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        _version++;

        /*
         * Translate the constraint from its high level form into a
         * QueryExpression tree that can be manipulated by a query
         * provider
         */
        expr = (function() {
          if (_.isFunction(constraint)) {
            return JavaScript.transformConstraint(constraint, args);
          } else if (_.isObject(constraint)) {

            /*
             * Turn an object of key value pairs into a series of
             * equality expressions that are and'ed together to form
             * a single expression
             */
            return Q.QueryExpression.groupClauses(Q.BinaryOperators.And, (function() {
              var results;
              results = [];
              for (name in constraint) {
                value = constraint[name];
                results.push(expr = new Q.BinaryExpression(Q.BinaryOperators.Equal, new Q.MemberExpression(name), new Q.ConstantExpression(value)));
              }
              return results;
            })());
          } else if (_.isString(constraint)) {

            /*
             * Store the literal query along with any arguments for
             * providers that support basic string replacement (i.e.,
             * something like where('name eq ?', 'Steve'))
             */
            return new Q.LiteralExpression(constraint, args);
          } else {
            throw "Expected a function, object, or string, not " + constraint;
          }
        })();

        /* Merge the new filters with any existing filters */
        _filters = Q.QueryExpression.groupClauses(Q.BinaryOperators.And, [_filters, expr]);
        return this;
      };

      /*
       * Project the query results.  A projection can either be defined as
       * a set of fields that we'll pull back (instead of the entire row)
       * or a function that will transform a row into a new type.  If a
       * function is used, we'll analyze the function to pull back the
       * minimal number of fields required.
       */
      this.select = function() {
        var i, len, param, parameters, projectionOrParameter;
        projectionOrParameter = arguments[0], parameters = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        _version++;
        if (_.isString(projectionOrParameter)) {

          /* Add all the literal string parameters */
          _selections.push(projectionOrParameter);
          for (i = 0, len = parameters.length; i < len; i++) {
            param = parameters[i];
            if (!(_.isString(param))) {
              throw "Expected string parameters, not " + param;
            }
            _selections.push(param);
          }
        } else if (_.isFunction(projectionOrParameter)) {

          /* Set the projection and calculate the fields it uses */
          _projection = projectionOrParameter;
          _selections = JavaScript.getProjectedFields(_projection);
        } else {
          throw "Expected a string or a function, not " + projectionOrParameter;
        }
        return this;
      };
      this.orderBy = function() {
        var i, j, len, len1, order, param, parameters, replacement;
        parameters = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        _version++;
        for (i = 0, len = parameters.length; i < len; i++) {
          param = parameters[i];
          if (!(_.isString(param))) {
            throw "Expected string parameters, not " + param;
          }
          _ordering[param] = true;
          replacement = false;
          for (j = 0, len1 = _orderClauses.length; j < len1; j++) {
            order = _orderClauses[j];
            if (order.name === param) {
              replacement = true;
              order.ascending = true;
            }
          }
          if (!replacement) {
            _orderClauses.push({
              name: param,
              ascending: true
            });
          }
        }
        return this;
      };
      this.orderByDescending = function() {
        var i, j, len, len1, order, param, parameters, replacement;
        parameters = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        _version++;
        for (i = 0, len = parameters.length; i < len; i++) {
          param = parameters[i];
          if (!(_.isString(param))) {
            throw "Expected string parameters, not " + param;
          }
          _ordering[param] = false;
          replacement = false;
          for (j = 0, len1 = _orderClauses.length; j < len1; j++) {
            order = _orderClauses[j];
            if (order.name === param) {
              replacement = true;
              order.ascending = false;
            }
          }
          if (!replacement) {
            _orderClauses.push({
              name: param,
              ascending: false
            });
          }
        }
        return this;
      };
      this.skip = function(count) {
        _version++;
        if (!(_.isNumber(count))) {
          throw "Expected a number, not " + count;
        }
        _skip = count;
        return this;
      };
      this.take = function(count) {
        _version++;
        if (!(_.isNumber(count))) {
          throw "Expected a number, not " + count;
        }
        _take = count;
        return this;
      };

      /*
       * Indicate that the query should include the total count for all the
       * records that would have been returned ignoring any take paging
       * limit clause specified by client or server.
       */
      this.includeTotalCount = function() {
        _version++;
        _includeTotalCount = true;
        return this;
      };

      /*
       * Indicate that the query should include soft deleted records.
       */
      this.includeDeleted = function() {
        _version++;
        _includeDeleted = true;
        return this;
      };
    }


    /*
     * Static method to register custom provider types.  A custom provider is
     * an object with a toQuery method that takes a Query instance and
     * returns a compiled query for that provider.
     */

    Query.registerProvider = function(name, provider) {
      Query.Providers[name] = provider;
      return Query.prototype["to" + name] = function() {
        return provider != null ? typeof provider.toQuery === "function" ? provider.toQuery(this) : void 0 : void 0;
      };
    };


    /*
     * Expose the registered providers via the Query.Providers namespace.
     */

    Query.Providers = {};


    /*
     * Expose the query expressions and visitors externally via a
     * Query.Expressions namespace.
     */

    Query.Expressions = Q;

    return Query;

  })();


  /* Register the built in OData provider */

  ODataProvider = _dereq_('./ODataProvider').ODataProvider;

  Query.registerProvider('OData', new ODataProvider);

}).call(this);

},{"./JavaScript":13,"./ODataProvider":17,"./QueryNodes":20,"./Utilities":21}],20:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */


/*
 * Define a low level intermediate query expression language that we can
 * translate other expressions languages (like JavaScript) into.
 */


/* Get the base Node class. */

(function() {
  var BinaryExpression, ConstantExpression, InvocationExpression, LiteralExpression, MemberExpression, Node, QueryExpression, QueryExpressionVisitor, UnaryExpression, Visitor, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = _dereq_('./Node'), Node = ref.Node, Visitor = ref.Visitor;


  /*
   * Provides the base class from which the classes that represent expression tree
   * nodes are derived.
   */

  exports.QueryExpression = QueryExpression = (function(superClass) {
    extend(QueryExpression, superClass);

    function QueryExpression() {
      QueryExpression.__super__.constructor.call(this);
    }


    /*
     * Group a sequence of clauses together with a given operator (like And
     * or Or).
     */

    QueryExpression.groupClauses = function(operator, clauses) {
      var combine;
      combine = function(left, right) {
        if (!left) {
          return right;
        } else if (!right) {
          return left;
        } else {
          return new BinaryExpression(operator, left, right);
        }
      };
      return clauses.reduce(combine, null);
    };

    return QueryExpression;

  })(Node);

  exports.QueryExpressionVisitor = QueryExpressionVisitor = (function(superClass) {
    extend(QueryExpressionVisitor, superClass);

    function QueryExpressionVisitor() {
      QueryExpressionVisitor.__super__.constructor.call(this);
    }

    QueryExpressionVisitor.prototype.QueryExpression = function(node) {
      return node;
    };

    return QueryExpressionVisitor;

  })(Visitor);


  /*
   * Represents an expression that has a constant value.
   */

  exports.ConstantExpression = ConstantExpression = (function(superClass) {
    extend(ConstantExpression, superClass);


    /*
     * @value: The value of the constant expression.
     */

    function ConstantExpression(value) {
      this.value = value;
      ConstantExpression.__super__.constructor.call(this);
    }

    return ConstantExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.ConstantExpression = function(node) {
    return this.QueryExpression(node);
  };


  /*
   * Represents accessing a field.
   */

  exports.MemberExpression = MemberExpression = (function(superClass) {
    extend(MemberExpression, superClass);


    /*
     * @member: Gets the field to be accessed.
     */

    function MemberExpression(member) {
      this.member = member;
      MemberExpression.__super__.constructor.call(this);
    }

    return MemberExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.MemberExpression = function(node) {
    return this.QueryExpression(node);
  };


  /*
   * Represents an expression that has a binary operator.
   */

  exports.BinaryExpression = BinaryExpression = (function(superClass) {
    extend(BinaryExpression, superClass);


    /*
     * @operator: The operator of the binary expression.
     * @left: The left operand of the binary operation.
     * @right: The right operand of the binary operation.
     */

    function BinaryExpression(operator1, left1, right1) {
      this.operator = operator1;
      this.left = left1;
      this.right = right1;
      BinaryExpression.__super__.constructor.call(this);
    }

    return BinaryExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.BinaryExpression = function(node) {
    node = this.QueryExpression(node);
    node.left = this.visit(node.left);
    node.right = this.visit(node.right);
    return node;
  };


  /*
   * Represents the known binary operators.
   */

  exports.BinaryOperators = {
    And: 'And',
    Or: 'Or',
    Add: 'Add',
    Subtract: 'Subtract',
    Multiply: 'Multiply',
    Divide: 'Divide',
    Modulo: 'Modulo',
    GreaterThan: 'GreaterThan',
    GreaterThanOrEqual: 'GreaterThanOrEqual',
    LessThan: 'LessThan',
    LessThanOrEqual: 'LessThanOrEqual',
    NotEqual: 'NotEqual',
    Equal: 'Equal'
  };


  /*
   * Represents the known unary operators.
   */

  exports.UnaryExpression = UnaryExpression = (function(superClass) {
    extend(UnaryExpression, superClass);


    /*
     * @operator: The operator of the unary expression.
     * @operand: The operand of the unary expression.
     */

    function UnaryExpression(operator1, operand) {
      this.operator = operator1;
      this.operand = operand;
      UnaryExpression.__super__.constructor.call(this);
    }

    return UnaryExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.UnaryExpression = function(node) {
    node = this.QueryExpression(node);
    node.operand = this.visit(node.operand);
    return node;
  };


  /*
   * Represents the known unary operators.
   */

  exports.UnaryOperators = {
    Not: 'Not',
    Negate: 'Negate',
    Increment: 'Increment',
    Decrement: 'Decrement'
  };


  /*
   * Represents a method invocation.
   */

  exports.InvocationExpression = InvocationExpression = (function(superClass) {
    extend(InvocationExpression, superClass);


    /*
     * @method: The name of the method to invoke.
     * @args: The arguments to the method.
     */

    function InvocationExpression(method, args) {
      this.method = method;
      this.args = args;
      InvocationExpression.__super__.constructor.call(this);
    }

    return InvocationExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.InvocationExpression = function(node) {
    node = this.QueryExpression(node);
    node.args = this.visit(node.args);
    return node;
  };


  /*
   * Represents the known unary operators.
   */

  exports.Methods = {
    Length: 'Length',
    ToUpperCase: 'ToUpperCase',
    ToLowerCase: 'ToLowerCase',
    Trim: 'Trim',
    IndexOf: 'IndexOf',
    Replace: 'Replace',
    Substring: 'Substring',
    Concat: 'Concat',
    Day: 'Day',
    Month: 'Month',
    Year: 'Year',
    Floor: 'Floor',
    Ceiling: 'Ceiling',
    Round: 'Round'
  };


  /*
   * Represents a literal string in the query language.
   */

  exports.LiteralExpression = LiteralExpression = (function(superClass) {
    extend(LiteralExpression, superClass);


    /*
     * @queryString
     * @args
     */

    function LiteralExpression(queryString, args) {
      this.queryString = queryString;
      this.args = args != null ? args : [];
      LiteralExpression.__super__.constructor.call(this);
    }

    return LiteralExpression;

  })(QueryExpression);

  QueryExpressionVisitor.prototype.LiteralExpression = function(node) {
    return this.QueryExpression(node);
  };

}).call(this);

},{"./Node":16}],21:[function(_dereq_,module,exports){
// Generated by CoffeeScript 1.10.0

/*
 * ----------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * ----------------------------------------------------------------------------
 */

(function() {
  var classOf,
    slice = [].slice;

  classOf = function(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
  };

  if (Array.prototype.reduce == null) {
    Array.prototype.reduce = function() {
      var accumulator, array, arrayLength, currentIndex, currentValue, moreArgs;
      accumulator = arguments[0], moreArgs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      array = this;
      arrayLength = array.length;
      currentIndex = 0;
      currentValue = void 0;
      if (array == null) {
        throw new TypeError("Object is null or undefined");
      }
      if (typeof accumulator !== "function") {
        throw new TypeError("First argument is not callable");
      }
      if (moreArgs.length === 0) {
        if (arrayLength === 0) {
          throw new TypeError("Array length is 0 and no second argument");
        } else {
          currentValue = array[0];
          currentIndex = 1;
        }
      } else {
        currentValue = moreArgs[0];
      }
      while (currentIndex < arrayLength) {
        if (currentIndex in array) {
          currentValue = accumulator.call(void 0, currentValue, array[currentIndex], array);
        }
        ++currentIndex;
      }
      return currentValue;
    };
  }

  if (Array.prototype.map == null) {
    Array.prototype.map = function(callback, thisArg) {
      var elem, i, index, inputArray, len, len1, outputArray;
      if (typeof this === "undefined" || this === null) {
        throw new TypeError("this is null or not defined");
      }
      if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
      }
      thisArg = thisArg ? thisArg : void 0;
      inputArray = Object(this);
      len = inputArray.length >>> 0;
      outputArray = new Array(len);
      for (index = i = 0, len1 = inputArray.length; i < len1; index = ++i) {
        elem = inputArray[index];
        if (index in inputArray) {
          outputArray[index] = callback.call(thisArg, elem, index, inputArray);
        }
      }
      return outputArray;
    };
  }

  if (Array.isArray == null) {
    Array.isArray = function(vArg) {
      return Object.prototype.toString.call(vArg) === "[object Array]";
    };
  }

  exports.isObject = function(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object';
  };

  exports.isString = function(obj) {
    return typeof obj === 'string';
  };

  exports.isFunction = function(obj) {
    return typeof obj === 'function';
  };

  exports.isArray = Array.isArray;

  exports.isNumber = function(obj) {
    return typeof obj === 'number';
  };

  exports.isBoolean = function(obj) {
    return typeof obj === 'boolean';
  };

  exports.isDate = function(obj) {
    return classOf(obj) === 'date';
  };

  exports.functionName = function(fn) {
    var index, prefix, source;
    if (typeof Function.prototype.name === 'function') {
      return Function.prototype.name.call(fn);
    } else {
      source = fn.toString();
      prefix = 'function ';
      if (source.slice(0, +(prefix.length - 1) + 1 || 9e9) === prefix) {
        index = source.indexOf('(', prefix.length);
        if (index > prefix.length) {
          return source.slice(prefix.length, +(index - 1) + 1 || 9e9);
        }
      }
      return null;
    }
  };

}).call(this);

},{}],22:[function(_dereq_,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],23:[function(_dereq_,module,exports){

},{}],24:[function(_dereq_,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')
var isArray = _dereq_('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":22,"ieee754":30,"isarray":25}],25:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],26:[function(_dereq_,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":_dereq_("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":32}],27:[function(_dereq_,module,exports){
/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {
        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
        if (extra.tokenize) {
            comment.type = comment.type + 'Comment';
            if (extra.delegate) {
                comment = extra.delegate(comment);
            }
            extra.tokens.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokenValues.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokenValues.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            index = start;
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            /* istanbul ignore next */
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    // Using the following algorithm:
    // https://github.com/mozilla/sweet.js/wiki/design

    function advanceSlash() {
        var regex, previous, check;

        function testKeyword(value) {
            return value && (value.length > 1) && (value[0] >= 'a') && (value[0] <= 'z');
        }

        previous = extra.tokenValues[extra.tokenValues.length - 1];
        regex = (previous !== null);

        switch (previous) {
        case 'this':
        case ']':
            regex = false;
            break;

        case ')':
            check = extra.tokenValues[extra.openParenToken - 1];
            regex = (check === 'if' || check === 'while' || check === 'for' || check === 'with');
            break;

        case '}':
            // Dividing a function by anything makes little sense,
            // but we have to check for that.
            regex = false;
            if (testKeyword(extra.tokenValues[extra.openCurlyToken - 3])) {
                // Anonymous function, e.g. function(){} /42
                check = extra.tokenValues[extra.openCurlyToken - 4];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : false;
            } else if (testKeyword(extra.tokenValues[extra.openCurlyToken - 4])) {
                // Named function, e.g. function f(){} /42/
                check = extra.tokenValues[extra.openCurlyToken - 5];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : true;
            }
        }

        return regex ? collectRegex() : scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            if (extra.tokenValues) {
                extra.tokenValues.push((entry.type === 'Punctuator' || entry.type === 'Keyword') ? entry.value : null);
            }
            if (extra.tokenize) {
                if (!extra.range) {
                    delete entry.range;
                }
                if (!extra.loc) {
                    delete entry.loc;
                }
                if (extra.delegate) {
                    entry = extra.delegate(entry);
                }
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                innerComments,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }
            /**
             * patch innnerComments for properties empty block
             * `function a() {/** comments **\/}`
             */

            if (this.type === Syntax.BlockStatement && this.body.length === 0) {
                innerComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (this.range[1] >= comment.range[1]) {
                        innerComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                if (innerComments.length) {
                    this.innerComments = innerComments;
                    //bottomRight.push(this);
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, true);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey();
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        } else if (matchKeyword('let')) {
            if (kind === 'const' || kind === 'let') {
                tolerateUnexpectedToken(lookahead, Messages.UnexpectedToken);
            }
        }

        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            if (!strict && matchKeyword('let')) {
                return node.finishIdentifier(lex().value);
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();
        delegate = false;

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        if (matchKeyword('let') && isLexicalDeclaration()) {
            return parseLexicalDeclaration({inFor: false});
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var opt, list;

        opt = { inFor: options.inFor };
        list = [parseVariableDeclaration(opt)];

        while (match(',')) {
            lex();
            list.push(parseVariableDeclaration(opt));
        }

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [parseLexicalBinding(kind, options)];

        while (match(',')) {
            lex();
            list.push(parseLexicalBinding(kind, options));
        }

        return list;
    }


    function tokenizerState() {
        return {
            index: index,
            lineNumber: lineNumber,
            lineStart: lineStart,
            hasLineTerminator: hasLineTerminator,
            lastIndex: lastIndex,
            lastLineNumber: lastLineNumber,
            lastLineStart: lastLineStart,
            startIndex: startIndex,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lookahead: lookahead,
            tokenCount: extra.tokens ? extra.tokens.length : 0
        };
    }

    function resetTokenizerState(ts) {
        index = ts.index;
        lineNumber = ts.lineNumber;
        lineStart = ts.lineStart;
        hasLineTerminator = ts.hasLineTerminator;
        lastIndex = ts.lastIndex;
        lastLineNumber = ts.lastLineNumber;
        lastLineStart = ts.lastLineStart;
        startIndex = ts.startIndex;
        startLineNumber = ts.startLineNumber;
        startLineStart = ts.startLineStart;
        lookahead = ts.lookahead;
        if (extra.tokens) {
            extra.tokens.splice(ts.tokenCount, extra.tokens.length);
        }
    }

    function isLexicalDeclaration() {
        var lexical, ts;

        ts = tokenizerState();

        lex();
        lexical = (lookahead.type === Token.Identifier) || match('[') || match('{') ||
            matchKeyword('let') || matchKeyword('yield');

        resetTokenizerState(ts);

        return lexical;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                if (!strict && lookahead.value === 'in') {
                    init = init.finishIdentifier(kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
                    state.allowIn = false;
                    declarations = parseBindingList(kind, {inFor: true});
                    state.allowIn = previousAllowIn;

                    if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseExpression();
                        init = null;
                    } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseAssignmentExpression();
                        init = null;
                        forIn = false;
                    } else {
                        consumeSemicolon();
                        init = init.finishLexicalDeclaration(declarations, kind);
                    }
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }
        } else if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                    declaration = parseLexicalDeclaration({inFor: false});
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options, delegate) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenValues = [];
        extra.tokenize = true;
        extra.delegate = delegate;

        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            tokens = extra.tokens;
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.7.3';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],28:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],29:[function(_dereq_,module,exports){
(function (process){
/*
 * extsprintf.js: extended POSIX-style sprintf
 */

var mod_assert = _dereq_('assert');
var mod_util = _dereq_('util');

/*
 * Public interface
 */
exports.sprintf = jsSprintf;
exports.printf = jsPrintf;
exports.fprintf = jsFprintf;

/*
 * Stripped down version of s[n]printf(3c).  We make a best effort to throw an
 * exception when given a format string we don't understand, rather than
 * ignoring it, so that we won't break existing programs if/when we go implement
 * the rest of this.
 *
 * This implementation currently supports specifying
 *	- field alignment ('-' flag),
 * 	- zero-pad ('0' flag)
 *	- always show numeric sign ('+' flag),
 *	- field width
 *	- conversions for strings, decimal integers, and floats (numbers).
 *	- argument size specifiers.  These are all accepted but ignored, since
 *	  Javascript has no notion of the physical size of an argument.
 *
 * Everything else is currently unsupported, most notably precision, unsigned
 * numbers, non-decimal numbers, and characters.
 */
function jsSprintf(ofmt)
{
	var regex = [
	    '([^%]*)',				/* normal text */
	    '%',				/* start of format */
	    '([\'\\-+ #0]*?)',			/* flags (optional) */
	    '([1-9]\\d*)?',			/* width (optional) */
	    '(\\.([1-9]\\d*))?',		/* precision (optional) */
	    '[lhjztL]*?',			/* length mods (ignored) */
	    '([diouxXfFeEgGaAcCsSp%jr])'	/* conversion */
	].join('');

	var re = new RegExp(regex);

	/* variadic arguments used to fill in conversion specifiers */
	var args = Array.prototype.slice.call(arguments, 1);
	/* remaining format string */
	var fmt = ofmt;

	/* components of the current conversion specifier */
	var flags, width, precision, conversion;
	var left, pad, sign, arg, match;

	/* return value */
	var ret = '';

	/* current variadic argument (1-based) */
	var argn = 1;
	/* 0-based position in the format string that we've read */
	var posn = 0;
	/* 1-based position in the format string of the current conversion */
	var convposn;
	/* current conversion specifier */
	var curconv;

	mod_assert.equal('string', typeof (fmt),
	    'first argument must be a format string');

	while ((match = re.exec(fmt)) !== null) {
		ret += match[1];
		fmt = fmt.substring(match[0].length);

		/*
		 * Update flags related to the current conversion specifier's
		 * position so that we can report clear error messages.
		 */
		curconv = match[0].substring(match[1].length);
		convposn = posn + match[1].length + 1;
		posn += match[0].length;

		flags = match[2] || '';
		width = match[3] || 0;
		precision = match[4] || '';
		conversion = match[6];
		left = false;
		sign = false;
		pad = ' ';

		if (conversion == '%') {
			ret += '%';
			continue;
		}

		if (args.length === 0) {
			throw (jsError(ofmt, convposn, curconv,
			    'has no matching argument ' +
			    '(too few arguments passed)'));
		}

		arg = args.shift();
		argn++;

		if (flags.match(/[\' #]/)) {
			throw (jsError(ofmt, convposn, curconv,
			    'uses unsupported flags'));
		}

		if (precision.length > 0) {
			throw (jsError(ofmt, convposn, curconv,
			    'uses non-zero precision (not supported)'));
		}

		if (flags.match(/-/))
			left = true;

		if (flags.match(/0/))
			pad = '0';

		if (flags.match(/\+/))
			sign = true;

		switch (conversion) {
		case 's':
			if (arg === undefined || arg === null) {
				throw (jsError(ofmt, convposn, curconv,
				    'attempted to print undefined or null ' +
				    'as a string (argument ' + argn + ' to ' +
				    'sprintf)'));
			}
			ret += doPad(pad, width, left, arg.toString());
			break;

		case 'd':
			arg = Math.floor(arg);
			/*jsl:fallthru*/
		case 'f':
			sign = sign && arg > 0 ? '+' : '';
			ret += sign + doPad(pad, width, left,
			    arg.toString());
			break;

		case 'x':
			ret += doPad(pad, width, left, arg.toString(16));
			break;

		case 'j': /* non-standard */
			if (width === 0)
				width = 10;
			ret += mod_util.inspect(arg, false, width);
			break;

		case 'r': /* non-standard */
			ret += dumpException(arg);
			break;

		default:
			throw (jsError(ofmt, convposn, curconv,
			    'is not supported'));
		}
	}

	ret += fmt;
	return (ret);
}

function jsError(fmtstr, convposn, curconv, reason) {
	mod_assert.equal(typeof (fmtstr), 'string');
	mod_assert.equal(typeof (curconv), 'string');
	mod_assert.equal(typeof (convposn), 'number');
	mod_assert.equal(typeof (reason), 'string');
	return (new Error('format string "' + fmtstr +
	    '": conversion specifier "' + curconv + '" at character ' +
	    convposn + ' ' + reason));
}

function jsPrintf() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(process.stdout);
	jsFprintf.apply(null, args);
}

function jsFprintf(stream) {
	var args = Array.prototype.slice.call(arguments, 1);
	return (stream.write(jsSprintf.apply(this, args)));
}

function doPad(chr, width, left, str)
{
	var ret = str;

	while (ret.length < width) {
		if (left)
			ret += chr;
		else
			ret = chr + ret;
	}

	return (ret);
}

/*
 * This function dumps long stack traces for exceptions having a cause() method.
 * See node-verror for an example.
 */
function dumpException(ex)
{
	var ret;

	if (!(ex instanceof Error))
		throw (new Error(jsSprintf('invalid type for %%r: %j', ex)));

	/* Note that V8 prepends "ex.stack" with ex.toString(). */
	ret = 'EXCEPTION: ' + ex.constructor.name + ': ' + ex.stack;

	if (ex.cause && typeof (ex.cause) === 'function') {
		var cex = ex.cause();
		if (cex) {
			ret += '\nCaused by: ' + dumpException(cex);
		}
	}

	return (ret);
}

}).call(this,_dereq_('_process'))
},{"_process":34,"assert":2,"util":55}],30:[function(_dereq_,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],31:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],32:[function(_dereq_,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],33:[function(_dereq_,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,_dereq_('_process'))
},{"_process":34}],34:[function(_dereq_,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],35:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":36}],36:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

var Readable = _dereq_('./_stream_readable');
var Writable = _dereq_('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":38,"./_stream_writable":40,"core-util-is":26,"inherits":31,"process-nextick-args":33}],37:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = _dereq_('./_stream_transform');

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":39,"core-util-is":26,"inherits":31}],38:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = _dereq_('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = _dereq_('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = _dereq_('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = _dereq_('./internal/streams/BufferList');
var destroyImpl = _dereq_('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = _dereq_('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":36,"./internal/streams/BufferList":41,"./internal/streams/destroy":42,"./internal/streams/stream":43,"_process":34,"core-util-is":26,"events":28,"inherits":31,"isarray":44,"process-nextick-args":33,"safe-buffer":50,"string_decoder/":45,"util":23}],39:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = _dereq_('./_stream_duplex');

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":36,"core-util-is":26,"inherits":31}],40:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = _dereq_('core-util-is');
util.inherits = _dereq_('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: _dereq_('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = _dereq_('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = _dereq_('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = _dereq_('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _dereq_('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":36,"./internal/streams/destroy":42,"./internal/streams/stream":43,"_process":34,"core-util-is":26,"inherits":31,"process-nextick-args":33,"safe-buffer":50,"util-deprecate":52}],41:[function(_dereq_,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = _dereq_('safe-buffer').Buffer;
var util = _dereq_('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":50,"util":23}],42:[function(_dereq_,module,exports){
'use strict';

/*<replacement>*/

var pna = _dereq_('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":33}],43:[function(_dereq_,module,exports){
module.exports = _dereq_('events').EventEmitter;

},{"events":28}],44:[function(_dereq_,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],45:[function(_dereq_,module,exports){
'use strict';

var Buffer = _dereq_('safe-buffer').Buffer;

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return -1;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// UTF-8 replacement characters ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd'.repeat(p);
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd'.repeat(p + 1);
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd'.repeat(p + 2);
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character for each buffered byte of a (partial)
// character needs to be added to the output.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd'.repeat(this.lastTotal - this.lastNeed);
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":50}],46:[function(_dereq_,module,exports){
module.exports = _dereq_('./readable').PassThrough

},{"./readable":47}],47:[function(_dereq_,module,exports){
exports = module.exports = _dereq_('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = _dereq_('./lib/_stream_writable.js');
exports.Duplex = _dereq_('./lib/_stream_duplex.js');
exports.Transform = _dereq_('./lib/_stream_transform.js');
exports.PassThrough = _dereq_('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":36,"./lib/_stream_passthrough.js":37,"./lib/_stream_readable.js":38,"./lib/_stream_transform.js":39,"./lib/_stream_writable.js":40}],48:[function(_dereq_,module,exports){
module.exports = _dereq_('./readable').Transform

},{"./readable":47}],49:[function(_dereq_,module,exports){
module.exports = _dereq_('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":40}],50:[function(_dereq_,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = _dereq_('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":24}],51:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = _dereq_('events').EventEmitter;
var inherits = _dereq_('inherits');

inherits(Stream, EE);
Stream.Readable = _dereq_('readable-stream/readable.js');
Stream.Writable = _dereq_('readable-stream/writable.js');
Stream.Duplex = _dereq_('readable-stream/duplex.js');
Stream.Transform = _dereq_('readable-stream/transform.js');
Stream.PassThrough = _dereq_('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":28,"inherits":31,"readable-stream/duplex.js":35,"readable-stream/passthrough.js":46,"readable-stream/readable.js":47,"readable-stream/transform.js":48,"readable-stream/writable.js":49}],52:[function(_dereq_,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],53:[function(_dereq_,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31}],54:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],55:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":54,"_process":34,"inherits":53}],56:[function(_dereq_,module,exports){
var v1 = _dereq_('./v1');
var v4 = _dereq_('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":59,"./v4":60}],57:[function(_dereq_,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],58:[function(_dereq_,module,exports){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && msCrypto.getRandomValues.bind(msCrypto));
if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

},{}],59:[function(_dereq_,module,exports){
var rng = _dereq_('./lib/rng');
var bytesToUuid = _dereq_('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":57,"./lib/rng":58}],60:[function(_dereq_,module,exports){
var rng = _dereq_('./lib/rng');
var bytesToUuid = _dereq_('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":57,"./lib/rng":58}],61:[function(_dereq_,module,exports){
/*
 * verror.js: richer JavaScript errors
 */

var mod_assertplus = _dereq_('assert-plus');
var mod_util = _dereq_('util');

var mod_extsprintf = _dereq_('extsprintf');
var mod_isError = _dereq_('core-util-is').isError;
var sprintf = mod_extsprintf.sprintf;

/*
 * Public interface
 */

/* So you can 'var VError = require('verror')' */
module.exports = VError;
/* For compatibility */
VError.VError = VError;
/* Other exported classes */
VError.SError = SError;
VError.WError = WError;
VError.MultiError = MultiError;

/*
 * Common function used to parse constructor arguments for VError, WError, and
 * SError.  Named arguments to this function:
 *
 *     strict		force strict interpretation of sprintf arguments, even
 *     			if the options in "argv" don't say so
 *
 *     argv		error's constructor arguments, which are to be
 *     			interpreted as described in README.md.  For quick
 *     			reference, "argv" has one of the following forms:
 *
 *          [ sprintf_args... ]           (argv[0] is a string)
 *          [ cause, sprintf_args... ]    (argv[0] is an Error)
 *          [ options, sprintf_args... ]  (argv[0] is an object)
 *
 * This function normalizes these forms, producing an object with the following
 * properties:
 *
 *    options           equivalent to "options" in third form.  This will never
 *    			be a direct reference to what the caller passed in
 *    			(i.e., it may be a shallow copy), so it can be freely
 *    			modified.
 *
 *    shortmessage      result of sprintf(sprintf_args), taking options.strict
 *    			into account as described in README.md.
 */
function parseConstructorArguments(args)
{
	var argv, options, sprintf_args, shortmessage, k;

	mod_assertplus.object(args, 'args');
	mod_assertplus.bool(args.strict, 'args.strict');
	mod_assertplus.array(args.argv, 'args.argv');
	argv = args.argv;

	/*
	 * First, figure out which form of invocation we've been given.
	 */
	if (argv.length === 0) {
		options = {};
		sprintf_args = [];
	} else if (mod_isError(argv[0])) {
		options = { 'cause': argv[0] };
		sprintf_args = argv.slice(1);
	} else if (typeof (argv[0]) === 'object') {
		options = {};
		for (k in argv[0]) {
			options[k] = argv[0][k];
		}
		sprintf_args = argv.slice(1);
	} else {
		mod_assertplus.string(argv[0],
		    'first argument to VError, SError, or WError ' +
		    'constructor must be a string, object, or Error');
		options = {};
		sprintf_args = argv;
	}

	/*
	 * Now construct the error's message.
	 *
	 * extsprintf (which we invoke here with our caller's arguments in order
	 * to construct this Error's message) is strict in its interpretation of
	 * values to be processed by the "%s" specifier.  The value passed to
	 * extsprintf must actually be a string or something convertible to a
	 * String using .toString().  Passing other values (notably "null" and
	 * "undefined") is considered a programmer error.  The assumption is
	 * that if you actually want to print the string "null" or "undefined",
	 * then that's easy to do that when you're calling extsprintf; on the
	 * other hand, if you did NOT want that (i.e., there's actually a bug
	 * where the program assumes some variable is non-null and tries to
	 * print it, which might happen when constructing a packet or file in
	 * some specific format), then it's better to stop immediately than
	 * produce bogus output.
	 *
	 * However, sometimes the bug is only in the code calling VError, and a
	 * programmer might prefer to have the error message contain "null" or
	 * "undefined" rather than have the bug in the error path crash the
	 * program (making the first bug harder to identify).  For that reason,
	 * by default VError converts "null" or "undefined" arguments to their
	 * string representations and passes those to extsprintf.  Programmers
	 * desiring the strict behavior can use the SError class or pass the
	 * "strict" option to the VError constructor.
	 */
	mod_assertplus.object(options);
	if (!options.strict && !args.strict) {
		sprintf_args = sprintf_args.map(function (a) {
			return (a === null ? 'null' :
			    a === undefined ? 'undefined' : a);
		});
	}

	if (sprintf_args.length === 0) {
		shortmessage = '';
	} else {
		shortmessage = sprintf.apply(null, sprintf_args);
	}

	return ({
	    'options': options,
	    'shortmessage': shortmessage
	});
}

/*
 * See README.md for reference documentation.
 */
function VError()
{
	var args, obj, parsed, cause, ctor, message, k;

	args = Array.prototype.slice.call(arguments, 0);

	/*
	 * This is a regrettable pattern, but JavaScript's built-in Error class
	 * is defined to work this way, so we allow the constructor to be called
	 * without "new".
	 */
	if (!(this instanceof VError)) {
		obj = Object.create(VError.prototype);
		VError.apply(obj, arguments);
		return (obj);
	}

	/*
	 * For convenience and backwards compatibility, we support several
	 * different calling forms.  Normalize them here.
	 */
	parsed = parseConstructorArguments({
	    'argv': args,
	    'strict': false
	});

	/*
	 * If we've been given a name, apply it now.
	 */
	if (parsed.options.name) {
		mod_assertplus.string(parsed.options.name,
		    'error\'s "name" must be a string');
		this.name = parsed.options.name;
	}

	/*
	 * For debugging, we keep track of the original short message (attached
	 * this Error particularly) separately from the complete message (which
	 * includes the messages of our cause chain).
	 */
	this.jse_shortmsg = parsed.shortmessage;
	message = parsed.shortmessage;

	/*
	 * If we've been given a cause, record a reference to it and update our
	 * message appropriately.
	 */
	cause = parsed.options.cause;
	if (cause) {
		mod_assertplus.ok(mod_isError(cause), 'cause is not an Error');
		this.jse_cause = cause;

		if (!parsed.options.skipCauseMessage) {
			message += ': ' + cause.message;
		}
	}

	/*
	 * If we've been given an object with properties, shallow-copy that
	 * here.  We don't want to use a deep copy in case there are non-plain
	 * objects here, but we don't want to use the original object in case
	 * the caller modifies it later.
	 */
	this.jse_info = {};
	if (parsed.options.info) {
		for (k in parsed.options.info) {
			this.jse_info[k] = parsed.options.info[k];
		}
	}

	this.message = message;
	Error.call(this, message);

	if (Error.captureStackTrace) {
		ctor = parsed.options.constructorOpt || this.constructor;
		Error.captureStackTrace(this, ctor);
	}

	return (this);
}

mod_util.inherits(VError, Error);
VError.prototype.name = 'VError';

VError.prototype.toString = function ve_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;

	return (str);
};

/*
 * This method is provided for compatibility.  New callers should use
 * VError.cause() instead.  That method also uses the saner `null` return value
 * when there is no cause.
 */
VError.prototype.cause = function ve_cause()
{
	var cause = VError.cause(this);
	return (cause === null ? undefined : cause);
};

/*
 * Static methods
 *
 * These class-level methods are provided so that callers can use them on
 * instances of Errors that are not VErrors.  New interfaces should be provided
 * only using static methods to eliminate the class of programming mistake where
 * people fail to check whether the Error object has the corresponding methods.
 */

VError.cause = function (err)
{
	mod_assertplus.ok(mod_isError(err), 'err must be an Error');
	return (mod_isError(err.jse_cause) ? err.jse_cause : null);
};

VError.info = function (err)
{
	var rv, cause, k;

	mod_assertplus.ok(mod_isError(err), 'err must be an Error');
	cause = VError.cause(err);
	if (cause !== null) {
		rv = VError.info(cause);
	} else {
		rv = {};
	}

	if (typeof (err.jse_info) == 'object' && err.jse_info !== null) {
		for (k in err.jse_info) {
			rv[k] = err.jse_info[k];
		}
	}

	return (rv);
};

VError.findCauseByName = function (err, name)
{
	var cause;

	mod_assertplus.ok(mod_isError(err), 'err must be an Error');
	mod_assertplus.string(name, 'name');
	mod_assertplus.ok(name.length > 0, 'name cannot be empty');

	for (cause = err; cause !== null; cause = VError.cause(cause)) {
		mod_assertplus.ok(mod_isError(cause));
		if (cause.name == name) {
			return (cause);
		}
	}

	return (null);
};

VError.hasCauseWithName = function (err, name)
{
	return (VError.findCauseByName(err, name) !== null);
};

VError.fullStack = function (err)
{
	mod_assertplus.ok(mod_isError(err), 'err must be an Error');

	var cause = VError.cause(err);

	if (cause) {
		return (err.stack + '\ncaused by: ' + VError.fullStack(cause));
	}

	return (err.stack);
};

VError.errorFromList = function (errors)
{
	mod_assertplus.arrayOfObject(errors, 'errors');

	if (errors.length === 0) {
		return (null);
	}

	errors.forEach(function (e) {
		mod_assertplus.ok(mod_isError(e));
	});

	if (errors.length == 1) {
		return (errors[0]);
	}

	return (new MultiError(errors));
};

VError.errorForEach = function (err, func)
{
	mod_assertplus.ok(mod_isError(err), 'err must be an Error');
	mod_assertplus.func(func, 'func');

	if (err instanceof MultiError) {
		err.errors().forEach(function iterError(e) { func(e); });
	} else {
		func(err);
	}
};


/*
 * SError is like VError, but stricter about types.  You cannot pass "null" or
 * "undefined" as string arguments to the formatter.
 */
function SError()
{
	var args, obj, parsed, options;

	args = Array.prototype.slice.call(arguments, 0);
	if (!(this instanceof SError)) {
		obj = Object.create(SError.prototype);
		SError.apply(obj, arguments);
		return (obj);
	}

	parsed = parseConstructorArguments({
	    'argv': args,
	    'strict': true
	});

	options = parsed.options;
	VError.call(this, options, '%s', parsed.shortmessage);

	return (this);
}

/*
 * We don't bother setting SError.prototype.name because once constructed,
 * SErrors are just like VErrors.
 */
mod_util.inherits(SError, VError);


/*
 * Represents a collection of errors for the purpose of consumers that generally
 * only deal with one error.  Callers can extract the individual errors
 * contained in this object, but may also just treat it as a normal single
 * error, in which case a summary message will be printed.
 */
function MultiError(errors)
{
	mod_assertplus.array(errors, 'list of errors');
	mod_assertplus.ok(errors.length > 0, 'must be at least one error');
	this.ase_errors = errors;

	VError.call(this, {
	    'cause': errors[0]
	}, 'first of %d error%s', errors.length, errors.length == 1 ? '' : 's');
}

mod_util.inherits(MultiError, VError);
MultiError.prototype.name = 'MultiError';

MultiError.prototype.errors = function me_errors()
{
	return (this.ase_errors.slice(0));
};


/*
 * See README.md for reference details.
 */
function WError()
{
	var args, obj, parsed, options;

	args = Array.prototype.slice.call(arguments, 0);
	if (!(this instanceof WError)) {
		obj = Object.create(WError.prototype);
		WError.apply(obj, args);
		return (obj);
	}

	parsed = parseConstructorArguments({
	    'argv': args,
	    'strict': false
	});

	options = parsed.options;
	options['skipCauseMessage'] = true;
	VError.call(this, options, '%s', parsed.shortmessage);

	return (this);
}

mod_util.inherits(WError, VError);
WError.prototype.name = 'WError';

WError.prototype.toString = function we_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;
	if (this.jse_cause && this.jse_cause.message)
		str += '; caused by ' + this.jse_cause.toString();

	return (str);
};

/*
 * For purely historical reasons, WError's cause() function allows you to set
 * the cause.
 */
WError.prototype.cause = function we_cause(c)
{
	if (mod_isError(c))
		this.jse_cause = c;

	return (this.jse_cause);
};

},{"assert-plus":1,"core-util-is":26,"extsprintf":29,"util":55}],62:[function(_dereq_,module,exports){
module.exports={
  "version": "2.0.1"
}
},{}],63:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var PostMessageExchange = _dereq_('../Utilities/PostMessageExchange');

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this login UI is usable in the current runtime.
    /// </summary>
    return true;
};

exports.login = function (startUri, endUri, callback) {
    /// <summary>
    /// Displays the login UI and calls back on completion
    /// </summary>

    // Tell the runtime which form of completion signal we are looking for,
    // and which origin should be allowed to receive the result (note that this
    // is validated against whitelist on the server; we are only supplying this
    // origin to indicate *which* of the whitelisted origins to use).
    var completionOrigin = PostMessageExchange.getOriginRoot(window.location.href),
        runtimeOrigin = PostMessageExchange.getOriginRoot(startUri),
        // IE does not support popup->opener postMessage calls, so we have to
        // route the message via an iframe
        useIntermediateIframe = window.navigator.userAgent.indexOf("MSIE") >= 0 || window.navigator.userAgent.indexOf("Trident") >= 0,
        intermediateIframe = useIntermediateIframe && createIntermediateIframeForLogin(runtimeOrigin, completionOrigin),
        completionType = useIntermediateIframe ? "iframe" : "postMessage";

    startUri += startUri.indexOf('?') == -1 ? '?' : '&';
    startUri += "completion_type=" + completionType + "&completion_origin=" + encodeURIComponent(completionOrigin);

    // Browsers don't allow postMessage to a file:// URL (except by setting origin to "*", which is unacceptable)
    // so abort the process early with an explanation in that case.
    if (!(completionOrigin && (completionOrigin.indexOf("http:") === 0 || completionOrigin.indexOf("https:") === 0))) {
        var error = "Login is only supported from http:// or https:// URLs. Please host your page in a web server.";
        callback(error, null);
        return;
    }

    var loginWindow = window.open(startUri, "_blank", "location=no,resizable=yes"),
        complete = function(errorValue, oauthValue) {
            // Clean up event handlers, windows, frames, ...
            window.clearInterval(checkForWindowClosedInterval);
            loginWindow.close();
            if (window.removeEventListener) {
                window.removeEventListener("message", handlePostMessage);
            } else {
                // For IE8
                window.detachEvent("onmessage", handlePostMessage);
            }
            if (intermediateIframe) {
                intermediateIframe.parentNode.removeChild(intermediateIframe);
            }
            
            // Finally, notify the caller
            callback(errorValue, oauthValue);
        },
        handlePostMessage = function(evt) {
            // Validate source
            var expectedSource = useIntermediateIframe ? intermediateIframe.contentWindow : loginWindow;
            if (evt.source !== expectedSource) {
                return;
            }

            // Parse message
            var envelope;
            try {
				// Temporary workaround for IE8 bug until it is fixed in EA.
				if (typeof evt.data === 'string') {
					envelope = JSON.parse(evt.data);
				} else {
					envelope = evt.data;
				}
            } catch(ex) {
                // Not JSON - it's not for us. Ignore it and keep waiting for the next message.
                return;
            }

            // Process message only if it's for us
            if (envelope && envelope.type === "LoginCompleted" && (envelope.oauth || envelope.error)) {
                complete(envelope.error, envelope.oauth);
            }
        },
        checkForWindowClosedInterval = window.setInterval(function() {
            // We can't directly catch any "onclose" event from the popup because it's usually on a different
            // origin, but in all the mainstream browsers we can poll for changes to its "closed" property
            if (loginWindow && loginWindow.closed === true) {
                complete(new Error("canceled"), null);
            }
        }, 250);

    if (window.addEventListener) {
        window.addEventListener("message", handlePostMessage, false);
    } else {
        // For IE8
        window.attachEvent("onmessage", handlePostMessage);
    }
    
    // Permit cancellation, e.g., if the app tries to login again while the popup is still open
    return {
        cancelCallback: function () {
            complete(new Error("canceled"), null);
            return true; // Affirm that it was cancelled
        }
    };
};

function createIntermediateIframeForLogin(runtimeOrigin, completionOrigin) {
    var frame = document.createElement("iframe");
    frame.name = "zumo-login-receiver"; // loginviaiframe.html specifically looks for this name
    frame.src = runtimeOrigin + "/.auth/login/iframereceiver?completion_origin=" + encodeURIComponent(completionOrigin);
    frame.setAttribute("width", 0);
    frame.setAttribute("height", 0);
    frame.style.display = "none";
    document.body.appendChild(frame);
    return frame;
}
},{"../Utilities/PostMessageExchange":84}],64:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Note: Cordova is PhoneGap.
// This login UI implementation uses the InAppBrowser plugin,
// to install the plugin use the following command
//   cordova plugin add org.apache.cordova.inappbrowser

var requiredCordovaVersion = { major: 3, minor: 0 };

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this login UI is usable in the current runtime.
    /// </summary>

    // When running application inside of Ripple emulator, InAppBrowser functionality is not supported.
    // We should use Browser popup login method instead.
    return !!currentCordovaVersion() && !isRunUnderRippleEmulator();
};

exports.login = function (startUri, endUri, callback, providerName, appUrl) {
    /// <summary>
    /// Displays the login UI and calls back on completion
    /// </summary>

    // Ensure it's a sufficiently new version of Cordova, and if not fail synchronously so that
    // the error message will show up in the browser console.
    var foundCordovaVersion = currentCordovaVersion(),
        message;

    if (!isSupportedCordovaVersion(foundCordovaVersion)) {
        message = "Not a supported version of Cordova. Detected: " + foundCordovaVersion +
                    ". Required: " + requiredCordovaVersion.major + "." + requiredCordovaVersion.minor;
        throw new Error(message);
    }

    if (providerName === 'google') {
        loginWithGoogle(appUrl, callback);
    } else {
        loginWithInAppBrowser(startUri, endUri, callback);
    }
};

function loginWithInAppBrowser(startUri, endUri, callback) {

    if (!hasInAppBrowser) {
        var message = 'A required plugin: "org.apache.cordova.inappbrowser" was not detected.';
        throw new Error(message);
    }

    // Initially we show a page with a spinner. This stays on screen until the login form has loaded.
    var redirectionScript = "<script>location.href = unescape('" + window.escape(startUri) + "')</script>",
        startPage = "data:text/html," + encodeURIComponent(getSpinnerMarkup() + redirectionScript);

    // iOS inAppBrowser issue requires this wrapping
    setTimeout(function () {
        var loginWindow = window.open(startPage, "_blank", "location=no,hardwareback=no"),
            flowHasFinished = false,
            loadEventHandler = function (evt) {
                if (!flowHasFinished && evt.url.indexOf(endUri) === 0) {
                    flowHasFinished = true;
                    setTimeout(function () {
                        loginWindow.close();
                    }, 500);
                    var result = parseOAuthResultFromDoneUrl(evt.url);
                    callback(result.error, result.oAuthToken);
                }
            };

        // Ideally we'd just use loadstart because it happens earlier, but it randomly skips
        // requests on iOS, so we have to listen for loadstop as well (which is reliable).
        loginWindow.addEventListener('loadstart', loadEventHandler);
        loginWindow.addEventListener('loadstop', loadEventHandler);

        loginWindow.addEventListener('exit', function (evt) {
            if (!flowHasFinished) {
                flowHasFinished = true;
                callback(new Error("UserCancelled"), null);
            }
        });
    }, 500);
}

function loginWithGoogle(appUrl, callback) {

    var successCallback = function (token) {
        callback(null, token);
    };

    var errorCallback = function (errorResponse) {
        callback(new Error(errorResponse), null);
    };

    cordova.exec(successCallback, errorCallback, "MobileServices", "loginWithGoogle", [appUrl])
}

function isRunUnderRippleEmulator () {
    // Returns true when application runs under Ripple emulator 
    return window.parent && !!window.parent.ripple;
}

function currentCordovaVersion() {
    // If running inside Cordova, returns a string similar to "3.5.0". Otherwise, returns a falsey value.
    // Note: We can only detect Cordova after its deviceready event has fired, so don't call login until then.
    return window.cordova && window.cordova.version;
}

function isSupportedCordovaVersion(version) {
    var versionParts = currentCordovaVersion().match(/^(\d+).(\d+)./);
    if (versionParts) {
        var major = Number(versionParts[1]),
            minor = Number(versionParts[2]),
            required = requiredCordovaVersion;
        return (major > required.major) ||
               (major === required.major && minor >= required.minor);
    }
    return false;
}

function hasInAppBrowser() {
    return !window.open;
}

function parseOAuthResultFromDoneUrl(url) {
    var successMessage = extractMessageFromUrl(url, "#token="),
        errorMessage = extractMessageFromUrl(url, "#error=");
    return {
        oAuthToken: successMessage ? JSON.parse(successMessage) : null,
        error: errorMessage ? new Error(errorMessage) : null
    };
}

function extractMessageFromUrl(url, separator) {
    var pos = url.indexOf(separator);
    return pos < 0 ? null : decodeURIComponent(url.substring(pos + separator.length));
}

function getSpinnerMarkup() {
    // The default InAppBrowser experience isn't ideal, as it just shows the user a blank white screen
    // until the login form appears. This might take 10+ seconds during which it looks broken.
    // Also on iOS it's possible for the InAppBrowser to initially show the results of the *previous*
    // login flow if the InAppBrowser was dismissed before completion, which is totally undesirable.
    // To fix both of these problems, we display a simple "spinner" graphic via a data: URL until
    // the current login screen has loaded. We generate the spinner via CSS rather than referencing
    // an animated GIF just because this makes the client library smaller overall.
    var vendorPrefix = "webkitTransform" in document.documentElement.style ? "-webkit-" : "",
        numSpokes = 12,
        spokesMarkup = "";
    for (var i = 0; i < numSpokes; i++) {
        spokesMarkup += "<div style='-prefix-transform: rotateZ(" + (180 + i * 360 / numSpokes) + "deg);" +
                                    "-prefix-animation-delay: " + (0.75 * i / numSpokes) + "s;'></div>";
    }
    return [
        "<!DOCTYPE html><html>",
        "<head><meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'></head>",
        "<body><div id='spinner'>" + spokesMarkup + "</div>",
        "<style type='text/css'>",
        "    #spinner { position: absolute; top: 50%; left: 50%; -prefix-animation: spinner 10s linear infinite; }",
        "    #spinner > div {",
        "        background: #333; opacity: 0; position: absolute; top: 11px; left: -2px; width: 4px; height: 21px; border-radius: 2px;",
        "        -prefix-transform-origin: 50% -11px; -prefix-animation: spinner-spoke 0.75s linear infinite;",
        "    }",
        "    @-prefix-keyframes spinner { 0% { -prefix-transform: rotateZ(0deg); } 100% { -prefix-transform: rotateZ(-360deg); } }",
        "    @-prefix-keyframes spinner-spoke { 0% { opacity: 0; } 5% { opacity: 1; } 70% { opacity: 0; } 100% { opacity: 0; } }",
        "</style>",
        "</body></html>"
    ].join("").replace(/-prefix-/g, vendorPrefix);
}
},{}],65:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('../Utilities/Extensions'),
    easyAuthRedirectUriKey = 'post_login_redirect_url';

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this login UI is usable in the current runtime.
    /// </summary>

    return isWebAuthBrokerAvailable();
};

exports.login = function (startUri, endUri, callback) {
    /// <summary>
    /// Displays the login UI and calls back on completion
    /// </summary>

    // Define shortcuts for namespaces
    var windowsWebAuthBroker = Windows.Security.Authentication.Web.WebAuthenticationBroker;
    var noneWebAuthOptions = Windows.Security.Authentication.Web.WebAuthenticationOptions.none;
    var successWebAuthStatus = Windows.Security.Authentication.Web.WebAuthenticationStatus.success;
    var activationKindWebAuthContinuation = Windows.ApplicationModel.Activation.ActivationKind.webAuthenticationBrokerContinuation;

    var webAuthBrokerSuccessCallback = null;
    var webAuthBrokerErrorCallback = null;
    var webAuthBrokerContinuationCallback = null;


    // define callbacks for WebAuthenticationBroker
    webAuthBrokerSuccessCallback = function (result) {
        var error = null;
        var token = null;

        if (result.responseStatus !== successWebAuthStatus) {
            error = result;
        }
        else {
            var callbackEndUri = result.responseData;
            var tokenAsJson = null;
            var i = callbackEndUri.indexOf('#token=');
            if (i > 0) {
                tokenAsJson = decodeURIComponent(callbackEndUri.substring(i + 7));
            }
            else {
                i = callbackEndUri.indexOf('#error=');
                if (i > 0) {
                    error = new Error(decodeURIComponent(callbackEndUri.substring(i + 7)));
                }
            }

            if (tokenAsJson !== null) {
                try {
                    token = JSON.parse(tokenAsJson);
                }
                catch (e) {
                    error = e;
                }
            }
        }

        callback(error, token);
    };
    webAuthBrokerErrorCallback = function (error) {
        callback(error, null);
    };
    // Continuation callback is used when we're running on WindowsPhone which uses 
    // AuthenticateAndContinue method instead of AuthenticateAsync, which uses different async model
    // Continuation callback need to be assigned to Application's 'activated' event.
    webAuthBrokerContinuationCallback = function (activationArgs) {
        if (activationArgs.detail.kind === activationKindWebAuthContinuation) {
            var result = activationArgs.detail.webAuthenticationResult;
            if (result.responseStatus == successWebAuthStatus) {
                webAuthBrokerSuccessCallback(result);
            } else {
                webAuthBrokerErrorCallback(result);
            }
            WinJS.Application.removeEventListener('activated', webAuthBrokerContinuationCallback);
        }
    };

    // If no endURI was given, we construct the startUri with a redirect parameter 
    // pointing to the app SID for single sign on.
    // Single sign-on requires that the application's Package SID 
    // be registered with the Microsoft Azure Mobile Service, but it provides a better 
    // experience as HTTP cookies are supported so that users do not have to
    // login in everytime the application is launched.
    if (endUri) {
        endUri = new Windows.Foundation.Uri(endUri);
    } else {
        var ssoQueryParameter = {},
            redirectUri = windowsWebAuthBroker.getCurrentApplicationCallbackUri().absoluteUri;

        ssoQueryParameter[easyAuthRedirectUriKey] = redirectUri;
        startUri = _.url.combinePathAndQuery(startUri, _.url.getQueryString(ssoQueryParameter));
    }
    
    startUri = new Windows.Foundation.Uri(startUri);
    
    // If authenticateAndContinue method is available, we should use it instead of authenticateAsync.
    // In the event that it exists, but fails (which is the case with Win 10), we fallback to authenticateAsync.
    var isLoginWindowLaunched;
    try {
        WinJS.Application.addEventListener('activated', webAuthBrokerContinuationCallback, true);
        windowsWebAuthBroker.authenticateAndContinue(startUri, endUri);

        isLoginWindowLaunched = true;
    } catch (ex) {
        WinJS.Application.removeEventListener('activated', webAuthBrokerContinuationCallback);
    }

    if (!isLoginWindowLaunched) {
        windowsWebAuthBroker.authenticateAsync(noneWebAuthOptions, startUri, endUri)
        .done(webAuthBrokerSuccessCallback, webAuthBrokerErrorCallback);
    }
};

function isWebAuthBrokerAvailable() {
    // If running on windows8/8.1 or Windows Phone returns true, otherwise false
    return !!(window.Windows &&
        window.Windows.Security &&
        window.Windows.Security.Authentication &&
        window.Windows.Security.Authentication.Web &&
        window.Windows.Security.Authentication.Web.WebAuthenticationBroker);
}

},{"../Utilities/Extensions":83}],66:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('./Utilities/Extensions'),
    constants = _dereq_('./constants'),
    Validate = _dereq_('./Utilities/Validate'),
    Platform = _dereq_('./Platform'),
    MobileServiceSyncContext = _dereq_('./sync/MobileServiceSyncContext'),
    MobileServiceSyncTable = _dereq_('./sync/MobileServiceSyncTable').MobileServiceSyncTable,
    MobileServiceTable = _dereq_('./MobileServiceTable'),
    MobileServiceLogin = _dereq_('./MobileServiceLogin');

var Push;
try {
    Push = _dereq_('./Push/Push').Push;
} catch (e) { }

var _alternateLoginHost = null;
Object.defineProperties(MobileServiceClient.prototype, {
    alternateLoginHost: {
        get: function () {
            return this._alternateLoginHost;
        },
        set: function (value) {
            if (_.isNullOrEmpty(value)) {
                this._alternateLoginHost = this.applicationUrl;
            }else if (_.url.isAbsoluteUrl(value) && _.url.isHttps(value)) {
                this._alternateLoginHost = value;
            } else {
                throw new Error(value + ' is not valid. Expected Absolute Url with https scheme');
            }
        }
    }
});
var _loginUriPrefix = null;
Object.defineProperties(MobileServiceClient.prototype, {
    loginUriPrefix: {
        get: function () {
            return this._loginUriPrefix;
        },
        set: function (value) {
            if (_.isNullOrEmpty(value)) {
                this._loginUriPrefix = ".auth/login";
            } else {
                _.isString(value);
                this._loginUriPrefix = value;
            }
        }
    }
});

/**
 * @class
 * @classdesc Client for connecting to the Azure Mobile Apps backend.
 * @protected
 * 
 * @param {string} applicationUrl The URL of the Azure Mobile backend.
 */
function MobileServiceClient(applicationUrl) {

    Validate.isString(applicationUrl, 'applicationUrl');
    Validate.notNullOrEmpty(applicationUrl, 'applicationUrl');

    this.applicationUrl = applicationUrl;

    var sdkInfo = Platform.getSdkInfo();
    var osInfo = Platform.getOperatingSystemInfo();
    var sdkVersion = sdkInfo.fileVersion.split(".").slice(0, 2).join(".");
    this.version = "ZUMO/" + sdkVersion + " (lang=" + sdkInfo.language + "; " +
                                            "os=" + osInfo.name + "; " +
                                            "os_version=" + osInfo.version + "; " +
                                            "arch=" + osInfo.architecture + "; " +
                                            "version=" + sdkInfo.fileVersion + ")";
    this.currentUser = null;
    this._serviceFilter = null;
    this._login = new MobileServiceLogin(this);

    var _syncContext = new MobileServiceSyncContext(this);

    /**
     * Get the associated {@link MobileServiceSyncContext} instance.
     * 
     * @returns {MobileServiceSyncContext} The associated {@link MobileServiceSyncContext}.
     */
    this.getSyncContext = function() {
        return _syncContext;
    };

    /**
     * Gets a reference to the specified backend table.
     * 
     * @param {string} tableName The name of the backend table. 
     * 
     * @returns {MobileServiceTable} A reference to the specified table in the backend.
     */
    this.getTable = function (tableName) {

        Validate.isString(tableName, 'tableName');
        Validate.notNullOrEmpty(tableName, 'tableName');
        return new MobileServiceTable(tableName, this);
    };

    /**
     * Gets a reference to the specified local table.
     * 
     * @param {string} tableName The name of the table in the local store. 
     * 
     * @returns {MobileServiceSyncTable} A refence to the specified table in the local store.
     */
    this.getSyncTable = function (tableName) {

        Validate.isString(tableName, 'tableName');
        Validate.notNullOrEmpty(tableName, 'tableName');
		
        return new MobileServiceSyncTable(tableName, this);
    };

    if (Push) {
        /**
         * @member {Push} push Push registration manager.
         * @instance
         * @memberof MobileServiceClient
         */
        this.push = new Push(this, MobileServiceClient._applicationInstallationId);
    }
    
}

/**
 * @callback MobileServiceClient.Next
 * @param {Request} request The outgoing request.
 * @param {MobileServiceClient.Completion} callback Completion callback.
 */

/**
 * @callback MobileServiceClient.Completion
 * @param {Error} error Error object.
 * @param {Response} response Server response.
 */

/**
 * @callback MobileServiceClient.Filter
 * @param {Request} request The outgoing request.
 * @param {MobileServiceClient.Next} next Next {@link MobileServiceClient.Filter} in the chain of filters.
 * @param {MobileServiceClient.Completion} callback Completion callback.
 */

/**
 * Create a new {@link MobileServiceClient} with a filter used to process all
 * of its network requests and responses.
 * 
 * @param {MobileServiceClient.Filter} serviceFilter The filter to use on the
 * {@link MobileServiceClient} instance's network requests and responses.
 * 
 * The Mobile Services HTTP pipeline is a chain of filters composed
 * together by giving each the next operation which it can invoke
 * (zero, one, or many times as necessary).
 * 
 * Filters are composed just like standard function composition.  If
 * we had the following:
 * 
 *     new MobileServiceClient().withFilter(F1).withFilter(F2),withFilter(F3),
 * 
 * it is conceptually equivalent to saying:
 * 
 *     var response = F3(F2(F1(next(request)));
 * 
 * @returns {MobileServiceClient} A client whose HTTP requests and responses will be
 * filtered as desired.
 * 
 * Here's a sample filter that will automatically retry request that fails with status code >= 400.
 * 
 * @example
 * function(req, next, callback) {
 *     next(req, function(err, rsp) {
 *         if (rsp.statusCode >= 400) {
 *             next(req, callback);
 *         } else {
 *             callback(err, rsp);
 *         }
 *     });
 * }
 *
 */
MobileServiceClient.prototype.withFilter = function (serviceFilter) {

    Validate.notNull(serviceFilter, 'serviceFilter');

    // Clone the current instance
    var client = new MobileServiceClient(this.applicationUrl);
    client.currentUser = this.currentUser;

    // Chain the service filter with any existing filters
    var existingFilter = this._serviceFilter;
    client._serviceFilter = _.isNull(existingFilter) ?
        serviceFilter :
        function (req, next, callback) {
            // compose existingFilter with next so it can be used as the next
            // of the new serviceFilter
            var composed = function (req, callback) {
                existingFilter(req, next, callback);
            };
            serviceFilter(req, composed, callback);
        };

    return client;
};

MobileServiceClient.prototype._request = function (method, uriFragment, content, ignoreFilters, headers, features, callback) {
    /// <summary>
    /// Perform a web request and include the standard Mobile Services headers.
    /// </summary>
    /// <param name="method" type="string">
    /// The HTTP method used to request the resource.
    /// </param>
    /// <param name="uriFragment" type="String">
    /// URI of the resource to request (relative to the Mobile Services
    /// runtime).
    /// </param>
    /// <param name="content" type="Object">
    /// Optional content to send to the resource.
    /// </param>
    /// <param name="ignoreFilters" type="Boolean" mayBeNull="true">
    /// Optional parameter to indicate if the client filters should be ignored
    /// and the request should be sent directly. Is false by default.
    /// </param>
    /// <param name="headers" type="Object">
    /// Optional request headers
    /// </param>
    /// <param name="features" type="Array">
    /// Codes for features which are used in this request, sent to the server for telemetry.
    /// </param>
    /// <param name="callback" type="function(error, response)">
    /// Handler that will be called on the response.
    /// </param>

    // Account for absent optional arguments
    if (_.isNull(callback) && (typeof features === 'function')) {
        callback = features;
        features = null;
    }

    if (_.isNull(callback) && (typeof headers === 'function')) {
        callback = headers;
        headers = null;
    }

    if (_.isNull(callback) && (typeof ignoreFilters === 'function')) {
        callback = ignoreFilters;
        ignoreFilters = false;
    }

    if (_.isNull(callback) && (typeof content === 'function')) {
        callback = content;
        content = null;
    }

    Validate.isString(method, 'method');
    Validate.notNullOrEmpty(method, 'method');
    Validate.isString(uriFragment, 'uriFragment');
    Validate.notNull(uriFragment, 'uriFragment');
    Validate.notNull(callback, 'callback');

    // Create the absolute URI
    var options = { type: method.toUpperCase() };
    if (_.url.isAbsoluteUrl(uriFragment)) {
        options.url = uriFragment;
    } else {
        options.url = _.url.combinePathSegments(this.applicationUrl, uriFragment);
    }

    // Set MobileServices authentication, application, User-Agent and telemetry headers
    options.headers = {};
    if (!_.isNull(headers)) {
        _.extend(options.headers, headers);
    }
    options.headers["X-ZUMO-INSTALLATION-ID"] = MobileServiceClient._applicationInstallationId;
    if (this.currentUser && !_.isNullOrEmpty(this.currentUser.mobileServiceAuthenticationToken)) {
        options.headers["X-ZUMO-AUTH"] = this.currentUser.mobileServiceAuthenticationToken;
    }
    if (!_.isNull(MobileServiceClient._userAgent)) {
        options.headers["User-Agent"] = MobileServiceClient._userAgent;
    }
    if (!_.isNullOrEmpty["X-ZUMO-VERSION"]) {
        options.headers["X-ZUMO-VERSION"] = this.version;
    }

    if (_.isNull(options.headers[constants.featuresHeaderName]) && features && features.length) {
        options.headers[constants.featuresHeaderName] = features.join(',');
    }

    // Add any content as JSON
    if (!_.isNull(content)) {
        if (!_.isString(content)) {
            options.data = _.toJson(content);
        } else {
            options.data = content;
        }

        if (!_.hasProperty(options.headers, ['Content-Type', 'content-type', 'CONTENT-TYPE', 'Content-type'])) {
            options.headers['Content-Type'] = 'application/json';
        }
    } else {
        // options.data must be set to null if there is no content or the xhr object
        // will set the content-type to "application/text" for non-GET requests.
        options.data = null;
    }

    // Treat any >=400 status codes as errors.  Also treat the status code 0 as
    // an error (which indicates a connection failure).
    var handler = function (error, response) {
        if (!_.isNull(error)) {
            error = _.createError(error);
        } else if (!_.isNull(response) && (response.status >= 400 || response.status === 0)) {
            error = _.createError(null, response);
            response = null;
        }
        callback(error, response);
    };

    // Make the web request
    if (!_.isNull(this._serviceFilter) && !ignoreFilters) {
        this._serviceFilter(options, Platform.webRequest, handler);
    } else {
        Platform.webRequest(options, handler);
    }
};

/**
 * Log a user into an Azure Mobile Apps backend.
 * 
 * @function
 * 
 * @param {string} provider Name of the authentication provider to use; one of _'facebook'_, _'twitter'_, _'google'_,
 *                          _'aad'_ (equivalent to _'windowsazureactivedirectory'_) or _'microsoftaccount'_.
 * @param {object} options Contains additional parameter information.
 * @param {object} options.token provider specific object with existing OAuth token to log in with.
 * @param {boolean} options.useSingleSignOn Indicates if single sign-on should be used. This parameter only applies to Windows clients 
 *                                  and is ignored on other platforms. Single sign-on requires that the 
 *                                  application's Package SID be registered with the Microsoft Azure Mobile Apps backend,
 *                                  but it provides a better experience as HTTP cookies are supported so that users 
 *                                  do not have to login in everytime the application is launched.
 * @param {object} options.parameters Any additional provider specific query string parameters.
 * @returns {Promise} A promise that is either resolved with the logged in user or rejected with the error.
 */
MobileServiceClient.prototype.loginWithOptions = Platform.async(
     function (provider, options, callback) {
         this._login.loginWithOptions(provider, options, callback);
     });

/**
 * Log a user into an Azure Mobile Apps backend.
 * 
 * @function
 * 
 * @param {string} provider Name of the authentication provider to use; one of _'facebook'_, _'twitter'_, _'google'_,
 *                          _'aad'_ (equivalent to _'windowsazureactivedirectory'_) or _'microsoftaccount'_. If no
 *                          provider is specified, the 'token' parameter is considered a Microsoft Account
 *                          authentication token. If a provider is specified, the 'token' parameter is 
 *                          considered a provider-specific authentication token.
 * @param {object} token provider specific object with existing OAuth token to log in with.  
 * @param {boolean} useSingleSignOn Indicates if single sign-on should be used. This parameter only applies to Windows clients 
 *                                  and is ignored on other platforms. Single sign-on requires that the 
 *                                  application's Package SID be registered with the Microsoft Azure Mobile Apps backend,
 *                                  but it provides a better experience as HTTP cookies are supported so that users 
 *                                  do not have to login in everytime the application is launched.
 * @returns {Promise} A promise that is either resolved with the logged in user or rejected with the error.
 */
MobileServiceClient.prototype.login = Platform.async(
    function (provider, token, useSingleSignOn, callback) {
        this._login.login(provider, token, useSingleSignOn, callback);
    });

/**
 * Log a user out of the Mobile Apps backend.
 * 
 * @function
 * 
 * @returns {Promise} A promise that is either resolved or rejected with the error. 
 */
MobileServiceClient.prototype.logout = Platform.async(function(callback) {
    this.currentUser = null;
    callback();
});

/**
 * Invokes the specified custom api and returns a response object.
 * 
 * @function
 * 
 * @param {string} apiName The custom api to invoke.
 * @param {object} options Additional parameter information.
 * @param {object} options.body The body of the HTTP request.
 * @param {string} options.method The HTTP method to use in the request, with the default being 'POST'.
 * @param {object} options.parameters Additional query string parameters, if any, with property names and
 *                                    values as property keys and values respectively. 
 * @param {object} options.headers HTTP request headers.
 * 
 * @returns {Promise} A promise that is resolved with an _XMLHttpRequest_ object if the API is invoked succesfully.
 *                    If the server response is JSON, it is deserialized into _XMLHttpRequest.result_.
 *                    If _invokeApi_ fails, the promise is rejected with the error.
 */
MobileServiceClient.prototype.invokeApi = Platform.async(
    function (apiName, options, callback) {

        Validate.isString(apiName, 'apiName');

        // Account for absent optional arguments
        if (_.isNull(callback)) {
            if (typeof options === 'function') {
                callback = options;
                options = null;
            }
        }
        Validate.notNull(callback, 'callback');

        var parameters, method, body, headers;
        if (!_.isNull(options)) {
            parameters = options.parameters;
            if (!_.isNull(parameters)) {
                Validate.isValidParametersObject(options.parameters);
            }

            method = options.method;
            body = options.body;
            headers = options.headers;
        }

        headers = headers || {};

        if (_.isNull(method)) {
            method = "POST";
        }

        // if not specified, default to return results in JSON format
        if (_.isNull(headers.accept)) {
            headers.accept = 'application/json';
        }

        // Add version header on API requests
        if (_.isNull(headers[constants.apiVersionHeaderName])) {
            headers[constants.apiVersionHeaderName] = constants.apiVersion;
        }

        // Construct the URL
        var url;
        if (_.url.isAbsoluteUrl(apiName)) {
            url = apiName;
        } else {
            url = _.url.combinePathSegments("api", apiName);
        }
        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            url = _.url.combinePathAndQuery(url, queryString);
        }

        var features = [];
        if (!_.isNullOrEmpty(body)) {
            features.push(_.isString(body) ?
                constants.features.GenericApiCall :
                constants.features.JsonApiCall);
        }

        if (!_.isNull(parameters)) {
            features.push(constants.features.AdditionalQueryParameters);
        }

        // Make the request
        this._request(
            method,
            url,
            body,
            null,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    callback(error, null);
                } else {
                    var contentType;
                    if (typeof response.getResponseHeader !== 'undefined') { // (when not using IframeTransport, IE9)
                        contentType = response.getResponseHeader('Content-Type');
                    }

                    // If there was no header / can't get one, try json
                    if (!contentType) {
                        try {
                            response.result = _.fromJson(response.responseText);
                        } catch (e) {
                            // Do nothing, since we don't know the content-type, failing may be ok
                        }
                    } else if (contentType.toLowerCase().indexOf('json') !== -1) {
                        response.result = _.fromJson(response.responseText);
                    }

                    callback(null, response);
                }
            });

    });

function getApplicationInstallationId() {
    /// <summary>
    /// Gets or creates the static application installation ID.
    /// </summary>
    /// <returns type="string">
    /// The application installation ID.
    /// </returns>

    // Get or create a new installation ID that can be passed along on each
    // request to provide telemetry data
    var applicationInstallationId = null;

    // Check if the config settings exist
    var path = "MobileServices.Installation.config";
    var contents = Platform.readSetting(path);
    if (!_.isNull(contents)) {
        // Parse the contents of the file as JSON and pull out the
        // application's installation ID.
        try {
            var config = _.fromJson(contents);
            applicationInstallationId = config.applicationInstallationId;
        } catch (ex) {
            // Ignore any failures (like invalid JSON, etc.) which will allow
            // us to fall through to and regenerate a valid config below
        }
    }

    // If no installation ID was found, generate a new one and save the config
    // settings.  This is pulled out as a separate function because we'll do it
    // even if we successfully read an existing config but there's no
    // installation ID.
    if (_.isNullOrEmpty(applicationInstallationId)) {
        applicationInstallationId = _.createUniqueInstallationId();

        // TODO: How many other settings should we write out as well?
        var configText = _.toJson({ applicationInstallationId: applicationInstallationId });
        Platform.writeSetting(path, configText);
    }

    return applicationInstallationId;
}

/// <summary>
/// Get or set the static _applicationInstallationId by checking the settings
/// and create the value if necessary.
/// </summary>
MobileServiceClient._applicationInstallationId = getApplicationInstallationId();

/// <summary>
/// Get or set the static _userAgent by calling into the Platform.
/// </summary>
MobileServiceClient._userAgent = Platform.getUserAgent();

// Define the module exports
module.exports = MobileServiceClient;

},{"./MobileServiceLogin":67,"./MobileServiceTable":68,"./Platform":76,"./Push/Push":80,"./Utilities/Extensions":83,"./Utilities/Validate":86,"./constants":88,"./sync/MobileServiceSyncContext":92,"./sync/MobileServiceSyncTable":93}],67:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('./Utilities/Extensions');
var Validate = _dereq_('./Utilities/Validate');
var Platform = _dereq_('./Platform');

var loginUrl = ".auth/login";
var loginDone = "done";
var sessionModeKey = 'session_mode';
var sessionModeValueToken = 'token';

function MobileServiceLogin(client, ignoreFilters) {
    /// <summary>
    /// Initializes a new instance of the MobileServiceLogin class.
    /// </summary>
    /// <param name="client" type="MobileServiceClient" mayBeNull="false">
    /// Reference to the MobileServiceClient associated with this login.
    /// </param>
    /// <param name="ignoreFilters" type="Boolean" mayBeNull="true">
    /// Optional parameter to indicate if the client filters should be ignored
    /// and requests should be sent directly. Is true by default. This should
    /// only be set to false for testing purposes when filters are needed to intercept
    /// and validate requests and responses.
    /// </param>

    // Account for absent optional arguments
    if (_.isNull(ignoreFilters)) {
        ignoreFilters = true;
    }

    // Validate arguments
    Validate.notNull(client);
    Validate.isObject(client, 'client');

    // Create read/write fields
    this._loginState = { inProcess: false, cancelCallback: null };
    this.ignoreFilters = ignoreFilters;

    // Create get accessors for read-only fields
    this.getMobileServiceClient = function () {
        /// <summary>
        /// Gets the MobileServiceClient associated with this table.
        /// <summary>
        /// <returns type="MobileServiceClient">
        /// The MobileServiceClient associated with this table.
        /// </returns>
        return client;
    };

    this.getLoginInProcess = function () {
        /// <summary>
        /// Indicates if a login is currently in process or not.
        /// <summary>
        /// <returns type="Boolean">
        /// True if a login is in process and false otherwise.
        /// </returns>
        return this._loginState.inProcess;
    };
}

MobileServiceLogin.prototype.loginWithOptions = function (provider, options, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application given a provider name with
    /// given options.
    /// </summary>
    /// <param name="provider" type="String" mayBeNull="false">
    /// Name of the authentication provider to use; one of 'facebook', 'twitter', 'google', 
    /// 'windowsazureactivedirectory' (can also use 'aad')
    /// or 'microsoftaccount'.
    /// </param>
    /// <param name="options" type="Object" mayBeNull="true">
    /// Contains additional parameter information, valid values are:
    ///    token: provider specific object with existing OAuth token to log in with
    ///    useSingleSignOn: Only applies to Windows 8 clients.  Will be ignored on other platforms.
    /// Indicates if single sign-on should be used. Single sign-on requires that the 
    /// application's Package SID be registered with the Microsoft Azure Mobile Service, 
    /// but it provides a better experience as HTTP cookies are supported so that users 
    /// do not have to login in everytime the application is launched.
    ///    parameters: Any additional provider specific query string parameters.
    /// </param>
    /// <param name="callback" type="Function" mayBeNull="true">
    /// Optional callback accepting (error, user) parameters.
    /// </param>

    Validate.isString(provider, 'provider');
    Validate.notNull(provider, 'provider');

    if (_.isNull(callback)) {
        if (!_.isNull(options) && typeof options === 'function') {
            callback = options;
            options = null;
        } else {
            Validate.notNull(null, 'callback');
        }
    }

    // loginWithOptions('a.b.c')
    if (!options && this._isAuthToken(provider)) {
        this.loginWithMobileServiceToken(provider, callback);
    } else {
        // loginWithOptions('facebook', {});
        // loginWithOptions('facebook');
        options = options || {};
        this.loginWithProvider(provider, options.token, options.useSingleSignOn, options.parameters, callback);
    }
};

MobileServiceLogin.prototype.login = function (provider, token, useSingleSignOn, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application given a provider name and optional token object
    /// Microsoft Account authentication token.
    /// </summary>
    /// <param name="provider" type="String" mayBeNull="true">
    /// Optional name of the authentication provider to use; one of 'facebook', 'twitter', 'google',
    /// 'windowsazureactivedirectory' (can also use 'aad'), or 'microsoftaccount'.
    /// </param>
    /// <param name="token" type="Object"  mayBeNull="true">
    /// Optional provider specific object with existing OAuth token to log in with or
    /// a JWT Mobile Services authentication token if the provider is null.
    /// </param>
    /// <param name="useSingleSignOn" type="Boolean" mayBeNull="true">
    /// Only applies to Windows 8 clients.  Will be ignored on other platforms.
    /// Indicates if single sign-on should be used. Single sign-on requires that the 
    /// application's Package SID be registered with the Microsoft Azure Mobile Service, 
    /// but it provides a better experience as HTTP cookies are supported so that users 
    /// do not have to login in everytime the application is launched.
    /// </param>
    /// <param name="callback" type="Function"  mayBeNull="true">
    /// Optional callback accepting (error, user) parameters.
    /// </param>

    // Account for absent optional arguments
    if (_.isNull(callback)) {
        if (!_.isNull(useSingleSignOn) && (typeof useSingleSignOn === 'function')) {
            callback = useSingleSignOn;
            useSingleSignOn = null;
        }
        else if (!_.isNull(token) && (typeof token === 'function')) {
            callback = token;
            useSingleSignOn = null;
            token = null;
        }
    }
    if (_.isNull(useSingleSignOn)) {
        if (_.isBool(token)) {
            useSingleSignOn = token;
            token = null;
        }
        else {
            useSingleSignOn = false;
        }
    }

    // Determine if the provider is actually a Mobile Services authentication token
    if (_.isNull(token) && this._isAuthToken(provider)) {
        token = provider;
        provider = null;
    }

    // Validate parameters; there must be either a provider, a token or both
    if (_.isNull(provider)) {
        Validate.notNull(token);
        Validate.isString(token);
    }
    if (_.isNull(token)) {
        Validate.notNull(provider);
        Validate.isString(provider);
        provider = provider.toLowerCase();
    }

    if (!_.isNull(provider)) {
        if (provider.toLowerCase() === 'windowsazureactivedirectory') {
            // The mobile service REST API uses '/login/aad' for Microsoft Azure Active Directory
            provider = 'aad';
        }
        this.loginWithProvider(provider, token, useSingleSignOn, {}, callback);
    }
    else {
        this.loginWithMobileServiceToken(token, callback);
    }
};

MobileServiceLogin.prototype._isAuthToken = function (value) {
    return value && _.isString(value) && value.split('.').length === 3;
};

MobileServiceLogin.prototype.loginWithMobileServiceToken = function (authenticationToken, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application given an Mobile Service authentication token.
    /// </summary>
    /// <param name="authenticationToken" type="String">
    /// OAuth access token that authenticates the user.
    /// </param>
    /// <param name="callback" type="Function">
    /// Optional callback accepting (error, user) parameters.
    /// </param>

    var self = this;
    var client = self.getMobileServiceClient();

    Validate.isString(authenticationToken, 'authenticationToken');
    Validate.notNullOrEmpty(authenticationToken, 'authenticationToken');

    client._request(
        'POST',
        loginUrl,
        { authenticationToken: authenticationToken },
        self.ignoreFilters,
        function (error, response) {
            onLoginResponse(error, response, client, callback);
        });
};

MobileServiceLogin.prototype.loginWithProvider = function (provider, token, useSingleSignOn, parameters, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application given a provider name and optional token object.
    /// </summary>
    /// <param name="provider" type="String">
    /// Name of the authentication provider to use; one of 'facebook', 'twitter', 'google',
    /// 'windowsazureactivedirectory' (can also use 'aad'), or 'microsoftaccount'.
    /// </param>
    /// <param name="token" type="Object">
    /// Optional, provider specific object with existing OAuth token to log in with.
    /// </param>
    /// <param name="useSingleSignOn" type="Boolean">
    /// Optional, indicates if single sign-on should be used.  Single sign-on requires that the
    /// application's Package SID be registered with the Microsoft Azure Mobile Service, but it
    /// provides a better experience as HTTP cookies are supported so that users do not have to
    /// login in everytime the application is launched. Is false be default.
    /// </param>
    /// <param name="parameters" type="Object">
    /// Any additional provider specific query string parameters. 
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to execute when the login completes: callback(error, user).
    /// </param>

    // Validate arguments
    Validate.isString(provider, 'provider');
    if (!_.isNull(token)) {
        Validate.isObject(token, 'token');
    }

    // Throw if a login is already in process and is not cancellable
    if (this._loginState.inProcess) {
        var didCancel = this._loginState.cancelCallback && this._loginState.cancelCallback();
        if (!didCancel) {
            throw new Error('Cannot start a login operation because login is already in progress.');
        }
    }

    provider = provider.toLowerCase();

    // Either login with the token or the platform specific login control.
    if (!_.isNull(token)) {
        loginWithProviderAndToken(this, provider, token, parameters, callback);
    }
    else {
        loginWithLoginControl(this, provider, useSingleSignOn, parameters, callback);
    }
};

function onLoginComplete(error, token, client, callback) {
    /// <summary>
    /// Handles the completion of the login and calls the user's callback with
    /// either a user or an error.
    /// </summary>
    /// <param name="error" type="string" mayBeNull="true">
    /// Optional error that may have occurred during login. Will be null if the
    /// login succeeded and their is a token.
    /// </param>
    /// <param name="token" type="string" mayBeNull="true">
    /// Optional token that represents the logged-in user. Will be null if the
    /// login failed and their is an error.
    /// </param>
    /// <param name="client" type="MobileServiceClient">
    /// The Mobile Service client associated with the login.
    /// </param>
    /// <param name="callback" type="Function" mayBeNull="true">
    /// The callback to execute when the login completes: callback(error, user).
    /// </param>
    var user = null;

    if (_.isNull(error)) {

        // Validate the token
        if (_.isNull(token) ||
            !_.isObject(token) ||
            !_.isObject(token.user) ||
            !_.isString(token.authenticationToken)) {
            error = Platform.getResourceString("MobileServiceLogin_InvalidResponseFormat");
        }
        else {
            // Set the current user on the client and return it in the callback
            client.currentUser = token.user;
            client.currentUser.mobileServiceAuthenticationToken = token.authenticationToken;
            user = client.currentUser;
        }
    }

    if (!_.isNull(callback)) {
        callback(error, user);
    }
}

function onLoginResponse(error, response, client, callback) {
    /// <summary>
    /// Handles the completion of the login HTTP call and calls the user's callback with
    /// either a user or an error.
    /// </summary>
    /// <param name="error" type="string" mayBeNull="true">
    /// Optional error that may have occurred during login. Will be null if the
    /// login succeeded and their is a token.
    /// </param>
    /// <param name="response" type="string" mayBeNull="true">
    /// Optional HTTP login response from the Mobile Service. Will be null if the
    /// login failed and their is an error.
    /// </param>
    /// <param name="client" type="MobileServiceClient">
    /// The Mobile Service client associated with the login.
    /// </param>
    /// <param name="callback" type="Function" mayBeNull="true">
    /// The callback to execute when the login completes: callback(error, user).
    /// </param>

    var mobileServiceToken = null;
    if (_.isNull(error)) {
        try {
            mobileServiceToken = _.fromJson(response.responseText);
        }
        catch (e) {
            error = e;
        }
    }

    onLoginComplete(error, mobileServiceToken, client, callback);
}

function loginWithProviderAndToken(login, provider, token, parameters, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application given a provider name and token object.
    /// </summary>
    /// <param name="login" type="MobileServiceLogin">
    /// The login instance that holds the context used with the login process.
    /// </param>
    /// <param name="provider" type="String">
    /// Name of the authentication provider to use; one of 'facebook', 'twitter', 'google', or 
    /// 'microsoftaccount'. The provider should already have been validated.
    /// </param>
    /// <param name="token" type="Object">
    /// Provider specific object with existing OAuth token to log in with.
    /// </param>
    /// <param name="parameters" type="Object">
    /// Any additional provider specific query string parameters.
    /// </param>
    /// <param name="callback" type="Function" mayBeNull="true">
    /// The callback to execute when the login completes: callback(error, user).
    /// </param>

    var client = login.getMobileServiceClient();

    // This design has always been problematic, because the operation can take arbitrarily
    // long and there is no way for the UI to cancel it. We should probably remove this
    // one-at-a-time restriction.
    login._loginState = { inProcess: true, cancelCallback: null };

    var url = _.url.combinePathSegments(client.alternateLoginHost || client.applicationUrl,
                                        client.loginUriPrefix || loginUrl,
                                        provider);

    if (!_.isNull(parameters)) {
        var queryString = _.url.getQueryString(parameters);
        url = _.url.combinePathAndQuery(url, queryString);
    }

    // Invoke the POST endpoint to exchange provider-specific token for a 
    // Microsoft Azure Mobile Services token
    client._request(
        'POST',
        url,
        token,
        login.ignoreFilters,
        function (error, response) {
            login._loginState = { inProcess: false, cancelCallback: null };
            onLoginResponse(error, response, client, callback);
        });
}

function loginWithLoginControl(login, provider, useSingleSignOn, parameters, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application using a platform specific
    /// login control that will present the user with the given provider's login web page.
    /// </summary>
    /// <param name="login" type="MobileServiceLogin">
    /// The login instance that holds the context used with the login process.
    /// </param>
    /// <param name="provider" type="String">
    /// Name of the authentication provider to use; one of 'facebook', 'twitter', 'google', or 'microsoftaccount'.
    /// </param>
    /// <param name="useSingleSignOn" type="Boolean">
    /// Optional, indicates if single sign-on should be used.  Single sign-on requires that the
    /// application's Package SID be registered with the Microsoft Azure Mobile Service, but it
    /// provides a better experience as HTTP cookies are supported so that users do not have to
    /// login in everytime the application is launched. Is false be default.
    /// </param>
    /// <param name="parameters" type="Object">
    /// Any additional provider specific query string parameters.
    /// </param>
    /// <param name="callback" type="Function"  mayBeNull="true">
    /// The callback to execute when the login completes: callback(error, user).
    /// </param>

    var client = login.getMobileServiceClient();
    var startUri = _.url.combinePathSegments(
        client.alternateLoginHost || client.applicationUrl,
        client.loginUriPrefix || loginUrl,
        provider);

    var endUri = null,
        queryParams = {},
        key;

    // Make a copy of the query parameters and set the session mode to token.
    for (key in parameters) {
        queryParams[key] = parameters[key];
    }
    queryParams[sessionModeKey] = sessionModeValueToken;

    var queryString = _.url.getQueryString(queryParams);
    startUri = _.url.combinePathAndQuery(startUri, queryString);

    // If not single sign-on, then we need to construct a non-null end uri.
    if (!useSingleSignOn) {
        endUri = _.url.combinePathSegments(
            client.alternateLoginHost || client.applicationUrl,
            client.loginUriPrefix || loginUrl,
            loginDone);
    }

    login._loginState = { inProcess: true, cancelCallback: null }; // cancelCallback gets set below

    // Call the platform to launch the login control, capturing any
    // 'cancel' callback that it returns
    var platformResult = Platform.login(
        startUri,
        endUri,
        function (error, mobileServiceToken) {
            login._loginState = { inProcess: false, cancelCallback: null };
            onLoginComplete(error, mobileServiceToken, client, callback);
        },
        provider,
        client.applicationUrl
    );

    if (login._loginState.inProcess && platformResult && platformResult.cancelCallback) {
        login._loginState.cancelCallback = platformResult.cancelCallback;
    }
}

// Define the module exports
module.exports = MobileServiceLogin;

},{"./Platform":76,"./Utilities/Extensions":83,"./Utilities/Validate":86}],68:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('./Utilities/Extensions');
var Validate = _dereq_('./Utilities/Validate');
var Platform = _dereq_('./Platform');
var Query = _dereq_('azure-query-js').Query;
var constants = _dereq_('./constants');
var tableHelper = _dereq_('./tableHelper');

// Name of the reserved Mobile Services ID member.
var idPropertyName = "id";

// The route separator used to denote the table in a uri like
// .../{app}/collections/{coll}.
var tableRouteSeperatorName = "tables";
var idNames = ["ID", "Id", "id", "iD"];
var nextLinkRegex = /^(.*?);\s*rel\s*=\s*(\w+)\s*$/;

var SystemProperties = {
    None: 0,
    CreatedAt: 1,
    UpdatedAt: 2,
    Version: 4,
    All: 0xFFFF
};

var MobileServiceSystemColumns = {
    CreatedAt: "createdAt",
    UpdatedAt: "updatedAt",
    Version: "version",
    Deleted: "deleted"
};

/**
 * @class
 * @classdesc Represents a table in the Azure Mobile Apps backend.
 * @protected
 * 
 * @param {string} tableName Name of the table in the backend.
 * @param {MobileServiceClient} client The {@link MobileServiceClient} instance associated with this table.
 */
function MobileServiceTable(tableName, client) {

    /**
     * Gets the name of the backend table.
     * 
     * @returns {string} The name of the table.
     */
    this.getTableName = function () {
        return tableName;
    };

    /**
     * Gets the {@link MobileServiceClient} instance associated with this table.
     * 
     * @returns {MobileServiceClient} The {@link MobileServiceClient} associated with this table.
     *///FIXME
    this.getMobileServiceClient = function () {
        return client;
    };

    // Features to associate with all table operations
    this._features = undefined;
}

MobileServiceTable.SystemProperties = SystemProperties;

// We have an internal _read method using callbacks since it's used by both
// table.read(query) and query.read().
MobileServiceTable.prototype._read = function (query, parameters, callback) {
    /// <summary>
    /// Query a table.
    /// </summary>
    /// <param name="query" type="Object" mayBeNull="true">
    /// The query to execute.  It can be null or undefined to get the entire
    /// collection.
    /// </param>
    /// <param name="parameters" type="Object" mayBeNull="true">
    /// An object of user-defined parameters and values to include in the request URI query string.
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to invoke when the query is complete.
    /// </param>

    // Account for absent optional arguments
    if (_.isNull(callback))
    {
        if (_.isNull(parameters) && (typeof query === 'function')) {
            callback = query;
            query = null;
            parameters = null;
        } else if (typeof parameters === 'function') {
            callback = parameters;
            parameters = null;
            if (!_.isNull(query) && _.isObject(query)) {
                // This 'query' argument could be either the query or the user-defined 
                // parameters object since both are optional.  A query is either (a) a simple string 
                // or (b) an Object with an toOData member. A user-defined parameters object is just 
                // an Object.  We need to detect which of these has been passed in here.
                if (!_.isString(query) && _.isNull(query.toOData)) {
                    parameters = query;
                    query = null;
                }
            }
        }
    }

    // Validate the arguments
    if (query && _.isString(query)) {
        Validate.notNullOrEmpty(query, 'query');
    }
    if (!_.isNull(parameters)) {
        Validate.isValidParametersObject(parameters, 'parameters');
    }
    Validate.notNull(callback, 'callback');

    // Get the query string
    var tableName = this.getTableName();
    var queryString = null;
    var projection = null;
    var features = this._features || [];
    if (_.isString(query)) {
        queryString = query;
        if (!_.isNullOrEmpty(query)) {
            features.push(constants.features.TableReadRaw);
        }
    } else if (_.isObject(query) && !_.isNull(query.toOData)) {
        if (query.getComponents) {
            features.push(constants.features.TableReadQuery);
            var components = query.getComponents();
            projection = components.projection;
            if (components.table) {
                // If the query has a table name, make sure it's compatible with
                // the table executing the query
                
                if (tableName !== components.table) {
                    var message = _.format(Platform.getResourceString("MobileServiceTable_ReadMismatchedQueryTables"), tableName, components.table);
                    callback(new Error(message), null);
                    return;
                }

                // The oDataQuery will include the table name; we need to remove
                // because the url fragment already includes the table name.
                var oDataQuery = query.toOData();
                queryString = oDataQuery.replace(new RegExp('^/' + components.table), '');
            }
        }
    }

    addQueryParametersFeaturesIfApplicable(features, parameters);

    // Add any user-defined query string parameters
    if (!_.isNull(parameters)) {
        var userDefinedQueryString = _.url.getQueryString(parameters);
        if (!_.isNullOrEmpty(queryString)) {
            queryString += '&' + userDefinedQueryString;
        }
        else {
            queryString = userDefinedQueryString;
        }
    }
    
    // Construct the URL
    var urlFragment = queryString;
    if (!_.url.isAbsoluteUrl(urlFragment)) {
        urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, tableName);
        if (!_.isNull(queryString)) {
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }
    }

    var headers = { };
    headers[constants.apiVersionHeaderName] = constants.apiVersion;

    // Make the request
    this.getMobileServiceClient()._request(
        'GET',
        urlFragment,
        null,
        false,
        headers,
        features,
        function (error, response) {
            var values = null;
            if (_.isNull(error)) {
                // Parse the response
                values = _.fromJson(response.responseText);

                // If the values include the total count, we'll attach that
                // directly to the array
                if (values &&
                    !Array.isArray(values) &&
                    typeof values.count !== 'undefined' &&
                    typeof values.results !== 'undefined') {
                    // Create a new total count property on the values array
                    values.results.totalCount = values.count;
                    values = values.results;
                }

                // If we have a projection function, apply it to each item
                // in the collection
                if (projection !== null) {
                    var i = 0;
                    for (i = 0; i < values.length; i++) {
                        values[i] = projection.call(values[i]);
                    }
                }

                // Grab link header when possible
                if (Array.isArray(values) && response.getResponseHeader && _.isNull(values.nextLink)) {
                    try {
                        var link = response.getResponseHeader('Link');
                        if (!_.isNullOrEmpty(link)) {
                            var result = nextLinkRegex.exec(link);

                            // Only add nextLink when relation is next
                            if (result && result.length === 3 && result[2] == 'next') {
                                values.nextLink = result[1];
                            }
                        }
                    } catch (ex) {
                        // If cors doesn't allow us to access the Link header
                        // Just continue on without it
                    }
                }
            }
            callback(error, values);
        });
};

/**
 * Reads records from the backend table.
 * 
 * @function
 * @instance
 * @public
 * @memberof MobileServiceTable
 * 
 * @param {(QueryJs | string)} query Either, a {@link QueryJs} object representing the query to use while
 *                        reading the backend table, OR, a URL encoded OData string for querying. 
 * @param {object} parameters An object of user-defined parameters and values to include in the request URI query string.
 * 
 * @returns {Promise} A promise that is resolved with an array of records read from the table, if the read is successful.
 *                    If read fails, the promise is rejected with the error.
 */
MobileServiceTable.prototype.read = Platform.async(MobileServiceTable.prototype._read);

/**
 * Inserts a new object / record in the backend table.
 * 
 * @function
 * @instance
 * @public
 * @memberof MobileServiceTable
 * 
 * @param {object} instance Object / record to be inserted in the backend table.
 * @param {string | number} instance.id id of the object / record.
 * @param {object} parameters An object of user-defined parameters and values to include in the request URI query string.
 * 
 * @returns {Promise} A promise that is resolved with the inserted object when the insert operation is completed successfully.
 *                    If the operation fails, the promise is rejected with the error.
 */
MobileServiceTable.prototype.insert = Platform.async(
    function (instance, parameters, callback) {

        // Account for absent optional arguments
        if (_.isNull(callback) && (typeof parameters === 'function')) {
            callback = parameters;
            parameters = null;
        }

        // Validate the arguments
        Validate.notNull(instance, 'instance');
        if (!_.isNull(parameters)) {
            Validate.isValidParametersObject(parameters);
        }
        Validate.notNull(callback, 'callback');

        // Integer Ids can not have any Id set
        for (var i in idNames) {
            var id = instance[idNames[i]];

            if (!_.isNullOrZero(id)) {
                if (_.isString(id)) {
                    // String Id's are allowed iif using 'id'
                    if (idNames[i] !== idPropertyName) {
                        throw new Error('Cannot insert if the ' + idPropertyName + ' member is already set.');
                    } else {
                        Validate.isValidId(id, idPropertyName);
                    }
                } else {
                    throw new Error('Cannot insert if the ' + idPropertyName + ' member is already set.');
                }
            }
        }

        var features = this._features || [];
        features = addQueryParametersFeaturesIfApplicable(features, parameters);

        // Construct the URL
        var urlFragment = _.url.combinePathSegments(tableRouteSeperatorName, this.getTableName());
        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }

        var headers = { };
        headers[constants.apiVersionHeaderName] = constants.apiVersion;

        // Make the request
        this.getMobileServiceClient()._request(
            'POST',
            urlFragment,
            instance,
            false,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    callback(error, null);
                } else {
                    var result = getItemFromResponse(response);
                    result = Platform.allowPlatformToMutateOriginal(instance, result);
                    callback(null, result);
                }
            });
    });

/**
 * Update an object / record in the backend table.
 * 
 * @function
 * @instance
 * @public
 * @memberof MobileServiceTable
 * 
 * @param {object} instance New value of the object / record.
 * @param {string | number} instance.id The id of the object / record identifies the record that will be updated in the table.
 * @param {object} parameters An object of user-defined parameters and values to include in the request URI query string.
 * 
 * @returns {Promise} A promise that is resolved when the operation is completed successfully.
 *                    If the operation fails, the promise is rejected with the error.
 */
MobileServiceTable.prototype.update = Platform.async(
    function (instance, parameters, callback) {
        var version,
            headers = {},
            features = this._features || [],
            serverInstance;

        // Account for absent optional arguments
        if (_.isNull(callback) && (typeof parameters === 'function')) {
            callback = parameters;
            parameters = null;
        }

        // Validate the arguments
        Validate.notNull(instance, 'instance');
        Validate.isValidId(instance[idPropertyName], 'instance.' + idPropertyName);
        if (!_.isNull(parameters)) {
            Validate.isValidParametersObject(parameters, 'parameters');
        }
        Validate.notNull(callback, 'callback');

        version = instance[MobileServiceSystemColumns.Version];
        serverInstance = removeSystemProperties(instance);

        if (!_.isNullOrEmpty(version)) {
            headers['If-Match'] = getEtagFromVersion(version);
            features.push(constants.features.OptimisticConcurrency);
        }

        headers[constants.apiVersionHeaderName] = constants.apiVersion;

        features = addQueryParametersFeaturesIfApplicable(features, parameters);

        // Construct the URL
        var urlFragment =  _.url.combinePathSegments(
                tableRouteSeperatorName,
                this.getTableName(),
                encodeURIComponent(instance[idPropertyName].toString()));
        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }

        // Make the request
        this.getMobileServiceClient()._request(
            'PATCH',
            urlFragment,
            serverInstance,
            false,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    setServerItemIfPreconditionFailed(error);
                    callback(error);
                } else {
                    var result = getItemFromResponse(response);
                    result = Platform.allowPlatformToMutateOriginal(instance, result);
                    callback(null, result);
                }
            });
    });

MobileServiceTable.prototype.refresh = Platform.async(
    function (instance, parameters, callback) {
        /// <summary>
        ///  Refresh the current instance with the latest values from the
        ///  table.
        /// </summary>
        /// <param name="instance" type="Object">
        /// The instance to refresh.
        /// </param>
        /// <param name="parameters" type="Object" mayBeNull="true">
        /// An object of user-defined parameters and values to include in the request URI query string.
        /// </param>
        /// <param name="callback" type="Function">
        /// The callback to invoke when the refresh is complete.
        /// </param>

        // Account for absent optional arguments
        if (_.isNull(callback) && (typeof parameters === 'function')) {
            callback = parameters;
            parameters = null;
        }

        // Validate the arguments
        Validate.notNull(instance, 'instance');
        if (!_.isValidId(instance[idPropertyName], idPropertyName))
        {
            if (typeof instance[idPropertyName] === 'string' && instance[idPropertyName] !== '') {
                throw new Error(idPropertyName + ' "' + instance[idPropertyName] + '" is not valid.');
            } else {
                callback(null, instance);
            }
            return;
        }

        if (!_.isNull(parameters)) {
            Validate.isValidParametersObject(parameters, 'parameters');
        }
        Validate.notNull(callback, 'callback');

        // Construct the URL
        var urlFragment = _.url.combinePathSegments(
                tableRouteSeperatorName,
                this.getTableName());

        if (typeof instance[idPropertyName] === 'string') {
            var id = encodeURIComponent(instance[idPropertyName]).replace(/\'/g, '%27%27');
            urlFragment = _.url.combinePathAndQuery(urlFragment, "?$filter=id eq '" + id + "'");
        } else {
            urlFragment = _.url.combinePathAndQuery(urlFragment, "?$filter=id eq " + encodeURIComponent(instance[idPropertyName].toString()));
        }

        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }

        var features = this._features || [];
        features.push(constants.features.TableRefreshCall);
        features = addQueryParametersFeaturesIfApplicable(features, parameters);

        var headers = { };
        headers[constants.apiVersionHeaderName] = constants.apiVersion;

        // Make the request
        this.getMobileServiceClient()._request(
            'GET',
            urlFragment,
            instance,
            false,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    callback(error, null);
                } else {
                    var result = _.fromJson(response.responseText);
                    if (Array.isArray(result)) {
                        result = result[0]; //get first object from array
                    }

                    if (!result) {
                        var message =_.format(
                            Platform.getResourceString("MobileServiceTable_NotSingleObject"),
                            idPropertyName);
                        callback(new Error(message), null);
                    }

                    result = Platform.allowPlatformToMutateOriginal(instance, result);
                    callback(null, result);
                }
            });
    });

/**
 * Looks up an object / record in the backend table using the object id.
 * 
 * @function
 * @instance
 * @public
 * @memberof MobileServiceTable
 * 
 * @param {string} id id of the object to be looked up in the backend table.
 * @param {object} parameters An object of user-defined parameters and values to include in the request URI query string.
 * 
 * @returns {Promise} A promise that is resolved with the looked up object when the lookup is completed successfully.
 *                    If the operation fails, the promise is rejected with the error.
 */
MobileServiceTable.prototype.lookup = Platform.async(
    function (id, parameters, callback) {
        /// <summary>
        /// Gets an instance from a given table.
        /// </summary>
        /// <param name="id" type="Number" integer="true">
        /// The id of the instance to get from the table.
        /// </param>
        /// <param name="parameters" type="Object" mayBeNull="true">
        /// An object of user-defined parameters and values to include in the request URI query string.
        /// </param>
        /// <param name="callback" type="Function">
        /// The callback to invoke when the lookup is complete.
        /// </param>

        // Account for absent optional arguments
        if (_.isNull(callback) && (typeof parameters === 'function')) {
            callback = parameters;
            parameters = null;
        }

        // Validate the arguments
        Validate.isValidId(id, idPropertyName);
        if (!_.isNull(parameters)) {
            Validate.isValidParametersObject(parameters);
        }
        Validate.notNull(callback, 'callback');

        // Construct the URL
        var urlFragment = _.url.combinePathSegments(
                tableRouteSeperatorName,
                this.getTableName(),
                encodeURIComponent(id.toString()));

        var features = this._features || [];
        features = addQueryParametersFeaturesIfApplicable(features, parameters);

        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }

        var headers = { };
        headers[constants.apiVersionHeaderName] = constants.apiVersion;

        // Make the request
        this.getMobileServiceClient()._request(
            'GET',
            urlFragment,
            null,
            false,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    callback(error, null);
                } else {
                    var result = getItemFromResponse(response);
                    callback(null, result);
                }
            });
    });

/**
 * Deletes an object / record from the backend table.
 * 
 * @function
 * @instance
 * @public
 * @memberof MobileServiceTable
 * 
 * @param {object} instance The object to delete from the backend table. 
 * @param {string} instance.id id of the record to be deleted.
 * @param {object} parameters An object of user-defined parameters and values to include in the request URI query string.
 * 
 * @returns {Promise} A promise that is resolved when the delete operation completes successfully.
 *                    If the operation fails, the promise is rejected with the error.
 */
MobileServiceTable.prototype.del = Platform.async(
    function (instance, parameters, callback) {

        // Account for absent optional arguments
        if (_.isNull(callback) && (typeof parameters === 'function')) {
            callback = parameters;
            parameters = null;
        }        

        // Validate the arguments
        Validate.notNull(instance, 'instance');
        Validate.isValidId(instance[idPropertyName], 'instance.' + idPropertyName);
        Validate.notNull(callback, 'callback');

        var headers = {};
        var features = this._features || [];
        if (_.isString(instance[idPropertyName])) {
            if (!_.isNullOrEmpty(instance[MobileServiceSystemColumns.Version])) {
                headers['If-Match'] = getEtagFromVersion(instance[MobileServiceSystemColumns.Version]);
                features.push(constants.features.OptimisticConcurrency);
            }
        }
        headers[constants.apiVersionHeaderName] = constants.apiVersion;

        features = addQueryParametersFeaturesIfApplicable(features, parameters);

        if (!_.isNull(parameters)) {
            Validate.isValidParametersObject(parameters);
        }

        // Contruct the URL
        var urlFragment =  _.url.combinePathSegments(
                tableRouteSeperatorName,
                this.getTableName(),
                encodeURIComponent(instance[idPropertyName].toString()));
        if (!_.isNull(parameters)) {
            var queryString = _.url.getQueryString(parameters);
            urlFragment = _.url.combinePathAndQuery(urlFragment, queryString);
        }

        // Make the request
        this.getMobileServiceClient()._request(
            'DELETE',
            urlFragment,
            null,
            false,
            headers,
            features,
            function (error, response) {
                if (!_.isNull(error)) {
                    setServerItemIfPreconditionFailed(error);
                }
                callback(error);
            });
    });

// Define query operators
tableHelper.defineQueryOperators(MobileServiceTable);

// Table system properties
function removeSystemProperties(instance) {
    var copy = {};
    for (var property in instance) {
        if ((property != MobileServiceSystemColumns.Version) &&
            (property != MobileServiceSystemColumns.UpdatedAt) &&
            (property != MobileServiceSystemColumns.CreatedAt) &&
            (property != MobileServiceSystemColumns.Deleted))
        {
            copy[property] = instance[property];
        }
    }
    return copy;
}

// Add double quotes and unescape any internal quotes
function getItemFromResponse(response) {
    var result = _.fromJson(response.responseText);
    if (response.getResponseHeader) {
        var eTag = response.getResponseHeader('ETag');
        if (!_.isNullOrEmpty(eTag)) {
            result[MobileServiceSystemColumns.Version] = getVersionFromEtag(eTag);
        }
    }
    return result;
}

// Converts an error to precondition failed error
function setServerItemIfPreconditionFailed(error) {
    if (error.request && error.request.status === 412) {
        error.serverInstance = _.fromJson(error.request.responseText);
    }
}

// Add wrapping double quotes and escape all double quotes
function getEtagFromVersion(version) {
    var result = version.replace(/\"/g, '\\\"');
    return "\"" + result + "\"";
}

// Remove surrounding double quotes and unescape internal quotes
function getVersionFromEtag(etag) {
    var len = etag.length,
        result = etag;

    if (len > 1 && etag[0] === '"' && etag[len - 1] === '"') {
        result = etag.substr(1, len - 2);
    }
    return result.replace(/\\\"/g, '"');
}

// Updates and returns the headers parameters with features used in the call
function addQueryParametersFeaturesIfApplicable(features, userQueryParameters) {
    var hasQueryParameters = false;
    if (userQueryParameters) {
        if (Array.isArray(userQueryParameters)) {
            hasQueryParameters = userQueryParameters.length > 0;
        } else if (_.isObject(userQueryParameters)) {
            for (var k in userQueryParameters) {
                hasQueryParameters = true;
                break;
            }
        }
    }

    if (hasQueryParameters) {
        features.push(constants.features.AdditionalQueryParameters);
    }

    return features;
}

// Define the module exports
module.exports = MobileServiceTable;

},{"./Platform":76,"./Utilities/Extensions":83,"./Utilities/Validate":86,"./constants":88,"./tableHelper":99,"azure-query-js":19}],69:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file SQLite implementation of the local store.
 * This uses the https://www.npmjs.com/package/cordova-sqlite-storage Cordova plugin.
 * @private
 */
 
var Platform = _dereq_('.'),
    Validate = _dereq_('../../Utilities/Validate'),
    _ = _dereq_('../../Utilities/Extensions'),
    ColumnType = _dereq_('../../sync/ColumnType'),
    sqliteSerializer = _dereq_('./sqliteSerializer'),
    storeHelper = _dereq_('./storeHelper'),
    Query = _dereq_('azure-query-js').Query,
    formatSql = _dereq_('azure-odata-sql').format,
    taskRunner = _dereq_('../../Utilities/taskRunner'),
    idPropertyName = "id", // TODO: Add support for case insensitive ID and custom ID column
    defaultDbName = 'mobileapps.db';

/**
 * @class
 * @classdesc A SQLite based implementation of {@link MobileServiceStore}.
 *            **Note** that this class is available **_only_** as part of the Cordova SDK.
 *       
 * @implements {MobileServiceStore}
 * @description Initializes a new instance of MobileServiceSqliteStore.
 * 
 * @param {string} [dbName] Name of the SQLite store file. If no name is specified, the default name will be used.
 */
var MobileServiceSqliteStore = function (dbName) {

    // Guard against initialization without the new operator
    "use strict";
    if ( !(this instanceof MobileServiceSqliteStore) ) {
        return new MobileServiceSqliteStore(dbName);
    }

    if ( _.isNull(dbName) ) {
        dbName = defaultDbName;
    }

    var tableDefinitions = {},
        runner = taskRunner();

    /**
     * Initializes the store.
     * A handle to the underlying sqlite store will be opened as part of initialization.
     * 
     * @function
     * @instance
     * @memberof MobileServiceSqliteStore
     * 
     * @returns A promise that is resolved when the initialization is complete OR rejected if it fails.
     */
    this.init = function() {
        return runner.run(function() {
            return this._init();
        }.bind(this));
    };

    this._init = function() {
        var self = this;
        return Platform.async(function(callback) {
            if (self._db) {
                return callback(); // already initialized.
            }

            var db = window.sqlitePlugin.openDatabase(
                { name: dbName, location: 'default' },
                function successcb() {
                    self._db = db; // openDatabase is complete, set self._db
                    callback();
                },
                callback
            );
        })();
    };

    /**
     * Closes the handle to the underlying sqlite store.
     * 
     * @function
     * @instance
     * @memberof MobileServiceSqliteStore
     * 
     * @returns A promise that is resolved when the sqlite store is closed successfully OR rejected if it fails.
     */
    this.close = function() {
        var self = this;
        return runner.run(function() {
            if (!self._db) {
                return; // nothing to close
            }

            return Platform.async(function(callback) {
                self._db.close(function successcb() {
                    self._db = undefined;
                    callback();
                },
                callback);
            })();
        });
    };

    /**
     * @inheritdoc
     */
    this.defineTable = function (tableDefinition) {
        var self = this;
        return runner.run(function() {
            storeHelper.validateTableDefinition(tableDefinition);

            tableDefinition = JSON.parse(JSON.stringify(tableDefinition)); // clone the table definition as we will need it later

            // Initialize the store before defining the table
            // If the store is already initialized, calling init() will have no effect. 
            return self._init().then(function() {
                return Platform.async(function(callback) {
                    self._db.transaction(function(transaction) {

                        // Get the table information
                        var pragmaStatement = _.format("PRAGMA table_info({0});", tableDefinition.name);
                        transaction.executeSql(pragmaStatement, [], function (transaction, result) {

                            // Check if a table with the specified name exists 
                            if (result.rows.length > 0) { // table already exists, add missing columns.

                                // Get a list of columns present in the SQLite table
                                var existingColumns = {};
                                for (var i = 0; i < result.rows.length; i++) {
                                    var column = result.rows.item(i);
                                    existingColumns[column.name.toLowerCase()] = true;
                                }

                                addMissingColumns(transaction, tableDefinition, existingColumns);
                                
                            } else { // table does not exist, create it.
                                createTable(transaction, tableDefinition);
                            }
                        });

                    },
                    callback,
                    function(result) {
                        // Table definition is successful, update the in-memory list of table definitions.
                        var error; 
                        try {
                            storeHelper.addTableDefinition(tableDefinitions, tableDefinition);
                        } catch (err) {
                            error = err;
                        }
                        callback(error);
                    });
                })();
            });
        });
    };

    /**
     * @inheritdoc
     */
    this.upsert = function (tableName, data) {
        var self = this;
        return runner.run(function() {
            return Platform.async(function(callback) {
                self._db.transaction(function(transaction) {
                    self._upsert(transaction, tableName, data);
                },
                callback,
                callback);
            })();
        });
    };
    
    // Performs the upsert operation.
    // This method validates all arguments, callers can skip validation. 
    this._upsert = function (transaction, tableName, data) {

        Validate.isObject(transaction);
        Validate.notNull(transaction);
        Validate.isString(tableName, 'tableName');
        Validate.notNullOrEmpty(tableName, 'tableName');

        var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, tableName);
        if (_.isNull(tableDefinition)) {
            throw new Error('Definition not found for table "' + tableName + '"');
        }

        // If no data is provided, there is nothing more to be done.
        if (_.isNull(data)) {
            return;
        }

        Validate.isObject(data);

        // Compute the array of records to be upserted.
        var records;
        if (!_.isArray(data)) {
            records = [data];
        } else {
            records = data;
        }

        // Serialize the records to a format that can be stored in SQLite.
        for (var i = 0; i < records.length; i++) {
            // Skip null or undefined record objects
            if (!_.isNull(records[i])) {
                Validate.isValidId(storeHelper.getId(records[i]), 'records[' + i + '].' + idPropertyName);
                records[i] = sqliteSerializer.serialize(records[i], tableDefinition.columnDefinitions);
            }
        }


        // Note: The default maximum number of parameters allowed by sqlite is 999
        // Refer http://www.sqlite.org/limits.html#max_variable_number
        // TODO: Add support for tables with more than 999 columns
        if (tableDefinition.columnDefinitions.length > 999) {
            throw new Error("Number of table columns cannot be more than 999");
        }

        var statements = [], // INSERT & UPDATE statements for each record we want to upsert
            parameters = [], // INSERT & UPDATE parameters for each record we want to upsert
            record,
            insertColumnNames = [],
            insertParams = [],
            insertValues = [],
            updateColumnNames = [],
            updateExpressions = [],
            updateValues = [];

        for (i = 0; i < records.length; i++) {

            if (_.isNull(records[i])) {
                continue;
            }
            
            record = records[i];

            // Reset the variables dirtied in the previous iteration of the loop.
            insertColumnNames = [];
            insertParams = [];
            insertValues = [];
            updateColumnNames = [];
            updateExpressions = [];
            updateValues = [];

            for (var property in record) {
                insertColumnNames.push(property);
                insertParams.push('?');
                insertValues.push(record[property]);
                
                if (!storeHelper.isId(property)) {
                    updateColumnNames.push(property);
                    updateExpressions.push(property + ' = ?');
                    updateValues.push(record[property]);
                }
            }
            
            // Insert the instance. If one with the same id already exists, ignore it.
            statements.push(_.format("INSERT OR IGNORE INTO {0} ({1}) VALUES ({2})", tableName, insertColumnNames.join(), insertParams.join()));
            parameters.push(insertValues);

            // If there is any property other than id that needs to be upserted, update the record.
            if (updateValues.length > 0) {
                statements.push(_.format("UPDATE {0} SET {1} WHERE {2} = ?", tableName, updateExpressions.join(), idPropertyName));
                updateValues.push(storeHelper.getId(record)); // Add value of record ID as the last parameter.. for the WHERE clause in the statement.
                parameters.push(updateValues);
            }
        }

        // Execute the INSERT and UPDATE statements.
        for (i = 0; i < statements.length; i++) {
            if (this._editStatement) { // test hook
                statements[i] = this._editStatement(statements[i]);
            }
            transaction.executeSql(statements[i], parameters[i]);
        }
    };

    /** 
     * @inheritdoc
     */
    this.lookup = function (tableName, id, suppressRecordNotFoundError) {
        var self = this;
        return runner.run(function() {
            // Validate the arguments
            Validate.isString(tableName, 'tableName');
            Validate.notNullOrEmpty(tableName, 'tableName');
            Validate.isValidId(id, 'id');
            
            var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, tableName);
            if (_.isNull(tableDefinition)) {
                throw new Error('Definition not found for table "' + tableName + '"');
            }

            var lookupStatement = _.format("SELECT * FROM [{0}] WHERE {1} = ? COLLATE NOCASE", tableName, idPropertyName);

            return Platform.async(function(callback) {
                self._db.executeSql(lookupStatement, [id], function (result) {
                    var error,
                        record;
                    try {
                        if (result.rows.length !== 0) {
                            record = result.rows.item(0);
                        }

                        if (record) {
                            // Deserialize the record read from the SQLite store into its original form.
                            record = sqliteSerializer.deserialize(record, tableDefinition.columnDefinitions);
                        } else if (!suppressRecordNotFoundError) {
                            throw new Error('Item with id "' + id + '" does not exist.');
                        }
                    } catch (err) {
                        error = err;
                    }

                    if (error) {
                        callback(error);
                    } else {
                        callback(null, record);
                    }
                },
                callback);
            })();
        });
    };

    /**
     * @inheritdoc
     */
    this.del = function (tableNameOrQuery, ids) {
        var self = this;
        return runner.run(function() {
            return Platform.async(function(callback) {
                // Validate parameters
                Validate.notNull(tableNameOrQuery);

                if (_.isString(tableNameOrQuery)) { // tableNameOrQuery is table name, delete records with specified IDs.
                    Validate.notNullOrEmpty(tableNameOrQuery, 'tableNameOrQuery');

                    // If a single id is specified, convert it to an array and proceed.
                    // Detailed validation of individual IDs in the array will be taken care of later.
                    if (!_.isArray(ids)) {
                        ids = [ids];
                    }
                    
                    self._db.transaction(function(transaction) {
                        for (var i = 0; i < ids.length; i++) {
                            if (! _.isNull(ids[i])) {
                                Validate.isValidId(ids[i]);
                            }
                        }
                        self._deleteIds(transaction, tableNameOrQuery /* table name */, ids);
                    },
                    callback,
                    callback);

                } else if (_.isObject(tableNameOrQuery)) { // tableNameOrQuery is a query, delete all records specified by the query.
                    self._deleteUsingQuery(tableNameOrQuery /* query */, callback);
                } else { // error
                    throw _.format(Platform.getResourceString("TypeCheckError"), 'tableNameOrQuery', 'Object or String', typeof tableNameOrQuery);
                }
            })();
        });
    };
    
    // Deletes the records selected by the specified query and notifies the callback.
    this._deleteUsingQuery = function (query, callback) {
        var self = this;
    
        // The query can have a 'select' clause that queries only specific columns. However, we need to know the ID value
        // to be able to delete records. So we explicitly set selection to just the ID column.
        var components = query.getComponents();
        components.selections = [idPropertyName];
        query.setComponents(components);

        var tableName = components.table;
        Validate.isString(tableName);
        Validate.notNullOrEmpty(tableName);

        var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, tableName);
        if (_.isNull(tableDefinition)) {
            throw new Error('Definition not found for table "' + tableName + '"');
        }

        var statements = getSqlStatementsFromQuery(query);

        // If the query requests the result count we expect 2 SQLite statements. Else, we expect a single statement.
        if (statements.length < 1 || statements.length > 2) {
            throw new Error('Unexpected number of statements');
        }

        self._db.transaction(function (transaction) {

            // The first statement gets the query results. Execute it.
            // Second statement, if any, is for geting the result count. Ignore it.
            // TODO: Figure out a better way to determine what the statements in the array correspond to.
            var deleteStatement = _.format("DELETE FROM [{0}] WHERE [{1}] in ({2})", tableName, idPropertyName, statements[0].sql);
            // Example deleteStatement: DELETE FROM [mytable] where [id] IN (SELECT [id] FROM [mytable] WHERE [language] = 'javascript')
            
            transaction.executeSql(deleteStatement, getStatementParameters(statements[0]));
        },
        callback,
        callback);
    };

    // Delete records from the table that match the specified IDs.
    this._deleteIds = function (transaction, tableName, ids) {
        var deleteExpressions = [],
            deleteParams = [];
        for (var i = 0; i < ids.length; i++) {
            if (!_.isNull(ids[i])) {
                deleteExpressions.push('?');
                deleteParams.push(ids[i]);
            }
        }
        
        var deleteStatement = _.format("DELETE FROM {0} WHERE {1} in ({2})", tableName, idPropertyName, deleteExpressions.join());
        if (this._editStatement) { // test hook
            deleteStatement = this._editStatement(deleteStatement);
        }
        transaction.executeSql(deleteStatement, deleteParams);
    };

    /**
     * @inheritdoc
     */
    this.read = function (query) {
        return runner.run(function() {
            Validate.notNull(query, 'query');
            Validate.isObject(query, 'query');

            return this._read(query);
        }.bind(this));
    };

    this._read = function (query) {
        return Platform.async(function(callback) {

            var tableDefinition = storeHelper.getTableDefinition(tableDefinitions, query.getComponents().table);
            if (_.isNull(tableDefinition)) {
                throw new Error('Definition not found for table "' + query.getComponents().table + '"');
            }

            var count,
                result = [],
                statements = getSqlStatementsFromQuery(query);

            this._db.transaction(function (transaction) {

                // If the query requests the result count we expect 2 SQLite statements. Else, we expect a single statement.
                if (statements.length < 1 || statements.length > 2) {
                    throw new Error('Unexpected number of statements');
                }

                // The first statement gets the query results. Execute it.
                // TODO: Figure out a better way to determine what the statements in the array correspond to.    
                transaction.executeSql(statements[0].sql, getStatementParameters(statements[0]), function (transaction, res) {
                    var record;
                    for (var j = 0; j < res.rows.length; j++) {
                        // Deserialize the record read from the SQLite store into its original form.
                        record = sqliteSerializer.deserialize(res.rows.item(j), tableDefinition.columnDefinitions);
                        result.push(record);
                    }
                });

                // Check if there are multiple statements. If yes, the second is for the result count.
                if (statements.length === 2) {
                    transaction.executeSql(statements[1].sql, getStatementParameters(statements[1]), function (transaction, res) {
                        count = res.rows.item(0).count;
                    });
                }
            },
            callback,
            function () {
                // If we fetched the record count, combine the records and the count into an object.
                if (count !== undefined) {
                    result = {
                        result: result,
                        count: count
                    };
                }
                callback(null, result);
            });
        }.bind(this))();
    };
    
    /**
     * @inheritdoc
     */
    this.executeBatch = function (operations) {
        var self = this;
        return runner.run(function() {
            Validate.isArray(operations);

            return Platform.async(function(callback) {
                self._db.transaction(function(transaction) {
                    for (var i = 0; i < operations.length; i++) {
                        var operation = operations[i];
                        
                        if (_.isNull(operation)) {
                            continue;
                        }
                        
                        Validate.isString(operation.action);
                        Validate.notNullOrEmpty(operation.action);

                        Validate.isString(operation.tableName);
                        Validate.notNullOrEmpty(operation.tableName);
                        
                        if (operation.action.toLowerCase() === 'upsert') {
                            self._upsert(transaction, operation.tableName, operation.data);
                        } else if (operation.action.toLowerCase() === 'delete') {
                            if ( ! _.isNull(operation.id) ) {
                                Validate.isValidId(operation.id);
                                self._deleteIds(transaction, operation.tableName, [operation.id]);
                            }
                        } else {
                            throw new Error(_.format("Operation '{0}' is not supported", operation.action));
                        }
                    }
                },
                callback,
                callback);
            })();
        });
    };
};

// Converts the QueryJS object into equivalent SQLite statements
function getSqlStatementsFromQuery(query) {
    
    // Convert QueryJS object to an OData query string
    var odataQuery = Query.Providers.OData.toOData(query);
    
    // Convert the OData query string into equivalent SQLite statements
    var statements = formatSql(odataQuery, { flavor: 'sqlite' });
    
    return statements;
}

// Gets the parameters from a statement defined by azure-odata-sql
function getStatementParameters(statement) {
    var params = [];

    if (statement.parameters) {
        statement.parameters.forEach(function (param) {
            params.push(sqliteSerializer.serializeValue(param.value));
        });
    }

    return params;
}

// Creates a table as per the specified definition and as part of the specified SQL transaction. 
function createTable(transaction, tableDefinition) {

    var columnDefinitions = tableDefinition.columnDefinitions;
    var columnDefinitionClauses = [];

    for (var columnName in columnDefinitions) {
        var columnType = storeHelper.getColumnType(columnDefinitions, columnName);

        var columnDefinitionClause = _.format("[{0}] {1}", columnName, sqliteSerializer.getSqliteType(columnType));

        if (storeHelper.isId(columnName)) {
            columnDefinitionClause += " PRIMARY KEY";
        }

        columnDefinitionClauses.push(columnDefinitionClause);
    }
    
    var createTableStatement = _.format("CREATE TABLE [{0}] ({1})", tableDefinition.name, columnDefinitionClauses.join());

    transaction.executeSql(createTableStatement);
}

// Alters the table to add the missing columns
function addMissingColumns(transaction, tableDefinition, existingColumns) {

    // Add necessary columns to the table
    var columnDefinitions = tableDefinition.columnDefinitions;
    for (var columnName in columnDefinitions) {

        // If this column does not already exist, we need to create it.
        // SQLite does not support adding multiple columns using a single statement. Add one column at a time.
        if (!existingColumns[columnName.toLowerCase()]) {
            var alterStatement = _.format("ALTER TABLE {0} ADD COLUMN {1} {2}", tableDefinition.name, columnName, storeHelper.getColumnType(columnDefinitions, columnName));
            transaction.executeSql(alterStatement);
        }
    }
}

// Valid Column types
MobileServiceSqliteStore.ColumnType = ColumnType;

// Define the module exports
module.exports = MobileServiceSqliteStore;

},{".":70,"../../Utilities/Extensions":83,"../../Utilities/Validate":86,"../../Utilities/taskRunner":87,"../../sync/ColumnType":91,"./sqliteSerializer":72,"./storeHelper":73,"azure-odata-sql":9,"azure-query-js":19}],70:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Defines Cordova implementation of target independent APIs.
 * For now, the browser implementation works as-is for Cordova, so we 
 * just reuse the browser definitions.
 * @private
 */

var browserExports = _dereq_('../web');

// Copy the browser exports into the exports object for Cordova, instead of module.exports = browserExports.
// This way we can add more exports to module.exports (in the future) without having to worry about 
// having an unintended side effect on the browser exports. 
for (var i in browserExports) {
    exports[i] = browserExports[i];
}


},{"../web":78}],71:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Cordova specific modules that need to be exposed outside the SDK
module.exports = {
    MobileServiceSqliteStore: _dereq_('./MobileServiceSqliteStore')
};

},{"./MobileServiceSqliteStore":69}],72:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Defines functions for serializing a JS object into an object that can be used for storing in a SQLite table and
 *       for deserializing a row / object read from a SQLite table into a JS object. The target type of a serialization or
 *       a deserialization operation is determined by the specified column definition.
 * @private
 */

var Platform = _dereq_('.'),
    Validate = _dereq_('../../Utilities/Validate'),
    _ = _dereq_('../../Utilities/Extensions'),
    ColumnType = _dereq_('../../sync/ColumnType'),
    storeHelper = _dereq_('./storeHelper'),
    verror = _dereq_('verror'),
    typeConverter = _dereq_('./typeConverter');

/**
 * Gets the SQLite type that matches the specified ColumnType.
 * @private
 * @param columnType - The type of values that will be stored in the SQLite table
 * @throw Will throw an error if columnType is not supported 
 */
function getSqliteType (columnType) {
    var sqliteType;

    switch (columnType) {
        case ColumnType.Object:
        case ColumnType.Array:
        case ColumnType.String:
        case ColumnType.Text:
            sqliteType = "TEXT";
            break;
        case ColumnType.Integer:
        case ColumnType.Int:
        case ColumnType.Boolean:
        case ColumnType.Bool:
        case ColumnType.Date:
            sqliteType = "INTEGER";
            break;
        case ColumnType.Real:
        case ColumnType.Float:
            sqliteType = "REAL";
            break;
        default:
            throw new Error('Column type ' + columnType + ' is not supported');
    }

    return sqliteType;
}

/**
 * Checks if the value can be stored in a table column of the specified type.
 * Example: Float values can be stored in column of type ColumnType.Float but not ColumnType.Integer. 
 * @private
 */
function isJSValueCompatibleWithColumnType(value, columnType) {
    
    // Allow NULL values to be stored in columns of any type
    if (_.isNull(value)) {
        return true;
    }
    
    switch (columnType) {
        case ColumnType.Object:
            return _.isObject(value);
        case ColumnType.Array:
            return _.isArray(value);
        case ColumnType.String:
        case ColumnType.Text:
            return true; // Allow any value to be stored in a string column
        case ColumnType.Boolean:
        case ColumnType.Bool:
        case ColumnType.Integer:
        case ColumnType.Int:
            return _.isBool(value) || _.isInteger(value);
        case ColumnType.Date:
            return _.isDate(value);
        case ColumnType.Real:
        case ColumnType.Float:
            return _.isNumber(value);
        default:
            return false;
    }
}

/**
 * Checks if the SQLite value matches the specified ColumnType.
 * A value read from a SQLite table can be incompatible with the specified column type, if it was stored
 * in the table using a column type different from columnType.
 * Example: If a non-integer numeric value is stored in a column of type ColumnType.Float and 
 * then deserialized into a column of type ColumnType.Integer, that will be an error. 
 * @private
 */
function isSqliteValueCompatibleWithColumnType(value, columnType) {
    
    // Null is a valid value for any column type
    if (_.isNull(value)) {
        return true;
    }
    
    switch (columnType) {
        case ColumnType.Object:
            return _.isString(value);
        case ColumnType.Array:
            return _.isString(value);
        case ColumnType.String:
        case ColumnType.Text:
            return _.isString(value);
        case ColumnType.Boolean:
        case ColumnType.Bool:
            return _.isInteger(value);
        case ColumnType.Integer:
        case ColumnType.Int:
            return _.isInteger(value);
        case ColumnType.Date:
            return _.isInteger(value);
        case ColumnType.Real:
        case ColumnType.Float:
            return _.isNumber(value);
        default:
            return false;
    }
}

/**
 * Checks if type is a supported ColumnType
 * @private
 */
function isColumnTypeValid(type) {
    for (var key in ColumnType) {
        if (ColumnType[key] === type) {
            return true;
        }
    }
    return false;
}

/**
 * Serializes an object into an object that can be stored in a SQLite table, as defined by columnDefinitions.
 * @private
 */
function serialize (value, columnDefinitions) {

    var serializedValue = {};

    try {
        Validate.notNull(columnDefinitions, 'columnDefinitions');
        Validate.isObject(columnDefinitions);
        
        Validate.notNull(value);
        Validate.isObject(value);

        for (var property in value) {

            var columnType = storeHelper.getColumnType(columnDefinitions, property);
            // Skip properties that don't match any column in the table 
            if (!_.isNull(columnType)) {
                serializedValue[property] = serializeMember(value[property], columnType);
            }
        }
        
    } catch (error) {
        throw new verror.VError(error, 'Failed to serialize value ' + JSON.stringify(value) + '. Column definitions: ' + JSON.stringify(columnDefinitions));
    }

    return serializedValue;
}

/**
 * Deserializes a row read from a SQLite table into a Javascript object, as defined by columnDefinitions.
 * @private
 */
function deserialize (value, columnDefinitions) {

    var deserializedValue = {};
    
    try {
        Validate.notNull(columnDefinitions, 'columnDefinitions');
        Validate.isObject(columnDefinitions);

        Validate.notNull(value);
        Validate.isObject(value);

        for (var property in value) {
            var columnName = storeHelper.getColumnName(columnDefinitions, property); // this helps us deserialize with proper case for the property name
            deserializedValue[columnName] = deserializeMember(value[property], storeHelper.getColumnType(columnDefinitions, property));
        }
        
    } catch (error) {
        throw new verror.VError(error, 'Failed to deserialize value ' + JSON.stringify(value) + '. Column definitions: ' + JSON.stringify(columnDefinitions));
    }

    return deserializedValue;
}

/**
 * Serializes a property of an object into a value which can be stored in a SQLite column of type columnType. 
 * @private
 */
function serializeMember(value, columnType) {
    
    // Start by checking if the specified column type is valid
    if (!isColumnTypeValid(columnType)) {
        throw new Error('Column type ' + columnType + ' is not supported');
    }

    // Now check if the specified value can be stored in a column of type columnType
    if (!isJSValueCompatibleWithColumnType(value, columnType)) {
        throw new Error('Converting value ' + JSON.stringify(value) + ' of type ' + typeof value + ' to type ' + columnType + ' is not supported.');
    }

    // If we are here, it means we are good to proceed with serialization
    
    var sqliteType = getSqliteType(columnType),
        serializedValue;
    
    switch (sqliteType) {
        case "TEXT":
            serializedValue = typeConverter.convertToText(value);
            break;
        case "INTEGER":
            serializedValue = typeConverter.convertToInteger(value);
            break;
        case "REAL":
            serializedValue = typeConverter.convertToReal(value);
            break;
        default:
            throw new Error('Column type ' + columnType + ' is not supported');
    }
    
    return serializedValue;
}

// Deserializes a property of an object read from SQLite into a value of type columnType
function deserializeMember(value, columnType) {
    
    // Handle this special case first.
    // Simply return 'value' if a corresponding columnType is not defined.   
    if (!columnType) {
        return value;
    }

    // Start by checking if the specified column type is valid.
    if (!isColumnTypeValid(columnType)) {
            throw new Error('Column type ' + columnType + ' is not supported');
    }

    // Now check if the specified value can be stored in a column of type columnType.
    if (!isSqliteValueCompatibleWithColumnType(value, columnType)) {
        throw new Error('Converting value ' + JSON.stringify(value) + ' of type ' + typeof value +
                            ' to type ' + columnType + ' is not supported.');
    }

    // If we are here, it means we are good to proceed with deserialization
    
    var deserializedValue, error;

    switch (columnType) {
        case ColumnType.Object:
            deserializedValue = typeConverter.convertToObject(value);
            break;
        case ColumnType.Array:
            deserializedValue = typeConverter.convertToArray(value);
            break;
        case ColumnType.String:
        case ColumnType.Text:
            deserializedValue = typeConverter.convertToText(value);
            break;
        case ColumnType.Integer:
        case ColumnType.Int:
            deserializedValue = typeConverter.convertToInteger(value);
            break;
        case ColumnType.Boolean:
        case ColumnType.Bool:
            deserializedValue = typeConverter.convertToBoolean(value);
            break;
        case ColumnType.Date:
            deserializedValue = typeConverter.convertToDate(value);
            break;
        case ColumnType.Real:
        case ColumnType.Float:
            deserializedValue = typeConverter.convertToReal(value);
            break;
        default:
            throw new Error(_.format(Platform.getResourceString("sqliteSerializer_UnsupportedColumnType"), columnType));
    }

    return deserializedValue;
}

/**
 * Serializes a JS value to its equivalent that will be stored in the store.
 * This method is useful while querying to convert values to their store representations.
 * @private
 */
function serializeValue(value) {

    var type;
    if ( _.isNull(value) ) {
        type = ColumnType.Object;
    } else if ( _.isNumber(value) ) {
        type = ColumnType.Real;
    } else if ( _.isDate(value) ) {
        type = ColumnType.Date;
    } else if ( _.isBool(value) ) {
        type = ColumnType.Boolean;
    } else if ( _.isString(value) ) {
        type = ColumnType.String;
    } else if ( _.isArray(value) ) {
        type = ColumnType.Array;
    } else if ( _.isObject(value) ) {
        type = ColumnType.Object;
    } else {
        type = ColumnType.Object;
    }

    return serializeMember(value, type);
}

exports.serialize = serialize;
exports.serializeValue = serializeValue;
exports.deserialize = deserialize;
exports.getSqliteType = getSqliteType;

},{".":70,"../../Utilities/Extensions":83,"../../Utilities/Validate":86,"../../sync/ColumnType":91,"./storeHelper":73,"./typeConverter":74,"verror":61}],73:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Helper functions for performing store related operations
 * @private
 */

var idPropertyName = _dereq_('../../constants').table.idPropertyName,
    Validate = _dereq_('../../Utilities/Validate');

/**
 * Validates the table definition
 * @private
 */
function validateTableDefinition(tableDefinition) {
    // Do basic table name validation and leave the rest to the store
    Validate.notNull(tableDefinition, 'tableDefinition');
    Validate.isObject(tableDefinition, 'tableDefinition');

    Validate.isString(tableDefinition.name, 'tableDefinition.name');
    Validate.notNullOrEmpty(tableDefinition.name, 'tableDefinition.name');

    // Validate the specified column types and check for duplicate columns
    var columnDefinitions = tableDefinition.columnDefinitions,
        definedColumns = {};
    
    Validate.isObject(columnDefinitions);
    Validate.notNull(columnDefinitions);

    for (var columnName in columnDefinitions) {

        Validate.isString(columnDefinitions[columnName], 'columnType');
        Validate.notNullOrEmpty(columnDefinitions[columnName], 'columnType');

        if (definedColumns[columnName.toLowerCase()]) {
            throw new Error('Duplicate definition for column ' + columnName + '" in table "' + tableDefinition.name + '"');
        }

        definedColumns[columnName.toLowerCase()] = true;
    }
}

/**
 * Adds a tableDefinition to the tableDefinitions object
 * @private
 */
function addTableDefinition(tableDefinitions, tableDefinition) {
    Validate.isObject(tableDefinitions);
    Validate.notNull(tableDefinitions);
    validateTableDefinition(tableDefinition);

    tableDefinitions[tableDefinition.name.toLowerCase()] = tableDefinition;
}

/**
 * Gets the table definition for the specified table name from the tableDefinitions object
 * @private
 */
function getTableDefinition(tableDefinitions, tableName) {
    Validate.isObject(tableDefinitions);
    Validate.notNull(tableDefinitions);
    Validate.isString(tableName);
    Validate.notNullOrEmpty(tableName);

    return tableDefinitions[tableName.toLowerCase()];
}

/**
 * Gets the type of the specified column
 * @private
 */
function getColumnType(columnDefinitions, columnName) {
    Validate.isObject(columnDefinitions);
    Validate.notNull(columnDefinitions);
    Validate.isString(columnName);
    Validate.notNullOrEmpty(columnName);

    for (var column in columnDefinitions) {
        if (column.toLowerCase() === columnName.toLowerCase()) {
            return columnDefinitions[column];
        }
    }
}

/**
 * Returns the column name in the column definitions that matches the specified property
 * @private
 */
function getColumnName(columnDefinitions, property) {
    Validate.isObject(columnDefinitions);
    Validate.notNull(columnDefinitions);
    Validate.isString(property);
    Validate.notNullOrEmpty(property);

    for (var column in columnDefinitions) {
        if (column.toLowerCase() === property.toLowerCase()) {
            return column;
        }
    }

    return property; // If no definition found for property, simply returns the column name as is
}

/**
 * Returns the Id property value OR undefined if none exists
 * @private
 */
function getId(record) {
    Validate.isObject(record);
    Validate.notNull(record);

    for (var property in record) {
        if (property.toLowerCase() === idPropertyName.toLowerCase()) {
            return record[property];
        }
    }
}

/**
 * Checks if property is an ID property.
 * @private
 */
function isId(property) {
    Validate.isString(property);
    Validate.notNullOrEmpty(property);

    return property.toLowerCase() === idPropertyName.toLowerCase();
}

module.exports = {
    addTableDefinition: addTableDefinition,
    getColumnName: getColumnName,
    getColumnType: getColumnType,
    getId: getId,
    getTableDefinition: getTableDefinition,
    isId: isId,
    validateTableDefinition: validateTableDefinition
};

},{"../../Utilities/Validate":86,"../../constants":88}],74:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/***
 * @file Defines converters for various data types.
 */

var Validate = _dereq_('../../Utilities/Validate'),
    _ = _dereq_('../../Utilities/Extensions'),
    verror = _dereq_('verror');

exports.convertToText = function (value) {
    
    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isString(value)) {
        return value;
    }

    return JSON.stringify(value);
};

exports.convertToInteger = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isInteger(value)) {
        return value;
    }

    if (_.isBool(value)) {
        return value ? 1 : 0;
    }
    
    if (_.isDate(value)) {
        return value.getTime();
    }

    throw new Error(_.format(Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'integer'));
};

exports.convertToBoolean = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isBool(value)) {
        return value;
    }

    if (_.isInteger(value)) {
        return value === 0 ? false : true;
    }
        
    throw new Error(_.format(Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'Boolean'));
};

exports.convertToDate = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isDate(value)) {
        return value;
    }

    if (_.isInteger(value)) {
        return new Date(value);
    } 

    throw new Error(_.format(Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'Date'));
};

exports.convertToReal = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isNumber(value)) {
        return value;
    }

    throw new Error(_.format(Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'Real'));
};

exports.convertToObject = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isObject(value)) {
        return value;
    }

    var error;
    try {
        if (_.isString(value)) {
            var result = JSON.parse(value);
            
            // Make sure the deserialized value is indeed an object, and not some other type
            if (_.isObject(result)) {
                return result;
            } 
        }
    } catch(err) {
        error = err; 
    }

    throw new verror.VError(error, Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'Object');    
};

exports.convertToArray = function (value) {

    if (_.isNull(value)) // undefined/null value should be converted to null
        return null;

    if (_.isArray(value)) {
        return value;
    }

    var error;
    try {
        if (_.isString(value)) {
            var result = JSON.parse(value);
            
            // Make sure the deserialized value is indeed an object, and not some other type
            if (_.isArray(result)) {
                return result;
            } 
        }
    } catch(err) {
        error = err; 
    }

    throw new verror.VError(error, Platform.getResourceString('sqliteSerializer_UnsupportedTypeConversion'), JSON.stringify(value), typeof value, 'Array');    
};

},{"../../Utilities/Extensions":83,"../../Utilities/Validate":86,"verror":61}],75:[function(_dereq_,module,exports){
(function (global){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Module to retrieve environment details

/**
 * Gets details of the target
 * @private
 * 
 * @return 'Cordova', 'Web' or 'Unknown'
 */
exports.getTarget = function() {
    if (typeof global !== 'undefined' && global.cordova && global.cordova.version) {
        return 'Cordova';
    } else if (typeof global !== 'undefined') {
        return 'Web';
    } else {
        return 'Unknown';
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],76:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var target = _dereq_('./environment').getTarget();

if (target === 'Cordova') {
    module.exports = _dereq_('./cordova');
} else if (target === 'Web') {
    module.exports = _dereq_('./web');
} else {
    throw new Error('Unsupported target');
}

},{"./cordova":70,"./environment":75,"./web":78}],77:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var target = _dereq_('./environment').getTarget();

if (target === 'Cordova') {
    module.exports = _dereq_('./cordova/sdkExports');
} else if (target === 'Web') {
    module.exports = _dereq_('./web/sdkExports');
} else {
    throw new Error('Unsupported target');
}

},{"./cordova/sdkExports":71,"./environment":75,"./web/sdkExports":79}],78:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/// <reference path="..\Generated\MobileServices.DevIntellisense.js" />
/*global $__fileVersion__:false, $__version__:false */

var _ = _dereq_('../../Utilities/Extensions'),
    Validate = _dereq_('../../Utilities/Validate'),
    Promises = _dereq_('../../Utilities/Promises'),
    version = _dereq_('../../../../package.json').version,
    resources = _dereq_('../../resources.json'),
    environment = _dereq_('../environment'),
    inMemorySettingStore = {};

try {
    var key = '___z';
    localStorage.setItem(key, key);
    localStorage.removeItem(key);
    inMemorySettingStore = localStorage;
} catch (e) {
    // localStorage is not available
}

var bestAvailableTransport = null;
var knownTransports = [ // In order of preference
    _dereq_('../../Transports/DirectAjaxTransport'),
    _dereq_('../../Transports/IframeTransport')
];
var knownLoginUis = [ // In order of preference
    _dereq_('../../LoginUis/WebAuthBroker'),
    _dereq_('../../LoginUis/CordovaPopup'),
    _dereq_('../../LoginUis/BrowserPopup')
];

// Matches an ISO date and separates out the fractional part of the seconds
// because IE < 10 has quirks parsing fractional seconds
var isoDateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d*))?Z$/;

// Feature-detect IE8's date serializer
var dateSerializerOmitsDecimals = !JSON.stringify(new Date(100)).match(/\.100Z"$/);

exports.async = function async(func) {
    /// <summary>
    /// Wrap a function that takes a callback into platform specific async
    /// operation (i.e., keep using callbacks or switch to promises).
    /// </summary>
    /// <param name="func" type="Function">
    /// An async function with a callback as its last parameter 
    /// </param>
    /// <returns type="Function">
    /// Function that when invoked will return a promise.
    /// </returns>

    return function () {
        // Capture the context of the original call
        var that = this;
        var args = arguments;

        // Create a new promise that will wrap the async call
        return new Promises.Promise(function (complete, error) {

            // Add a callback to the args which will call the appropriate
            // promise handlers
            var callback = function (err) {
                if (_.isNull(err)) {
                    // Call complete with all the args except for err
                    complete.apply(null, Array.prototype.slice.call(arguments, 1));
                } else {
                    error(err);
                }
            };
            Array.prototype.push.call(args, callback);

            try {
                // Invoke the async method which will in turn invoke our callback
                // which will in turn invoke the promise's handlers
                func.apply(that, args);
            } catch (ex) {
                // Thread any immediate errors like parameter validation
                // through the the callback
                callback(_.createError(ex));
            }
        });
    };
};

exports.readSetting = function readSetting(name) {
    /// <summary>
    /// Read a setting from a global configuration store.
    /// </summary>
    /// <param name="name" type="String">
    /// Name of the setting to read.
    /// </param>
    /// <returns type="String" mayBeNull="true">
    /// The value of the setting or null if not set.
    /// </returns>

    return inMemorySettingStore[name];
};

exports.writeSetting = function writeSetting(name, value) {
    /// <summary>
    /// Write a setting to a global configuration store.
    /// </summary>
    /// <param name="name" type="String">
    /// Name of the setting to write.
    /// </param>
    /// <param name="value" type="String" mayBeNull="true">
    /// The value of the setting.
    /// </returns>

    inMemorySettingStore[name] = value;
};

exports.webRequest = function (request, callback) {
    /// <summary>
    /// Make a web request.
    /// </summary>
    /// <param name="request" type="Object">
    /// Object describing the request (in the WinJS.xhr format).
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to execute when the request completes.
    /// </param>

    return getBestTransport().performRequest(request, callback);
};

exports.getUserAgent = function () {
    // Browsers don't allow you to set a custom user-agent in ajax requests. Trying to do so
    // will cause an exception. So we don't.
    return null;
};

exports.getOperatingSystemInfo = function () {
    return {
        name: "--",
        version: "--",
        architecture: "--"
    };
};

exports.getSdkInfo = function () {
    return {
        language: environment.getTarget(),
        fileVersion: version
    };
};

exports.login = function (startUri, endUri, callback, providerName, appUrl) {
    // Force logins to go over HTTPS because the runtime is hardcoded to redirect
    // the server flow back to HTTPS, and we need the origin to match.
    var findProtocol = /^[a-z]+:/,
        requiredProtocol = 'https:';
    startUri = startUri.replace(findProtocol, requiredProtocol);
    if (endUri) {
        endUri = endUri.replace(findProtocol, requiredProtocol);
    }

    return getBestProvider(knownLoginUis).login(startUri, endUri, callback, providerName, appUrl);
};

exports.toJson = function (value) {
    /// <summary>
    /// Convert an object into JSON format.
    /// </summary>
    /// <param name="value" type="Object">The value to convert.</param>
    /// <returns type="String">The value as JSON.</returns>

    // We're wrapping this so we can hook the process and perform custom JSON
    // conversions.  Note that we don't have to add a special hook to correctly
    // serialize dates in ISO8061 because JSON.stringify does that by defualt.
    // TODO: Convert geolocations once they're supported
    // TODO: Expose the ability for developers to convert custom types
    return JSON.stringify(value, function (key, stringifiedValue) {
        if (dateSerializerOmitsDecimals && this && _.isDate(this[key])) {
            // IE8 doesn't include the decimal part in its serialization of dates
            // For consistency, we extract the non-decimal part from the string
            // representation, and then append the expected decimal part.
            var msec = this[key].getMilliseconds(),
                msecString = String(msec + 1000).substring(1);
            return stringifiedValue.replace(isoDateRegex, function (all, datetime) {
                return datetime + "." + msecString + "Z";
            });
        } else {
            return stringifiedValue;
        }
    });
};

exports.tryParseIsoDateString = function (text) {
    /// <summary>
    /// Try to parse an ISO date string.
    /// </summary>
    /// <param name="text" type="String">The text to parse.</param>
    /// <returns type="Date">The parsed Date or null.</returns>

    Validate.isString(text);

    // Check against a lenient regex
    var matchedDate = isoDateRegex.exec(text);
    if (matchedDate) {
        // IE9 only handles precisely 0 or 3 decimal places when parsing ISO dates,
        // and IE8 doesn't parse them at all. Fortunately, all browsers can handle 
        // 'yyyy/mm/dd hh:MM:ss UTC' (without fractional seconds), so we can rewrite
        // the date to that format, and the apply fractional seconds.
        var dateWithoutFraction = matchedDate[1],
            fraction = matchedDate[2] || "0",
            milliseconds = Math.round(1000 * Number("0." + fraction)); // 6 -> 600, 65 -> 650, etc.
        dateWithoutFraction = dateWithoutFraction
            .replace(/\-/g, "/")   // yyyy-mm-ddThh:mm:ss -> yyyy/mm/ddThh:mm:ss
            .replace("T", " ");    // yyyy/mm/ddThh:mm:ss -> yyyy/mm/dd hh:mm:ss

        // Try and parse - it will return NaN if invalid
        var ticks = Date.parse(dateWithoutFraction + " UTC");
        if (!isNaN(ticks)) {
            return new Date(ticks + milliseconds); // ticks are just milliseconds since 1970/01/01
        }
    }

    // Doesn't look like a date
    return null;
};

exports.getResourceString = function (resourceName) {
    return resources[resourceName];
};


exports.allowPlatformToMutateOriginal = function (original, updated) {
    // For the Web/HTML client, we don't modify the original object.
    // This is the more typical arrangement for most JavaScript data access.
    return updated;
};

function getBestTransport() {
    // We cache this just because it gets called such a lot
    if (!bestAvailableTransport) {
        bestAvailableTransport = getBestProvider(knownTransports);
    }

    return bestAvailableTransport;
}

function getBestProvider(providers) {
    /// <summary>
    /// Given an array of objects which each have a 'supportsCurrentRuntime' function,
    /// returns the first instance where that function returns true.
    /// </summary>

    for (var i = 0; i < providers.length; i++) {
        if (providers[i].supportsCurrentRuntime()) {
            return providers[i];
        }
    }

    throw new Error("Unsupported browser - no suitable providers are available.");
}
},{"../../../../package.json":62,"../../LoginUis/BrowserPopup":63,"../../LoginUis/CordovaPopup":64,"../../LoginUis/WebAuthBroker":65,"../../Transports/DirectAjaxTransport":81,"../../Transports/IframeTransport":82,"../../Utilities/Extensions":83,"../../Utilities/Promises":85,"../../Utilities/Validate":86,"../../resources.json":90,"../environment":75}],79:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Browser specific modules that need to be exposed outside the SDK
module.exports = {
    // None as of now.
};

},{}],80:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------
var Validate = _dereq_('../Utilities/Validate'),
    Platform = _dereq_('../Platform'),
    constants = _dereq_('../constants'),
    _ = _dereq_('../Utilities/Extensions');

exports.Push = Push;

/**
 * @class
 * @classdesc Push registration manager.
 * @protected
 */
function Push(client, installationId) {
    this.client = client;
    this.installationId = installationId;
}

/**
 * Register a push channel with the Azure Mobile Apps backend to start receiving notifications.
 *
 * @function
 * 
 * @param {string} platform The device platform being used - _'wns'_, _'gcm'_ or _'apns'_.
 * @param {string} pushChannel The push channel identifier or URI.
 * @param {string} templates An object containing template definitions. Template objects should contain body, headers and tags properties.
 * @param {string} secondaryTiles An object containing template definitions to be used with secondary tiles when using WNS.
 * 
 * @returns {Promise} A promise that is resolved when registration is successful OR rejected with the error if it fails.
 */
Push.prototype.register = Platform.async(
    function (platform, pushChannel, templates, secondaryTiles, callback) {
        Validate.isString(platform, 'platform');
        Validate.notNullOrEmpty(platform, 'platform');

        // in order to support the older callback style completion, we need to check optional parameters
        if (_.isNull(callback) && (typeof templates === 'function')) {
            callback = templates;
            templates = null;
        }

        if (_.isNull(callback) && (typeof secondaryTiles === 'function')) {
            callback = secondaryTiles;
            secondaryTiles = null;
        }

        var requestContent = {
            installationId: this.installationId,
            pushChannel: pushChannel,
            platform: platform,
            templates: stringifyTemplateBodies(templates),
            secondaryTiles: stringifyTemplateBodies(secondaryTiles)
        };

        executeRequest(this.client, 'PUT', pushChannel, requestContent, this.installationId, callback);
    }
);

/**
 * Unregister a push channel with the Azure Mobile Apps backend to stop receiving notifications.
 * 
 * @function
 * 
 * @param {string} pushChannel The push channel identifier or URI.
 * 
 * @returns {Promise} A promise that is resolved if unregister is successful and rejected with the error if it fails.
 */
Push.prototype.unregister = Platform.async(
    function (pushChannel, callback) {
        executeRequest(this.client, 'DELETE', pushChannel, null, this.installationId, callback);
    }
);

function executeRequest(client, method, pushChannel, content, installationId, callback) {
    Validate.isString(pushChannel, 'pushChannel');
    Validate.notNullOrEmpty(pushChannel, 'pushChannel');

    var headers = { 'If-Modified-Since': 'Mon, 27 Mar 1972 00:00:00 GMT' };
    headers[constants.apiVersionHeaderName] = constants.apiVersion;

    client._request(
        method,
        'push/installations/' + encodeURIComponent(installationId),
        content,
        null,
        headers,
        callback
    );
}

function stringifyTemplateBodies(templates) {
    var result = {};
    for (var templateName in templates) {
        if (templates.hasOwnProperty(templateName)) {
            // clone the template so we are not modifying the original
            var template = _.extend({}, templates[templateName]);
            if (typeof template.body !== 'string') {
                template.body = JSON.stringify(template.body);
            }
            result[templateName] = template;
        }
    }
    return result;
}
},{"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../constants":88}],81:[function(_dereq_,module,exports){
(function (global){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/// <reference path="..\Generated\MobileServices.DevIntellisense.js" />

// This transport is for modern browsers - it uses XMLHttpRequest with Cross-Origin Resource Sharing (CORS)

exports.name = "DirectAjaxTransport";

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this transport is usable in the current runtime.
    /// </summary>

    // Feature-detect support for CORS (for IE, it's in version 10+)
    return (typeof global.XMLHttpRequest !== "undefined") &&
           ('withCredentials' in new global.XMLHttpRequest());
};

exports.performRequest = function (request, callback) {
    /// <summary>
    /// Make a web request.
    /// </summary>
    /// <param name="request" type="Object">
    /// Object describing the request (in the WinJS.xhr format).
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to execute when the request completes.
    /// </param>

    var headers = request.headers || {},
        url = request.url.replace(/#.*$/, ""), // Strip hash part of URL for consistency across browsers
        httpMethod = request.type ? request.type.toUpperCase() : "GET",
        xhr = new global.XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            callback(null, xhr);
        }
    };

    xhr.open(httpMethod, url);

    for (var key in headers) {
        if (request.headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, request.headers[key]);
        }
    }

    xhr.send(request.data);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],82:[function(_dereq_,module,exports){
(function (global){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/// <reference path="..\Generated\MobileServices.DevIntellisense.js" />

// This transport is for midlevel browsers (IE8-9) that don't support CORS but do support postMessage.
// It creates an invisible <iframe> that loads a special bridge.html page from the runtime domain.
// To issue a request, it uses postMessage to pass the request into the <iframe>, which in turn makes
// a same-domain Ajax request to the runtime. To associate postMessage replies with the original
// request, we track an array of promises that eventually time out if not resolved (see PostMessageExchange).

var Promises = _dereq_('../Utilities/Promises'),
    PostMessageExchange = _dereq_('../Utilities/PostMessageExchange'),
    loadBridgeFramePromises = [], // One per target proto/host/port triplet
    messageExchange = PostMessageExchange.instance;

exports.name = "../../Transports/IframeTransport";

exports.supportsCurrentRuntime = function () {
    /// <summary>
    /// Determines whether or not this transport is usable in the current runtime.
    /// </summary>

    return typeof global.postMessage !== "undefined";
};

exports.performRequest = function (request, callback) {
    /// <summary>
    /// Make a web request.
    /// </summary>
    /// <param name="request" type="Object">
    /// Object describing the request (in the WinJS.xhr format).
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to execute when the request completes.
    /// </param>

    var originRoot = PostMessageExchange.getOriginRoot(request.url);
    whenBridgeLoaded(originRoot, function (bridgeFrame) {
        var message = {
            type: request.type,
            url: request.url,
            headers: request.headers,
            data: request.data
        };
        messageExchange.request(bridgeFrame.contentWindow, message, originRoot).then(function (reply) {
            fixupAjax(reply);
            callback(null, reply);
        }, function (error) {
            callback(error, null);
        });
    });
};

function fixupAjax(xhr) {
    if (xhr) {
        // IE sometimes converts status 204 into 1223
        // http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
        if (xhr.status === 1223) {
            xhr.status = 204;
        }
    }
}

function whenBridgeLoaded(originRoot, callback) {
    /// <summary>
    /// Performs the callback once the bridge iframe has finished loading.
    /// Lazily creates the bridge iframe if necessary. Note that each proto/host/port
    /// triplet (i.e., same-domain origin) needs a separate bridge.
    /// </summary>

    var cacheEntry = loadBridgeFramePromises[originRoot];

    if (!cacheEntry) {
        cacheEntry = loadBridgeFramePromises[originRoot] = new Promises.Promise(function (complete, error) {
            var bridgeFrame = document.createElement("iframe"),
                callerOrigin = PostMessageExchange.getOriginRoot(window.location.href),
                handleBridgeLoaded = function() {
                    complete(bridgeFrame);
                };
            
            if (bridgeFrame.addEventListener) {
                bridgeFrame.addEventListener("load", handleBridgeLoaded, false);
            } else {
                // For IE8
                bridgeFrame.attachEvent("onload", handleBridgeLoaded);
            }

            bridgeFrame.src = originRoot + "/crossdomain/bridge?origin=" + encodeURIComponent(callerOrigin);
            
            // Try to keep it invisible, even if someone does $("iframe").show()
            bridgeFrame.setAttribute("width", 0);
            bridgeFrame.setAttribute("height", 0);
            bridgeFrame.style.display = "none";

            global.document.body.appendChild(bridgeFrame);
        });
    }

    cacheEntry.then(callback);
}


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../Utilities/PostMessageExchange":84,"../Utilities/Promises":85}],83:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// Declare JSHint globals
/*global XMLHttpRequest:false */

var Validate = _dereq_('./Validate');
var Platform = _dereq_('../Platform');
var _ = exports;

exports.isNull = function (value) {
    /// <summary>
    /// Gets a value indicating whether the provided value is null (or
    /// undefined).
    /// </summary>
    /// <param name="value" type="Object" mayBeNull="true">
    /// The value to check.
    /// </param>
    /// <returns type="Boolean">
    /// A value indicating whether the provided value is null (or undefined).
    /// </returns>
    
    return value === null || value === undefined;
};

exports.isNullOrZero = function (value) {
    /// <summary>
    /// Gets a value indicating whether the provided value is null (or
    /// undefined) or zero / empty string
    /// </summary>
    /// <param name="value" type="Object" mayBeNull="true">
    /// The value to check.
    /// </param>
    /// <returns type="Boolean">
    /// A value indicating whether the provided value is null (or undefined) or zero or empty string.
    /// </returns>

    return value === null || value === undefined || value === 0 || value === '';
};

exports.isNullOrEmpty = function (value) {
    /// <summary>
    /// Gets a value indicating whether the provided value is null (or
    /// undefined) or empty.
    /// </summary>
    /// <param name="value" type="Object" mayBeNull="true">
    /// The value to check.
    /// </param>
    /// <returns type="Boolean">
    /// A value inHdicating whether the provided value is null (or undefined).
    /// </returns>

    return _.isNull(value) || value.length === 0;
};

exports.format = function (message) {
    /// <summary>
    /// Format a string by replacing all of its numbered arguments with
    /// parameters to the method. Arguments are of the form {0}, {1}, ..., like
    /// in .NET.
    /// </summary>
    /// <param name="message" type="string" mayBeNull="false">
    /// The format string for the message.
    /// </param>
    /// <param name="arguments" type="array" optional="true">
    /// A variable number of arguments that can be used to format the message.
    /// </param>
    /// <returns type="string">The formatted string.</returns>

    Validate.isString(message, 'message');

    // Note: There are several flaws in this implementation that we are
    // ignoring for simplicity as it's only used internally.  Examples that
    // could be handled better include:
    //    format('{0} {1}', 'arg') => 'arg {1}'
    //    format('{0} {1}', '{1}', 'abc') => 'abc abc'
    //    format('{0}', '{0}') => <stops responding>

    if (!_.isNullOrEmpty(message) && arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            var pattern = '{' + (i - 1) + '}';
            while (message.indexOf(pattern) !== -1) {
                message = message.replace(pattern, arguments[i]);
            }
        }
    }

    return message;
};

exports.has = function (value, key) {
    /// <summary>
    /// Determine if an object defines a given property.
    /// </summary>
    /// <param name="value" type="Object">The object to check.</param>
    /// <param name="key" type="String">
    /// The name of the property to check for.
    /// </param>
    /// <returns type="Boolean">
    /// A value indicating whether the object defines the property.
    /// </returns>

    Validate.notNull(key, 'key');
    Validate.isString(key, 'key');

    return !_.isNull(value) && value.hasOwnProperty(key);
};

exports.hasProperty = function (object, properties) {
    /// <summary>
    /// Determines if an object has any of the passed in properties
    /// </summary>
    /// <returns type="boolean">True if it contains any one of the properties
    /// </returns>
    for (var i = 0; i < properties.length; i++) {
        if (_.has(object, properties[i])) {
            return true;
        }
    }
    return false;
};

exports.extend = function extend(target, members) {
    /// <summary>
    /// Extends the target with the members of the members object.
    /// </summary>
    /// <param name="target" type="Object">The target object to extend.</param>
    /// <param name="members" type="Object">The members object to add to the target.</param>
    /// <returns type="Object">The target object extended with the members.
    /// </returns>
    for (var member in members) {
        if (members.hasOwnProperty(member)) {
            target[member] = members[member];
        }
    }
    return target;
};

exports.isObject = function (value) {
    /// <summary>
    /// Determine if a value is an object.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is an object (or null), false othwerise.
    /// </returns>

    return _.isNull(value) || (typeof value === 'object' && !_.isDate(value));
};

exports.isValidId = function (value) {
    /// <summary>
    /// Determine if a value is an acceptable id for use by the mobile service
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a string or number, meeting all criteria, or false othwerise.
    /// </returns>
    if (_.isNullOrZero(value)) {
        return false;
    }

    if (_.isString(value)) {
        // Strings must contain at least one non whitespace character
        if (value.length === 0 || value.length > 255 || value.trim().length === 0) {
            return false;
        }

        var ex = /[+"\/?`\\]|[\u0000-\u001F]|[\u007F-\u009F]|^\.{1,2}$/;
        if (value.match(ex) !== null) {
            return false;
        }

        return true;

    } else if (_.isNumber(value)) {
        return value > 0;
    }

    return false;
};

exports.isString = function (value) {
    /// <summary>
    /// Determine if a value is a string.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a string (or null), false othwerise.
    /// </returns>

    return _.isNull(value) || (typeof value === 'string');
};

exports.isNumber = function (value) {
    /// <summary>
    /// Determine if a value is a number.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a number, false othwerise.
    /// </returns>

    return !_.isNull(value) && (typeof value === 'number');
};

exports.isInteger = function(value) {
    /// <summary>
    /// Determine if a value is an integer.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is an integer, false othwerise.
    /// </returns>

    return _.isNumber(value) && (parseInt(value, 10) === parseFloat(value));
};

exports.isBool = function (value) {
    /// <summary>
    /// Determine if a value is a boolean.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a boolean, false othwerise.
    /// </returns>
    return !_.isNull(value) && (typeof value == 'boolean');
};

exports.isFunction = function (value) {
    /// <summary>
    /// Determine if a value is a function.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a function, false othwerise.
    /// </returns>
    return typeof value == 'function';
};

exports.isArray = function (value) {
    /// <summary>
    /// Determine if a value is an array.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is an array (or null), false othwerise.
    /// </returns>

    return !_.isNull(value) && (value.constructor === Array);
};

function classOf(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

exports.isDate = function (value) {
    /// <summary>
    /// Determine if a value is a date.
    /// </summary>
    /// <param name="value" type="Object">The value to check.</param>
    /// <returns type="boolean">
    /// True if the value is a date, false othwerise.
    /// </returns>
    return !_.isNull(value) && (classOf(value) == 'date');
};

exports.toJson = function (value) {
    /// <summary>
    /// Convert an object into JSON format.
    /// </summary>
    /// <param name="value" type="Object">The value to convert.</param>
    /// <returns type="String">The value as JSON.</returns>

    return Platform.toJson(value);
};

exports.fromJson = function (value) {
    /// <summary>
    /// Convert an object from JSON format.
    /// </summary>
    /// <param name="value" type="String">The value to convert.</param>
    /// <returns type="Object">The value as an object.</returns>

    var jsonValue = null;
    if (!_.isNullOrEmpty(value)) {
        // We're wrapping this so we can hook the process and perform custom JSON
        // conversions
        jsonValue = JSON.parse(
            value,
            function (k, v) {
                // Try to convert the value as a Date
                if (_.isString(v) && !_.isNullOrEmpty(v)) {
                    var date = exports.tryParseIsoDateString(v);
                    if (!_.isNull(date)) {
                        return date;
                    }
                }

                // TODO: Convert geolocations once they're supported
                // TODO: Expose the ability for developers to convert custom types

                // Return the original value if we couldn't do anything with it
                return v;
            });
    }

    return jsonValue;
};

exports.createUniqueInstallationId = function () {
    /// <summary>
    /// Create a unique identifier that can be used for the installation of
    /// the current application.
    /// </summary>
    /// <returns type="String">Unique identifier.</returns>

    var pad4 = function (str) { return "0000".substring(str.length) + str; };
    var hex4 = function () { return pad4(Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16)); };

    return (hex4() + hex4() + "-" + hex4() + "-" + hex4() + "-" + hex4() + "-" + hex4() + hex4() + hex4());
};

exports.mapProperties = function (instance, action) {
    /// <summary>
    /// Map a function over the key/value pairs in an instance.
    /// </summary>
    /// <param name="instance" type="Object">
    /// The instance to map over.
    /// </param>
    /// <param name="action" type="function (key, value)">
    /// The action to map over the key/value pairs.
    /// </param>
    /// <returns elementType="object">Mapped results.</returns>

    var results = [];
    if (!_.isNull(instance)) {
        var key = null;
        for (key in instance) {
            results.push(action(key, instance[key]));
        }
    }
    return results;
};

exports.pad = function (value, length, ch) {
    /// <summary>
    /// Pad the a value with a given character until it reaches the desired
    /// length.
    /// </summary>
    /// <param name="value" type="Object">The value to pad.</param>
    /// <param name="length" type="Number">The desired length.</param>
    /// <param name="ch" type="String">The character to pad with.</param>
    /// <returns type="String">The padded string.</returns>

    Validate.notNull(value, 'value');
    Validate.isInteger(length, 'length');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty(ch, 'ch');
    Validate.length(ch, 1, 'ch');

    var text = value.toString();
    while (text.length < length) {
        text = ch + text;
    }
    return text;
};

exports.trimEnd = function (text, ch) {
    /// <summary>
    /// Trim all instance of a given characher from the end of a string.
    /// </summary>
    /// <param name="text" type="String" mayBeNull="false">
    /// The string to trim.
    /// <param name="ch" type="String" mayBeNull="false">
    /// The character to trim.
    /// </param>
    /// <returns type="String">The trimmed string.</returns>

    Validate.isString(text, 'text');
    Validate.notNull(text, 'text');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty('ch', 'ch');
    Validate.length(ch, 1, 'ch');

    var end = text.length - 1;
    while (end >= 0 && text[end] === ch) {
        end--;
    }

    return end >= 0 ?
        text.substr(0, end + 1) :
        '';
};

exports.trimStart = function (text, ch) {
    /// <summary>
    /// Trim all instance of a given characher from the start of a string.
    /// </summary>
    /// <param name="text" type="String" mayBeNull="false">
    /// The string to trim.
    /// </param>
    /// <param name="ch" type="String" mayBeNull="false">
    /// The character to trim.
    /// </param>
    /// <returns type="String">The trimmed string.</returns>

    Validate.isString(text, 'text');
    Validate.notNull(text, 'text');
    Validate.isString(ch, 'ch');
    Validate.notNullOrEmpty(ch, 'ch');
    Validate.length(ch, 1, 'ch');

    var start = 0;
    while (start < text.length && text[start] === ch) {
        start++;
    }

    return start < text.length ?
        text.substr(start, text.length - start) :
        '';
};

exports.compareCaseInsensitive = function (first, second) {
    /// <summary>
    /// Compare two strings for equality while igorning case.
    /// </summary>
    /// <param name="first" type="String">First value.</param>
    /// <param name="second" type="String">Second value.</param>
    /// <returns type="Boolean">Whether the strings are the same.</returns>

    // NOTE: We prefer uppercase on Windows for historical reasons where it was
    // possible to have alphabets where several uppercase characters mapped to
    // the same lowercase character.

    if (_.isString(first) && !_.isNullOrEmpty(first)) {
        first = first.toUpperCase();
    }

    if (_.isString(first) && !_.isNullOrEmpty(second)) {
        second = second.toUpperCase();
    }

    return first === second;
};

/// <field name="url" type="Object">
/// Path specific utilities for working with URIs.
/// </field>
exports.url = {
    /// <field name="separator" type="String">
    /// The path separator character used for combining path segments.
    /// </field>
    separator: '/',

    combinePathSegments: function () {
        /// <summary>
        /// Combine several segments into a path.
        /// </summary>
        /// <param parameterArray="true" elementType="String">
        /// The segments of the path that should be combined.
        /// </param>
        /// <returns type="String">The combined path.</returns>

        // Normalize the segements
        var segments = [];
        var i = 0;
        Validate.notNullOrEmpty(arguments, 'arguments');
        for (i = 0; i < arguments.length; i++) {
            var segment = arguments[i];
            Validate.isString(segment, _.format('argument[{0}]', i));

            if (i !== 0) {
                segment = _.trimStart(segment || '', _.url.separator);
            }
            if (i < arguments.length - 1) {
                segment = _.trimEnd(segment || '', _.url.separator);
            }

            segments.push(segment);
        }

        // Combine the segments
        return segments.reduce(
            function (a, b) { return a + _.url.separator + b; });
    },

    getQueryString: function (parameters) {
        /// <summary>
        /// Converts an Object instance into a query string
        /// </summary>
        /// <param name="parameters" type="Object">The parameters from which to create a query string.</param>
        /// <returns type="String">A query string</returns>
        
        Validate.notNull(parameters, 'parameters');
        Validate.isObject(parameters, 'parameters');

        var pairs = [];
        for (var parameter in parameters) {
            var value = parameters[parameter];
            if (exports.isObject(value)) {
                value = exports.toJson(value);
            }
            pairs.push(encodeURIComponent(parameter) + "=" + encodeURIComponent(value));
        }

        return pairs.join("&");
    },

    combinePathAndQuery: function (path, queryString) {
        /// <summary>
        /// Concatenates the URI query string to the URI path.
        /// </summary>
        /// <param name="path" type="String>The URI path</param>
        /// <param name="queryString" type="String>The query string.</param>
        /// <returns type="String>The concatenated URI path and query string.</returns>
        Validate.notNullOrEmpty(path, 'path');
        Validate.isString(path, 'path');
        if (_.isNullOrEmpty(queryString)) {
            return path;
        }
        Validate.isString(queryString, 'queryString');

        if (path.indexOf('?') >= 0) {
            return path + '&' + exports.trimStart(queryString, '?');
        } else {
            return path + '?' + exports.trimStart(queryString, '?');
        }
    },

    isAbsoluteUrl: function (url) {
        /// <summary>
        /// Currently just a simple check if the url begins with http:// or https:/
        /// </summary>
        if (_.isNullOrEmpty(url)) {
            return false;
        }

        var start = url.substring(0, 7).toLowerCase();
        return (start  == "http://" || start == "https:/");
    },

    isHttps: function (url) {
        /// <summary>
        /// Simple check to verify if url begins with https:/
        /// </summary>
        if (_.isNullOrEmpty(url)) {
            return false;
        }

        var start = url.substring(0, 7).toLowerCase();
        return (start == "https:/");
    }

};

exports.tryParseIsoDateString = function (text) {
    /// <summary>
    /// Try to parse an ISO date string.
    /// </summary>
    /// <param name="text" type="String">The text to parse.</param>
    /// <returns type="Date">The parsed Date or null.</returns>

    return Platform.tryParseIsoDateString(text);
};

exports.createError = function (exceptionOrMessage, request) {
    /// <summary>
    /// Wrap an error thrown as an exception.
    /// </summary>
    /// <param name="exceptionOrMessage">
    /// The exception or message to throw.
    /// </param>
    /// <param name="request">
    /// The failing request.
    /// </param>
    /// <returns>An object with error details</returns>

    var error;

    if (request) {
        var message = Platform.getResourceString("Extensions_DefaultErrorMessage");

        if (request.status === 0) {
            // Provide a more helpful message for connection failures
            message = Platform.getResourceString("Extensions_ConnectionFailureMessage");
        } else {
            // Try to pull out an error message from the response before
            // defaulting to the status
            var isText = false;
            if (request.getResponseHeader) {
                var contentType = request.getResponseHeader('Content-Type');
                if (contentType) {
                    isText = contentType.toLowerCase().indexOf("text") >= 0;
                }
            }

            try {
                var response = JSON.parse(request.responseText);
                if (typeof response === 'string') {
                    message = response;
                } else {
                    message =
                        response.error ||
                        response.description ||
                        request.statusText ||
                        Platform.getResourceString("Extensions_DefaultErrorMessage");
                }
            } catch (ex) {
                if (isText) {
                    message = request.responseText;
                } else {
                    message = request.statusText || Platform.getResourceString("Extensions_DefaultErrorMessage");
                }
            }
        }

        error = new Error(message);
        error.request = request;
    } else if (_.isString(exceptionOrMessage) && !_.isNullOrEmpty(exceptionOrMessage)) {
        error = new Error(exceptionOrMessage);
    } else if (exceptionOrMessage instanceof Error) { // If exceptionOrMessage is an Error object, use it as-is
        error = exceptionOrMessage; 
    } else {
        error = new Error(Platform.getResourceString("Extensions_DefaultErrorMessage"));
        if (!_.isNull(exceptionOrMessage)) error.exception = exceptionOrMessage;
    }

    return error;
};
},{"../Platform":76,"./Validate":86}],84:[function(_dereq_,module,exports){
(function (global){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// window.postMessage does not have a concept of responses, so this class associates messages
// with IDs so that we can identify which message a reply refers to.

var Promises = _dereq_('./Promises'),
    messageTimeoutDuration = 5 * 60 * 1000; // If no reply after 5 mins, surely there will be no reply

function PostMessageExchange() {
    var self = this;
    self._lastMessageId = 0;
    self._hasListener = false;
    self._pendingMessages = {};
}

PostMessageExchange.prototype.request = function (targetWindow, messageData, origin) {
    /// <summary>
    /// Issues a request to the target window via postMessage
    /// </summary>
    /// <param name="targetWindow" type="Object">
    /// The window object (on an actual window, or iframe) to send the request to
    /// </param>
    /// <param name="messageData" type="Object">
    /// A JSON-serializable object to pass to the target
    /// </param>
    /// <param name="origin" type="String">
    /// The expected origin (e.g., "http://example.com:81") of the recipient window.
    /// If at runtime the origin does not match, the request will not be issued.
    /// </param>
    /// <returns type="Object">
    /// A promise that completes once the target window sends back a reply, with
    /// value equal to that reply.
    /// </returns>

    var self = this,
        messageId = ++self._lastMessageId,
        envelope = { messageId: messageId, contents: messageData };

    self._ensureHasListener();

    return new Promises.Promise(function (complete, error) {
        // Track callbacks and origin data so we can complete the promise only for valid replies
        self._pendingMessages[messageId] = {
            messageId: messageId,
            complete: complete,
            error: error,
            targetWindow: targetWindow,
            origin: origin
        };

        // Don't want to leak memory, so if there's no reply, forget about it eventually
        self._pendingMessages[messageId].timeoutId = global.setTimeout(function () {
            var pendingMessage = self._pendingMessages[messageId];
            if (pendingMessage) {
                delete self._pendingMessages[messageId];
                pendingMessage.error({ status: 0, statusText: "Timeout", responseText: null });
            }
        }, messageTimeoutDuration);

        targetWindow.postMessage(JSON.stringify(envelope), origin);
    });
};

PostMessageExchange.prototype._ensureHasListener = function () {
    if (this._hasListener) {
        return;
    }
    this._hasListener = true;

    var self = this,
        boundHandleMessage = function () {
            self._handleMessage.apply(self, arguments);
        };

    if (window.addEventListener) {
        window.addEventListener('message', boundHandleMessage, false);
    } else {
        // For IE8
        window.attachEvent('onmessage', boundHandleMessage);
    }
};

PostMessageExchange.prototype._handleMessage = function (evt) {
    var envelope = this._tryDeserializeMessage(evt.data),
        messageId = envelope && envelope.messageId,
        pendingMessage = messageId && this._pendingMessages[messageId],
        isValidReply = pendingMessage && pendingMessage.targetWindow === evt.source &&
                       pendingMessage.origin === getOriginRoot(evt.origin);
    
    if (isValidReply) {
        global.clearTimeout(pendingMessage.timeoutId); // No point holding this in memory until the timeout expires
        delete this._pendingMessages[messageId];
        pendingMessage.complete(envelope.contents);
    }
};

PostMessageExchange.prototype._tryDeserializeMessage = function (messageString) {
    if (!messageString || typeof messageString !== 'string') {
        return null;
    }

    try {
        return JSON.parse(messageString);
    } catch (ex) {
        // It's not JSON, so it's not a message for us. Ignore it.
        return null;
    }
};

function getOriginRoot(url) {
    // Returns the proto/host/port part of a URL, i.e., the part that defines the access boundary
    // for same-origin policy. This is of the form "protocol://host:port", where ":port" is omitted
    // if it is the default port for that protocol.
    var parsedUrl = parseUrl(url),
        portString = parsedUrl.port ? parsedUrl.port.toString() : null,
        isDefaultPort = (parsedUrl.protocol === 'http:' && portString === '80') ||
                        (parsedUrl.protocol === 'https:' && portString === '443'),
        portSuffix = (portString && !isDefaultPort) ? ':' + portString : '';
    return parsedUrl.protocol + '//' + parsedUrl.hostname + portSuffix;
}

function parseUrl(url) {
    // https://gist.github.com/2428561 - works on IE8+. Could switch to a more manual, less magic
    // parser in the future if we need to support IE < 8.
    var elem = global.document.createElement('a');
    elem.href = url;
    return elem;
}

exports.instance = new PostMessageExchange();
exports.getOriginRoot = getOriginRoot;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Promises":85}],85:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

// In WinJS, we use WinJS.Promise.
// There's no native equivalent for regular JavaScript in the browser, so we implement it here.
// This implementation conforms to Promises/A+, making it compatible with WinJS.Promise.

// Note: There is a standard Promises/A+ test suite, to which this implementation conforms.
// See test\Microsoft.Azure.Zumo.Web.Test\promiseTests

// Declare JSHint globals
/*global setTimeout:false */

(function (exports) {
    "use strict";

    var resolutionState = { success: {}, error: {} },
        bind = function (func, target) { return function () { func.apply(target, arguments); }; }, // Older browsers lack Function.prototype.bind
        isGenericPromise = function (obj) { return obj && (typeof obj.then === "function"); };

    function Promise(init) {
        this._callbackFrames = [];
        this._resolutionState = null;
        this._resolutionValueOrError = null;
        this._resolveSuccess = bind(this._resolveSuccess, this);
        this._resolveError = bind(this._resolveError, this);

        if (init) {
            init(this._resolveSuccess, this._resolveError);
        }
    }

    Promise.prototype.then = function (success, error) {
        var callbackFrame = { success: success, error: error, chainedPromise: new Promise() };

        // If this promise is already resolved, invoke callbacks immediately. Otherwise queue them.
        if (this._resolutionState) {
            this._invokeCallback(callbackFrame);
        } else {
            this._callbackFrames.push(callbackFrame);
        }

        return callbackFrame.chainedPromise;
    };

    Promise.prototype._resolveSuccess = function (val) { this._resolve(resolutionState.success, val); };
    Promise.prototype._resolveError = function (err) { this._resolve(resolutionState.error, err); };

    Promise.prototype._resolve = function (state, valueOrError) {
        if (this._resolutionState) {
            // Can't affect resolution state when already resolved. We silently ignore the request, without throwing an error,
            // to prevent concurrent resolvers from affecting each other during race conditions.
            return;
        }

        this._resolutionState = state;
        this._resolutionValueOrError = valueOrError;

        // Notify all queued callbacks
        for (var i = 0, j = this._callbackFrames.length; i < j; i++) {
            this._invokeCallback(this._callbackFrames[i]);
        }
    };

    Promise.prototype._invokeCallback = function (frame) {
        var callbackToInvoke = this._resolutionState === resolutionState.success ? frame.success : frame.error;
        if (typeof callbackToInvoke === "function") {
            // Call the supplied callback either to transform the result (for success) or to handle the error (for error)
            // The setTimeout ensures handlers are always invoked asynchronosly, even if the promise was already resolved,
            // to avoid callers having to differentiate between sync/async cases
            setTimeout(bind(function () {
                var passthroughValue, passthroughState, callbackDidNotThrow = true;
                try {
                    passthroughValue = callbackToInvoke(this._resolutionValueOrError);
                    passthroughState = resolutionState.success;
                } catch (ex) {
                    callbackDidNotThrow = false;
                    passthroughValue = ex;
                    passthroughState = resolutionState.error;
                }

                if (callbackDidNotThrow && isGenericPromise(passthroughValue)) {
                    // By returning a futher promise from a callback, you can insert it into the chain. This is the basis for composition.
                    // This rule is in the Promises/A+ spec, but not Promises/A.
                    passthroughValue.then(frame.chainedPromise._resolveSuccess, frame.chainedPromise._resolveError);
                } else {
                    frame.chainedPromise._resolve(passthroughState, passthroughValue);
                }
            }, this), 1);
        } else {
            // No callback of the applicable type, so transparently pass existing state/value down the chain
            frame.chainedPromise._resolve(this._resolutionState, this._resolutionValueOrError);
        }
    };

    // -----------
    // Everything from here on is extensions beyond the Promises/A+ spec intended to ease code
    // sharing between WinJS and browser-based Mobile Services apps

    Promise.prototype.done = function (success, error) {
        this.then(success, error).then(null, function(err) {
            // "done" throws any final errors as global uncaught exceptions. The setTimeout
            // ensures the exception won't get caught in the Promises machinery or user code.
            setTimeout(function () { throw new Error(err); }, 1);
        });
        return undefined; // You can't chain onto a .done()
    };

    // Note that we're not implementing any of the static WinJS.Promise.* functions because
    // the Mobile Services client doesn't even expose any static "Promise" object that you
    // could reference static functions on. Developers who want to use any of the WinJS-style
    // static functions (any, join, theneach, ...) can use any Promises/A-compatible library
    // such as when.js.
    //
    // Additionally, we don't implement .cancel() yet because Mobile Services operations don't
    // support cancellation in WinJS yet either. This could be added to both WinJS and Web
    // client libraries in the future.

    exports.Promise = Promise;
})(exports);
},{}],86:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('./Extensions');
var Platform = _dereq_('../Platform');

exports.notNull = function (value, name) {
    /// <summary>
    /// Ensure the value is not null (or undefined).
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true">
    /// Optional name of the value to throw.
    /// </param>

    if (_.isNull(value)) {
        throw _.format(Platform.getResourceString("Validate_NotNullError"), name || 'Value');
    }
};

exports.notNullOrEmpty = function (value, name) {
    /// <summary>
    /// Ensure the value is not null, undefined, or empty.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (_.isNullOrEmpty(value)) {
        throw _.format(Platform.getResourceString("Validate_NotNullOrEmptyError"), name || 'Value');
    }
};

exports.notNullOrZero = function (value, name) {
    /// <summary>
    /// Ensure the value is not null, undefined, zero, or empty.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (_.isNullOrZero(value)) {
        throw _.format(Platform.getResourceString("Validate_NotNullOrEmptyError"), name || 'Value');
    }
};

exports.isValidId = function (value, name) {
    /// <summary>
    /// Ensure the value is a valid id for mobile services.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!_.isValidId(value)) {
        throw new Error((name || 'id') + ' "' + value + '" is not valid.');
    }
};

exports.isDate = function (value, name) {
    /// <summary>
    /// Ensure the value is a date.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>
    
    exports.notNull(value, name);    
    if (!_.isDate(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'Date',
            typeof value);
    }
};

exports.isNumber = function (value, name) {
    /// <summary>
    /// Ensure the value is a number.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    exports.notNull(value, name);

    if (!_.isNumber(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'Number',
            typeof value);
    }
};

exports.isFunction = function (value, name) {
    /// <summary>
    /// Ensure the value is a function.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!_.isFunction(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'Function',
            typeof value);
    }
};

exports.isValidParametersObject = function (value, name) {
    /// <summary>
    /// Ensure the Object instance of user-defined parameters is valid.
    /// </summary>
    /// <param name="value">The parameters to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    exports.notNull(value, name);
    exports.isObject(value, name);

    for (var parameter in value) {
        if (parameter.indexOf('$') === 0) {
            throw _.format(
                Platform.getResourceString("Validate_InvalidUserParameter"),
                name,
                parameter);
        }
    }
};

exports.isInteger = function (value, name) {
    /// <summary>
    /// Ensure the value is an integer.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    exports.notNull(value, name);
    exports.isNumber(value, name);

    if (parseInt(value, 10) !== parseFloat(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'number',
            typeof value);
    }
};

exports.isBool = function (value, name) {
    /// <summary>
    /// Ensure the value is a bool.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!_.isBool(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'number',
            typeof value);
    }
};

exports.isString = function (value, name) {
    /// <summary>
    /// Ensure the value is a string.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!_.isString(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'string',
            typeof value);
    }
};

exports.isObject = function (value, name) {
    /// <summary>
    /// Ensure the value is an Object.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!_.isObject(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'object',
            typeof value);
    }
};

exports.isArray = function (value, name) {
    /// <summary>
    /// Ensure the value is an Array.
    /// </summary>
    /// <param name="value" mayBeNull="true">The value to check.</param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    if (!Array.isArray(value)) {
        throw _.format(
            Platform.getResourceString("TypeCheckError"),
            name || 'Value',
            'array',
            typeof value);
    }
};

exports.length = function (value, length, name) {
    /// <summary>
    /// Ensure the value is of a given length.
    /// </summary>
    /// <param name="value" type="String">
    /// The value to check.
    /// </param>
    /// <param name="length" type="Number" integer="true">
    /// The desired length of the value.
    /// </param>
    /// <param name="name" mayBeNull="true" optional="true" type="String">
    /// Optional name of the value to throw.
    /// </param>

    exports.notNull(value, name);
    exports.isInteger(length, 'length');

    if (value.length !== length) {
        throw _.format(
            Platform.getResourceString("Validate_LengthUnexpected"),
            name || 'Value',
            length,
            value.length);
    }
};

},{"../Platform":76,"./Extensions":83}],87:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Implements a task runner that runs synchronous / asynchronous tasks one after the other.
 * @private
 */

var Validate = _dereq_('./Validate'),
    Platform = _dereq_('../Platform');

module.exports = function () {
    
    var queue = [], // queue of pending tasks 
        isBusy; // true if a task is executing
    
    return {
        run: run
    };
    
    /**
     * Runs the specified task asynchronously after all the earlier tasks have completed
     * @param task Function / task to be executed. The task can either be a synchronous function or can return a promise.
     * @returns A promise that is resolved with the value returned by the task. If the task fails the promise is rejected.
     */
    function run(task) {
        return Platform.async(function(callback) {
            // parameter validation
            Validate.isFunction(task);
            Validate.isFunction(callback);
            
            // Add the task to the queue of pending tasks and trigger task processing
            queue.push({
                task: task,
                callback: callback
            });
            processTask();
        })();
    }
    
    /**
     * Asynchronously executes the first pending task
     */
    function processTask() {
        setTimeout(function() {
            if (isBusy || queue.length === 0) {
                return;
            }

            isBusy = true;

            var next = queue.shift(),
                result,
                error;

            Platform.async(function(callback) { // Start a promise chain
                callback();
            })().then(function() {
                return next.task(); // Run the task
            }).then(function(res) { // task completed successfully
                isBusy = false;
                processTask();
                next.callback(null, res); // resolve the promise returned by the run function
            }, function(err) { // task failed
                isBusy = false;
                processTask();
                next.callback(err); // reject the promise returned by the run function
            });
        }, 0);
    }
};

},{"../Platform":76,"./Validate":86}],88:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

module.exports = {
    featuresHeaderName: "X-ZUMO-FEATURES",
    features: {
        JsonApiCall: "AJ",               // Custom API call, where the request body is serialized as JSON
        GenericApiCall: "AG",            // Custom API call, where the request body is sent 'as-is'
        AdditionalQueryParameters: "QS", // Table or API call, where the caller passes additional query string parameters
        OptimisticConcurrency: "OC",     // Table update / delete call, using Optimistic Concurrency (If-Match headers)
        TableRefreshCall: "RF",          // Refresh table call
        TableReadRaw: "TR",              // Table reads where the caller uses a raw query string to determine the items to be returned
        TableReadQuery: "TQ",            // Table reads where the caller uses a function / query OM to determine the items to be returned
        OfflineSync: "OL",               // Table operations performed as part of offline sync (push and pull)
        IncrementalPull: "IP"            // Table reads performed as part of an incremental pull 
    },
    apiVersionHeaderName: "ZUMO-API-VERSION",
    apiVersion: "2.0.1",
    table: {
        idPropertyName: "id",
        sysProps: {
            deletedColumnName: "deleted",
            createdAtColumnName: "createdAt",
            updatedAtColumnName: "updatedAt",
            versionColumnName: "version"
        },
        includeDeletedFlag: "__includeDeleted",
        operationTableName: "__operations",
        pulltimeTableName: "__pulltime"
    }
};

},{}],89:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var _ = _dereq_('./Utilities/Extensions');

/**
 * This module is the entry point for the _Azure Mobile Apps Javascript client SDK_. 
 *
 * The SDK can be consumed in multiple ways:
 * - In the form of [Cordova SDK](https://github.com/Azure/azure-mobile-apps-cordova-client) for use in a Cordova app.
 * - As a standalone Javascript bundle for use in web apps.
 * - As an npm package for use in web apps. 
 *
 * When used in the form of either Cordova SDK or a standalone Javascript bundle, the module's exports are added to the 
 * _WindowsAzure_ namespace. Here's an example of how to use it:
 * ```
 * var client = new WindowsAzure.MobileServiceClient('http://azure-mobile-apps-backend-url');
 * var table = client.getTable('mytable');
 * ```
 * 
 * When used as an npm package, here is how to use it:
 * ```
 * var AzureMobileApps = require('azure-mobile-apps-client');
 * var client = new AzureMobileApps.MobileServiceClient('http://azure-mobile-apps-backend-url');
 * var table = client.getTable('mytable');
 * ```
 * 
 * @exports azure-mobile-apps-client
 */
var api = { // Modules that need to be exposed outside the SDK for all targets
    /**
     * @type {MobileServiceClient} 
     */
    MobileServiceClient: _dereq_('./MobileServiceClient'),

    /** 
     * @type {QueryJs}
     */
    Query: _dereq_('azure-query-js').Query
};

// Target (i.e. Cordova / Browser / etc) specific definitions that need to be exposed outside the SDK
var targetExports = _dereq_('./Platform/sdkExports');

// Export shared as well as target specific APIs
for (var i in targetExports) {
    if ( _.isNull(api[i]) ) {
        api[i] = targetExports[i];
    } else {
        throw new Error('Cannot export definition ' + i + ' outside the SDK. Multiple definitions with the same name exist');
    }
}

/** 
 * @type {MobileServiceSqliteStore}
 * @name MobileServiceSqliteStore
 * @description **Note** that this class is available **_only_** as part of the Cordova SDK.
 */

module.exports = api;


},{"./MobileServiceClient":66,"./Platform/sdkExports":77,"./Utilities/Extensions":83,"azure-query-js":19}],90:[function(_dereq_,module,exports){
module.exports={
    "TypeCheckError"                                        : "'{0}' is expected to be a value of type {1}, not {2}.",
    "Validate_NotNullError"                                 : "{0} cannot be null.",
    "Validate_NotNullOrEmptyError"                          : "{0} cannot be null or empty.",
    "Validate_LengthUnexpected"                             : "{0} is expected to have length {1}, not {2}.",
    "Validate_InvalidUserParameter"                         : "{0} contains an invalid user-defined query string parameter: {1}. User-defined query string parameters must not begin with a '$'.",
    "Extensions_DefaultErrorMessage"                        : "Unexpected failure.",
    "Extensions_ConnectionFailureMessage"                   : "Unexpected connection failure.",
    "MobileServiceTable_ReadMismatchedQueryTables"          : "Cannot get the results of a query for table '{1}' via table '{0}'.",
    "MobileServiceLogin_AuthenticationProviderNotSupported" : "Unsupported authentication provider name. Please specify one of {0}.",
    "MobileServiceLogin_InvalidResponseFormat"              : "Invalid format of the authentication response.",
    "MobileServiceLogin_InvalidProvider"                    : "The first parameter must be the name of the authentication provider or a Microsoft Account authentication token.",
    "MobileServiceTable_NotSingleObject"                    : "Could not get object from response {0}.",
    "Push_ConflictWithReservedName"                         : "Template name conflicts with reserved name '{0}'.",
    "Push_InvalidTemplateName"                              : "Template name can't contain ';' or ':'.",
    "Push_NotSupportedXMLFormatAsBodyTemplateWin8"          : "The bodyTemplate is not in accepted XML format. The first node of the bodyTemplate should be Badge\/Tile\/Toast, except for the wns\/raw template, which need to be a valid XML.",
    "Push_BodyTemplateMustBeXml"                            : "Valid XML is required for any template without a raw header.",
    "Push_TagNoCommas"                                      : "Tags must not contain ','.",
    "sqliteSerializer_SerializationFailed"                  : "Failed to serialize value {0}. Column definition: {1}",
    "sqliteSerializer_DeserializationFailed"                : "Failed to deserialize value {0}. Column definition: {1}",
    "sqliteSerializer_UnsupportedColumnType"                : "Column type '{0}' is not supported",
    "sqliteSerializer_UnsupportedTypeConversion"            : "Converting value {0} of type {1} to type {2} is not supported"
}
},{}],91:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * Valid column types to be used for defining table schema.
 * These types will be mapped to an equivalent SQLite type - TEXT / INT / REAL - while performing SQLite operations.
 */
module.exports = {
    Object: "object",
    Array: "array",
    Integer: "integer",
    Int: "int",
    Float: "float",
    Real: "real",
    String: "string",
    Text: "text",
    Boolean: "boolean",
    Bool: "bool",
    Date: "date"
};

//TODO: Numeric / Number data type

},{}],92:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var Validate = _dereq_('../Utilities/Validate'),
    Platform = _dereq_('../Platform'),
    createOperationTableManager = _dereq_('./operations').createOperationTableManager,
    taskRunner = _dereq_('../Utilities/taskRunner'),
    createPullManager = _dereq_('./pull').createPullManager,
    createPushManager = _dereq_('./push').createPushManager,
    createPurgeManager = _dereq_('./purge').createPurgeManager,
    uuid = _dereq_('uuid'),
    _ = _dereq_('../Utilities/Extensions');


// NOTE: The store can be a custom store provided by the user code.
// So we do parameter validation ourselves without delegating it to the
// store, even where it is possible.

/**
 * Settings for configuring the pull behavior
 * @typedef MobileServiceSyncContext.PullSettings
 * @property {number} pageSize Specifies the number of records to request as part of a page pulled from the server tables.
 */

/**
 * Callback to delegate conflict handling to the user while pushing changes to the server. The conflict handler should
 * update the isHandled property of the pushConflict parameter appropriately on completion. If a conflict is marked as handled,
 * the push logic will attempt to push the change again. If not, the push logic will note the conflict, **skip** the change and
 * proceed to push the next change.
 * @callback MobileServiceSyncContext.ConflictHandler
 * @param {PushError} pushConflict Push conflict. 
 * @returns {Promise | undefined} This method can either return synchronously or can return a promise that is resolved 
 *                           or rejected when conflict handling completes / fails.
 */

/**
 * Callback to delegate error handling to the user while pushing changes to the server. Note that an error is a failure other
 * than a conflict. The error handler should update the isHandled property of the pushError parameter appropriately on completion.
 * If a conflict is marked as handled, the push logic will attempt to push the change again.
 * If not, the push logic will **abort** the push operation without attempting to push the remaining changes.
 * @callback MobileServiceSyncContext.ErrorHandler
 * @param {PushError} pushError Push Error.
 * @returns {Promise | undefined} This method can either return synchronously or can return a promise that is resolved 
 *                           or rejected when conflict handling completes / fails.
 */

/**
 * Defines callbacks for performing conflict and error handling.
 * @typedef {object} MobileServiceSyncContext.PushHandler
 * @property {MobileServiceSyncContext.ConflictHandler} onConflict Callback for delegating conflict handling to the user.
 * @property {MobileServiceSyncContext.ErrorHandler} onError Callback for delegating error handling to the user.
 */

/**
 * @class
 * @classdesc Context for local store operations.
 * @protected
 * 
 * @param {MobileServiceClient} client The {@link MobileServiceClient} instance to be used to make 
 *                                     requests to the backend (server).
 */
function MobileServiceSyncContext(client) {

    Validate.notNull(client, 'client');
    
    var store,
        operationTableManager,
        pullManager,
        pushManager,
        purgeManager,
        isInitialized = false,
        syncTaskRunner = taskRunner(), // Used to run push / pull tasks
        storeTaskRunner = taskRunner(); // Used to run insert / update / delete tasks on the store

    /**
     * Initializes the {@link MobileServiceSyncContext} instance. Initailizing an initialized instance of 
     * {@link MobileServiceSyncContext} will have no effect.
     * 
     * @param {MobileServiceStore} localStore An intitialized instance of the {@link MobileServiceStore local store} to be associated 
     *                                        with the {@link MobileServiceSyncContext} instance.
     * 
     * @returns {Promise} A promise that is resolved when the initialization is completed successfully.
      *                    If initialization fails, the promise is rejected with the error.
     */
    this.initialize = function (localStore) {
        
        return Platform.async(function(callback) {
            Validate.isObject(localStore);
            Validate.notNull(localStore);
            
            callback(null, createOperationTableManager(localStore));
        })().then(function(opManager) {
            operationTableManager = opManager;
            return operationTableManager.initialize(localStore);
        }).then(function() {
            store = localStore;
            pullManager = createPullManager(client, store, storeTaskRunner, operationTableManager);
            pushManager = createPushManager(client, store, storeTaskRunner, operationTableManager);
            purgeManager = createPurgeManager(store, storeTaskRunner);
        }).then(function() {
            return pullManager.initialize();
        }).then(function() {
            isInitialized = true;
        });
        
    };

    /**
     * Inserts a new object / record into the specified local table.
     * If the inserted object does not specify an id, a GUID will be used as the id.
     * 
     * @param {string} tableName Name of the local table in which the object / record is to be inserted.
     * @param {object} instance The object / record to be inserted into the local table.
     * @param {string} instance.id The id of the record. If this is null / undefined, a GUID string
     *                             will be used as the id.
     * 
     * @returns {Promise} A promise that is resolved with the inserted object when the insert operation is completed successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.insert = function (tableName, instance) { //TODO: add an insert method to the store
        return storeTaskRunner.run(function() {
            validateInitialization();
            
            // Generate an id if it is not set already 
            if (_.isNull(instance.id)) {
                instance.id = uuid.v4();
            }

            // Delegate parameter validation to upsertWithLogging
            return upsertWithLogging(tableName, instance, 'insert');
        });
    };

    /**
     * Update an object / record in the specified local table.
     * The id of the object / record identifies the record that will be updated in the table.
     * 
     * @param {string} tableName Name of the local table in which the object / record is to be updated.
     * @param {object} instance New value of the object / record to be updated.
     * @param {string} instance.id The id of the object / record identifies the record that will be updated in the table.
     * 
     * @returns {Promise} A promise that is resolved when the operation is completed successfully. 
     *                    If the operation fails, the promise is rejected.
     */
    this.update = function (tableName, instance) { //TODO: add an update method to the store
        return storeTaskRunner.run(function() {
            validateInitialization();
            
            // Delegate parameter validation to upsertWithLogging
            return upsertWithLogging(tableName, instance, 'update', true /* shouldOverwrite */);
        });
    };

    /**
     * Looks up an object / record from the specified local table using the object id.
     * 
     * @param {string} tableName Name of the local table in which to look up the object / record.
     * @param {string} id id of the object to be looked up in the local table.
     * @param {boolean} [suppressRecordNotFoundError] If set to true, lookup will return an undefined object
     *                                                if the record is not found. Otherwise, lookup will fail.
     *                                                This flag is useful to distinguish between a lookup
     *                                                failure due to the record not being present in the table
     *                                                versus a genuine failure in performing the lookup operation.
     * 
     * @returns {Promise} A promise that is resolved with the looked up object when the lookup is completed successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.lookup = function (tableName, id, suppressRecordNotFoundError) {
        
        return Platform.async(function(callback) {
            validateInitialization();
            
            Validate.isString(tableName, 'tableName');
            Validate.notNullOrEmpty(tableName, 'tableName');

            Validate.isValidId(id, 'id');

            if (!store) {
                throw new Error('MobileServiceSyncContext not initialized');
            }
            
            callback();
        })().then(function() {
            return store.lookup(tableName, id, suppressRecordNotFoundError);
        });
    };


    /**
     * Reads records from the specified local table.
     * 
     * @param {QueryJs} query A {@link QueryJs} object representing the query to use while
     *                        reading the local table
     * @returns {Promise} A promise that is resolved with an array of records read from the table, if the read is successful.
     *                    If read fails, the promise is rejected with the error.
     */
    this.read = function (query) {
        
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            validateInitialization();

            Validate.notNull(query, 'query');
            Validate.isObject(query, 'query');

            return store.read(query);
        });
    };


    /**
     * Deletes an object / record from the specified local table.
     * 
     * @param {string} tableName Name of the local table to delete the object from.
     * @param {object} instance The object to delete from the local table. 
     * @param {string} instance.id id of the record to be deleted.
     * 
     * @returns {Promise} A promise that is resolved when the delete operation completes successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.del = function (tableName, instance) {
        
        return storeTaskRunner.run(function() {
            validateInitialization();
            
            Validate.isString(tableName, 'tableName');
            Validate.notNullOrEmpty(tableName, 'tableName');

            Validate.notNull(instance);
            Validate.isValidId(instance.id);

            if (!store) {
                throw new Error('MobileServiceSyncContext not initialized');
            }

            return operationTableManager.getLoggingOperation(tableName, 'delete', instance).then(function(loggingOperation) {
                return store.executeBatch([
                    {
                        action: 'delete',
                        tableName: tableName,
                        id: instance.id
                    },
                    loggingOperation
                ]);
            });
        });
    };
    
    /**
     * Pulls changes from server table into the local store.
     * 
     * @param {QueryJs} query Query specifying which records to pull.
     * @param {string} queryId A unique string id for an incremental pull query. A null / undefined queryId 
     *                         will perform a vanilla pull, i.e. will pull all the records specified by the table
     *                         from the server 
     * @param {MobileServiceSyncContext.PullSettings} [settings] An object that defines various pull settings. 
     * 
     * @returns {Promise} A promise that is fulfilled when all records are pulled OR is rejected if the pull fails or is cancelled.  
     */
    this.pull = function (query, queryId, settings) { 
        //TODO: Implement cancel
        //TODO: Perform push before pulling
        return syncTaskRunner.run(function() {
            validateInitialization();
            
            return pullManager.pull(query, queryId, settings);
        });
    };
    
    /**
     * Pushes local changes to the corresponding tables on the server.
     * 
     * Conflict and error handling are delegated to {@link MobileServiceSyncContext#pushHandler}.
     * 
     * @returns {Promise} A promise that is fulfilled with an array of encountered conflicts when all changes
     *                    are pushed to the server without errors. Note that a conflict is not treated as an error.
     *                    The returned promise is rejected if the push fails.  
     */
    this.push = function () { //TODO: Implement cancel
        return syncTaskRunner.run(function() {
            validateInitialization();

            return pushManager.push(this.pushHandler);
        }.bind(this));
    };
    
    /**
     * Purges data from the local table as well as pending operations and any incremental sync state 
     * associated with the table.
     * 
     * A _regular purge_, would fail if there are any pending operations for the table being purged.
     * 
     * A _forced purge_ will proceed even if pending operations for the table being purged exist in the operation table. In addition,
     * it will also delete the table's pending operations.
     * 
     * @param {QueryJs} query A {@link QueryJs} object representing the query that specifies what records are to be purged.
     * @param {boolean} forcePurge If set to true, the method will perform a forced purge.
     * 
     * @returns {Promise} A promise that is fulfilled when purge is complete OR is rejected if it fails.  
     */
    this.purge = function (query, forcePurge) {
        return syncTaskRunner.run(function() {
            Validate.isObject(query, 'query');
            Validate.notNull(query, 'query');
            if (!_.isNull(forcePurge)) {
                Validate.isBool(forcePurge, 'forcePurge');
            }

            validateInitialization();

            return purgeManager.purge(query, forcePurge);
        }.bind(this));
    };

    /**
     * @property {MobileServiceSyncContext.PushHandler} pushHandler Defines push handler.
     */
    this.pushHandler = undefined;

    // Unit test purposes only
    this._getOperationTableManager = function () {
        return operationTableManager;
    };
    this._getPurgeManager = function() {
        return purgeManager;
    };
    
    // Performs upsert and logs the action in the operation table
    // Validates parameters. Callers can skip validation
    function upsertWithLogging(tableName, instance, action, shouldOverwrite) {
        Validate.isString(tableName, 'tableName');
        Validate.notNullOrEmpty(tableName, 'tableName');

        Validate.notNull(instance, 'instance');
        Validate.isValidId(instance.id, 'instance.id');
        
        if (!store) {
            throw new Error('MobileServiceSyncContext not initialized');
        }
        
        return store.lookup(tableName, instance.id, true /* suppressRecordNotFoundError */).then(function(existingRecord) {
            if (existingRecord && !shouldOverwrite) {
                throw new Error('Record with id ' + existingRecord.id + ' already exists in the table ' + tableName);
            }
        }).then(function() {
            return operationTableManager.getLoggingOperation(tableName, action, instance);
        }).then(function(loggingOperation) {
            return store.executeBatch([
                {
                    action: 'upsert',
                    tableName: tableName,
                    data: instance
                },
                loggingOperation
            ]);
        }).then(function() {
            return instance;
        });
    }

    // Throws an error if the sync context is not initialized
    function validateInitialization() {
        if (!isInitialized) {
            throw new Error ('MobileServiceSyncContext is being used before it is initialized');
        }
    }
}

module.exports = MobileServiceSyncContext;

},{"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../Utilities/taskRunner":87,"./operations":94,"./pull":95,"./purge":96,"./push":97,"uuid":56}],93:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var Validate = _dereq_('../Utilities/Validate'),
    Query = _dereq_('azure-query-js').Query,
    _ = _dereq_('../Utilities/Extensions'),
    tableHelper = _dereq_('../tableHelper'),
    Platform = _dereq_('../Platform');

/**
 * @class
 * @classdesc Represents a table in the local store.
 * @protected
 * 
 * @param {string} tableName Name of the local table.
 * @param {MobileServiceClient} client The {@link MobileServiceClient} instance associated with this table.
 */
function MobileServiceSyncTable(tableName, client) {
    Validate.isString(tableName, 'tableName');
    Validate.notNullOrEmpty(tableName, 'tableName');

    Validate.notNull(client, 'client');

    /**
     * Gets the name of the local table.
     * 
     * @returns {string} The name of the table.
     */
    this.getTableName = function () {
        return tableName;
    };

    /**
     * Gets the {@link MobileServiceClient} instance associated with this table.
     * 
     * @returns {MobileServiceClient} The {@link MobileServiceClient} associated with this table.
     */
    this.getMobileServiceClient = function () {
        return client;
    };

    /**
     * Inserts a new object / record in the local table.
     * If the inserted object does not specify an id, a GUID will be used as the id.
     * 
     * @param {object} instance Object / record to be inserted in the local table.
     * @param {string} instance.id The id of the record. If this is null / undefined, a GUID string
     *                             will be used as the id.
     * @returns {Promise} A promise that is resolved with the inserted object when the insert operation is completed successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.insert = function (instance) {
        return client.getSyncContext().insert(tableName, instance);
    };

    /**
     * Update an object / record in the local table.
     * 
     * @param {object} instance New value of the object / record.
     * @param {string} instance.id The id of the object / record identifies the record that will be updated in the table.
     * 
     * @returns {Promise} A promise that is resolved when the operation is completed successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.update = function (instance) {
        return client.getSyncContext().update(tableName, instance);
    };

    /**
     * Looks up an object / record from the local table using the object id.
     * 
     * @param {string} id id of the object to be looked up in the local table.
     * @param {boolean} [suppressRecordNotFoundError] If set to true, lookup will return an undefined object
     *                                                if the record is not found. Otherwise, lookup will fail.
     *                                                This flag is useful to distinguish between a lookup
     *                                                failure due to the record not being present in the table
     *                                                versus a genuine failure in performing the lookup operation.
     * 
     * @returns {Promise} A promise that is resolved with the looked up object when the lookup is completed successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.lookup = function (id, suppressRecordNotFoundError) {
        return client.getSyncContext().lookup(tableName, id, suppressRecordNotFoundError);
    };

    /**
     * Reads records from the local table.
     * 
     * @param {QueryJs} query A {@link QueryJs} object representing the query to use while
     *                        reading the local table
     * @returns {Promise} A promise that is resolved with an array of records read from the table, if the read is successful.
     *                    If read fails, the promise is rejected with the error.
     */
    this.read = function (query) {
        if (_.isNull(query)) {
            query = new Query(tableName);
        }
        
        return client.getSyncContext().read(query);
    };

    /**
     * Deletes an object / record from the local table.
     * 
     * @param {object} instance The object to delete from the local table. 
     * @param {string} instance.id id of the record to be deleted.
     * 
     * @returns {Promise} A promise that is resolved when the delete operation completes successfully.
     *                    If the operation fails, the promise is rejected with the error.
     */
    this.del = function (instance) {
        return client.getSyncContext().del(tableName, instance);
    };

    /**
     * Pulls changes from server table into the local table.
     * 
     * @param {QueryJs} query Query specifying which records to pull.
     * @param {string} queryId A unique string id for an incremental pull query. A null / undefined queryId 
     *                         will perform a vanilla pull, i.e. will pull all the records specified by the table
     *                         from the server 
     * @param {MobileServiceSyncContext.PullSettings} [settings] An object that defines various pull settings. 
     * 
     * @returns {Promise} A promise that is fulfilled when all records are pulled OR is rejected  with the error if pull fails.  
     */
    this.pull = function (query, queryId, settings) {
        if (!query) {
            query = new Query(tableName);
        }
        
        return client.getSyncContext().pull(query, queryId, settings);
    };

    /**
     * Purges data from the local table as well as pending operations and any incremental sync state 
     * associated with the table.
     * 
     * A _regular purge_, would fail if there are any pending operations for the table being purged.
     * 
     * A _forced purge_ will proceed even if pending operations for the table being purged exist in the operation table. In addition,
     * it will also delete the table's pending operations.
     * 
     * @param {QueryJs} query A {@link QueryJs} object representing the query that specifies what records are to be purged.
     * @param {boolean} forcePurge If set to true, the method will perform a forced purge.
     * 
     * @returns {Promise} A promise that is fulfilled when purge is complete OR is rejected with the error if it fails.  
     */
    this.purge = function (query, forcePurge) {
        if (!query) {
            query = new Query(tableName);
        }

        return client.getSyncContext().purge(query, forcePurge);
    };
}

// Define query operators
tableHelper.defineQueryOperators(MobileServiceSyncTable);

exports.MobileServiceSyncTable = MobileServiceSyncTable;

},{"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../tableHelper":99,"azure-query-js":19}],94:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Implements operation table management functions like defining the operation table,
 * adding log operations to the operation table, condensing operations, etc
 * @private
 */

var Validate = _dereq_('../Utilities/Validate'),
    Platform = _dereq_('../Platform'),
    ColumnType = _dereq_('./ColumnType'),
    taskRunner = _dereq_('../Utilities/taskRunner'),
    tableConstants = _dereq_('../constants').table,
    _ = _dereq_('../Utilities/Extensions'),
    Query = _dereq_('azure-query-js').Query;

var idPropertyName = tableConstants.idPropertyName,
    versionColumnName = tableConstants.sysProps.versionColumnName,
    operationTableName = tableConstants.operationTableName;
    
function createOperationTableManager(store) {

    Validate.isObject(store);
    Validate.notNull(store);

    var runner = taskRunner(),
        isInitialized,
        maxOperationId = 0,
        lockedOperationId,
        maxId;

    var api = {
        initialize: initialize,
        lockOperation: lockOperation,
        unlockOperation: unlockOperation,
        readPendingOperations: readPendingOperations,
        readFirstPendingOperationWithData: readFirstPendingOperationWithData,
        removeLockedOperation: removeLockedOperation,
        getLoggingOperation: getLoggingOperation,
        getMetadata: getMetadata
    };

    // Exports for testing purposes only
    api._getOperationForInsertingLog = getOperationForInsertingLog;
    api._getOperationForUpdatingLog = getOperationForUpdatingLog;

    return api;
    
    /**
     * Defines the operation table in the local store.
     * Schema of the operation table is: [ INT id | TEXT tableName | TEXT action | TEXT itemId ]
     * If the table already exists, it will have no effect.
     * @param localStore The local store to create the operation table in.
     * @returns A promise that is resolved when initialization is complete and rejected if it fails.
     */
    function initialize () {
        return store.defineTable({
            name: operationTableName,
            columnDefinitions: {
                id: ColumnType.Integer,
                tableName: ColumnType.String,
                action: ColumnType.String,
                itemId: ColumnType.String,
                metadata: ColumnType.Object 
            }
        }).then(function() {
            return getMaxOperationId();
        }).then(function(id) {
            maxId = id;
            isInitialized = true;
        });
    }
    
    /**
     * Locks the operation with the specified id.
     * 
     * TODO: Lock state and the value of the locked operation should be persisted.
     * That way we can handle the following scenario: insert -> initiate push -> connection failure after item inserted in server table
     * -> client crashes or cancels push -> client app starts again -> delete -> condense. 
     * In the above scenario if we condense insert and delete into nothing, we end up not deleting the item we sent to server.
     * And if we do not condense, insert will have no corresponding data in the table to send to the server while pushing as 
     * the record would have been deleted.
     */
    function lockOperation(id) {
        return runner.run(function() {
            // Locking a locked operation should have no effect
            if (lockedOperationId === id) {
                return;
            }
            
            if (!lockedOperationId) {
                lockedOperationId = id;
                return;
            }

            throw new Error('Only one operation can be locked at a time');
        });
    }
    
    /**
     * Unlock the locked operation
     */
    function unlockOperation() {
        return runner.run(function() {
            lockedOperationId = undefined;
        });
    }
    
    /**
     * Given an operation that will be performed on the store, this method returns a corresponding operation for recording it in the operation table.
     * The logging operation can add a new record, edit an earlier record or remove an earlier record from the operation table.
     * 
     * @param tableName Name of the table on which the action is performed
     * @param action Action performed on the table. Valid actions are 'insert', 'update' or 'delete'
     * @param item Record that is being inserted, updated or deleted. In case of 'delete', all properties other than id will be ignored.
     * 
     * @returns Promise that is resolved with the logging operation. In case of a failure the promise is rejected.
     */
    function getLoggingOperation(tableName, action, item) {
        
        // Run as a single task to avoid task interleaving.
        return runner.run(function() {
            Validate.notNull(tableName);
            Validate.isString(tableName);
            
            Validate.notNull(action);
            Validate.isString(action);
            
            Validate.notNull(item);
            Validate.isObject(item);
            Validate.isValidId(item[idPropertyName]);

            if (!isInitialized) {
                throw new Error('Operation table manager is not initialized');
            }
            
            return readPendingOperations(tableName, item[idPropertyName]).then(function(pendingOperations) {
                
                // Multiple operations can be pending for <tableName, itemId> due to an opertion being locked in the past.
                // Get the last pending operation
                var pendingOperation = pendingOperations.pop(),
                    condenseAction;
                
                // If the operation table has a pending operation, we attempt to condense the new action into the pending operation.
                // If not, we simply add a new operation.
                if (pendingOperation) {
                    condenseAction = getCondenseAction(pendingOperation, action);
                } else {
                    condenseAction = 'add';
                }

                if (condenseAction === 'add') { // Add a new operation
                    return getOperationForInsertingLog(tableName, action, item);
                } else if (condenseAction === 'modify') { // Edit the pending operation's action to be the new action.
                    return getOperationForUpdatingLog(pendingOperation.id, tableName, action /* new action */, item);
                } else if (condenseAction === 'remove') { // Remove the earlier log from the operation table
                    return getOperationForDeletingLog(pendingOperation.id);
                } else if (condenseAction === 'nop') { // NO OP. Nothing to be logged
                    return; 
                } else  { // Error
                    throw new Error('Unknown condenseAction: ' + condenseAction);
                }
            });
        });
    }
    
    /**
     * Reads the pending operations for the specified table and item / record ID from the operation table.
     * @param tableName Name of the table whose operations we are looking for
     * @param itemId ID of the record whose operations we are looking for 
     */
    function readPendingOperations(tableName, itemId) {
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            var query = new Query(operationTableName);
            return store.read(query.where(function (tableName, itemId) {
                return this.tableName === tableName && this.itemId === itemId;
            }, tableName, itemId).orderBy('id'));
        });
    }
    
    /**
     * Gets the first / oldest pending operation, i.e. the one with smallest id value
     * 
     * @returns Object containing logRecord (record from the operation table) and an optional data record (i.e. record associated with logRecord).
     * The data record will be present only for insert and update operations.
     */
    function readFirstPendingOperationWithData(lastProcessedOperationId) {
        return runner.run(function() {
            return readFirstPendingOperationWithDataInternal(lastProcessedOperationId);
        });
    }

    /**
     * Removes the operation that is currently locked
     * 
     * @returns A promise that is fulfilled when the locked operation is unlocked.
     * If no operation is currently locked, the promise is rejected.
     */
    function removeLockedOperation() {
        return removePendingOperation(lockedOperationId).then(function() {
            return unlockOperation();
        });
    }
    

    // Checks if the specified operation is locked
    function isLocked(operation) {
        return operation && operation.id === lockedOperationId;
    }

    function readFirstPendingOperationWithDataInternal(lastProcessedOperationId) {
        var logRecord, // the record logged in the operation table
            query = new Query(operationTableName).where(function(lastProcessedOperationId) {
                        return this.id > lastProcessedOperationId;
                    }, lastProcessedOperationId).orderBy('id').take(1);
        
        // Read record from operation table with the smallest ID
        return store.read(query).then(function(result) {
            if (result.length === 1) {
                logRecord = result[0];
            } else if (result.length === 0) { // no pending records
                return;
            } else {
                throw new Error('Something is wrong!');
            }
        }).then(function() {
            if (!logRecord) { // no pending records
                return;
            }
            
            if (logRecord.action === 'delete') {
                return {
                    logRecord: logRecord
                };
            }
            
            // Find the data record associated with the log record. 
            return store.lookup(logRecord.tableName, logRecord.itemId, true /* suppressRecordNotFoundError */).then(function(data) {
                if (data) { // Return the log record and the data record.
                    return {
                        logRecord: logRecord,
                        data: data
                    };
                }
                
                // It is possible that a log record corresponding to an insert / update operation has no corresponding
                // data record. 
                // 
                // This can happen in the following scenario:
                // insert -> push / lock operation begins -> delete -> push fails
                //  
                // In such a case, we remove the log operation from the operation table and proceed to the next log operation.
                return removePendingOperationInternal(logRecord.id).then(function() {
                    lastProcessedOperationId = logRecord.id;
                    return readFirstPendingOperationWithDataInternal(lastProcessedOperationId);
                });
            });
        });
    }
    
    function removePendingOperation(id) {
        return runner.run(function() {
            return removePendingOperationInternal(id);
        });
    }

    function removePendingOperationInternal(id) {
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            if (!id) {
                throw new Error('Invalid operation id');
            }
            return store.del(operationTableName, id);
        });
    }

    /**
     * Determines how to condense the new action into the pending operation
     * @returns 'nop' - if no action is needed
     *          'remove' - if the pending operation should be removed
     *          'modify' - if the pending action should be modified to be the new action
     *          'add' - if a new operation should be added
     */
    function getCondenseAction(pendingOperation, newAction) {
        
        var pendingAction = pendingOperation.action,
            condenseAction;
        if (pendingAction === 'insert' && newAction === 'update') {
            condenseAction = 'nop';
        } else if (pendingAction === 'insert' && newAction === 'delete') {
            condenseAction = 'remove';
        } else if (pendingAction === 'update' && newAction === 'update') {
            condenseAction = 'nop';
        } else if (pendingAction === 'update' && newAction === 'delete') {
            condenseAction = 'modify';
        } else if (pendingAction === 'delete' && newAction === 'delete') {
            condenseAction = 'nop';
        } else if (pendingAction === 'delete') {
            throw new Error('Operation ' + newAction + ' not supported as a DELETE operation is pending'); //TODO: Limitation on all client SDKs
        } else {
            throw new Error('Condense not supported when pending action is ' + pendingAction + ' and new action is ' + newAction);
        }
        
        if (isLocked(pendingOperation)) {
            condenseAction = 'add';
        }
        
        return condenseAction;
    }
    
    /**
     * Gets the operation that will insert a new record in the operation table.
     */
    function getOperationForInsertingLog(tableName, action, item) {
        return api.getMetadata(tableName, action, item).then(function(metadata) {
            return {
                tableName: operationTableName,
                action: 'upsert',
                data: {
                    id: ++maxId,
                    tableName: tableName,
                    action: action,
                    itemId: item[idPropertyName],
                    metadata: metadata
                }
            };
        });
    }
    
    /**
     * Gets the operation that will update an existing record in the operation table.
     */
    function getOperationForUpdatingLog(operationId, tableName, action, item) {
        return api.getMetadata(tableName, action, item).then(function(metadata) {
            return {
                tableName: operationTableName,
                action: 'upsert',
                data: {
                    id: operationId,
                    action: action,
                    metadata: metadata
                }
            };
        });
    }
    
    /**
     * Gets an operation that will delete a record from the operation table.
     */
    function getOperationForDeletingLog(operationId) {
        return {
            tableName: operationTableName,
            action: 'delete',
            id: operationId
        };
    }

    /**
     * Gets the metadata to associate with a log record in the operation table
     * 
     * @param action 'insert', 'update' and 'delete' correspond to the insert, update and delete operations.
     *               'upsert' is a special action that is used only in the context of conflict handling.
     */
    function getMetadata(tableName, action, item) {
        
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            var metadata = {};

            // If action is update and item defines version property OR if action is insert / update,
            // define metadata.version to be the item's version property
            if (action === 'upsert' || 
                action === 'insert' ||
                (action === 'update' && item.hasOwnProperty(versionColumnName))) {
                metadata[versionColumnName] = item[versionColumnName];
                return metadata;
            } else if (action == 'update' || action === 'delete') { // Read item's version property from the table
                return store.lookup(tableName, item[idPropertyName], true /* suppressRecordNotFoundError */).then(function(result) {
                    if (result) {
                        metadata[versionColumnName] = result[versionColumnName];
                    }
                    return metadata;
                });
            } else {
                throw new Error('Invalid action ' + action);
            }
        });
        
    }

    /**
     * Gets the largest operation ID from the operation table
     * If there are no records in the operation table, returns 0.
     */
    function getMaxOperationId() {
        var query = new Query(operationTableName);
        return store.read(query.orderByDescending('id').take(1)).then(function(result) {
            Validate.isArray(result);
            
            if (result.length === 0) {
                return 0;
            } else if (result.length === 1) {
                return result[0].id;
            } else {
                throw new Error('something is wrong!');
            }
        });
    }
}

module.exports = {
    createOperationTableManager: createOperationTableManager
};

},{"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../Utilities/taskRunner":87,"../constants":88,"./ColumnType":91,"azure-query-js":19}],95:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Table pull logic implementation
 * @private
 */

var Validate = _dereq_('../Utilities/Validate'),
    Query = _dereq_('azure-query-js').Query,
    Platform = _dereq_('../Platform'),
    taskRunner = _dereq_('../Utilities/taskRunner'),
    MobileServiceTable = _dereq_('../MobileServiceTable'),
    constants = _dereq_('../constants'),
    tableConstants = constants.table,
    _ = _dereq_('../Utilities/Extensions');
    
var defaultPageSize = 50,
    idPropertyName = tableConstants.idPropertyName,
    pulltimeTableName = tableConstants.pulltimeTableName,
    sysProps = tableConstants.sysProps;
    
function createPullManager(client, store, storeTaskRunner, operationTableManager) {
    // Task runner for running pull tasks. We want only one pull to run at a time. 
    var pullTaskRunner = taskRunner(),
        mobileServiceTable,
        pageSize,
        lastKnownUpdatedAt, // get the largest known value of the updatedAt column 
        tablePullQuery, // the query specified by the user for pulling the table 
        pagePullQuery, // query for fetching a single page
        pullQueryId; // the query ID. if this is a non-null string, the pull will be performed incrementally.
    
    return {
        initialize: initialize,
        pull: pull
    };

    /**
     * Creates and initializes the table used to store the state for performing incremental pull
     */
    function initialize () {
        return pullTaskRunner.run(function() {
            return store.defineTable({
                name: pulltimeTableName,
                columnDefinitions: {
                    id: 'string', // column for storing queryId
                    tableName: 'string', // column for storing table name 
                    value: 'date' // column for storing lastKnownUpdatedAt
                }
            });
        });
    }
    
    /**
     * Pulls changes from the server tables into the local store.
     * 
     * @param query Query specifying which records to pull
     * @param pullQueryId A unique string ID for an incremental pull query OR null for a vanilla pull query.
     * @param [settings] An object that defines the various pull settings - currently only pageSize
     * 
     * @returns A promise that is fulfilled when all records are pulled OR is rejected if the pull fails or is cancelled.  
     */
    function pull(query, queryId, settings) {
        //TODO: support pullQueryId
        //TODO: page size should be configurable
        
        return pullTaskRunner.run(function() {
            validateQuery(query, 'query');
            Validate.isString(queryId, 'queryId'); // non-null string or null - both are valid
            Validate.isObject(settings, 'settings');

            settings = settings || {};
            if (_.isNull(settings.pageSize)) {
                pageSize = defaultPageSize;
            } else if (_.isInteger(settings.pageSize) && settings.pageSize > 0) {
                pageSize = settings.pageSize;
            } else {
                throw new Error('Page size must be a positive integer. Page size ' + settings.pageSize + ' is invalid.');
            }

            // Make a copy of the query as we will be modifying it
            tablePullQuery = copyQuery(query);            

            mobileServiceTable = client.getTable(tablePullQuery.getComponents().table);
            mobileServiceTable._features = queryId ? [constants.features.OfflineSync, constants.features.IncrementalPull] : [constants.features.OfflineSync];
            pullQueryId = queryId;

            // Set up the query for initiating a pull and then pull all pages          
            return setupQuery().then(function() {
                return pullAllPages();
            });
        });
    }

    // Setup the query to get started with pull
    function setupQuery() {
        return getLastKnownUpdatedAt().then(function(updatedAt) {
            buildQueryFromLastKnownUpdateAt(updatedAt);
        });
    }

    // Pulls all pages from the server table, one page at a time.
    function pullAllPages() {
        // 1. Pull one page
        // 2. Check if Pull is complete
        // 3. If it is complete, go to 5. If not, update the query to fetch the next page.
        // 4. Go to 1
        // 5. DONE
        return pullPage().then(function(pulledRecords) {
            if (!isPullComplete(pulledRecords)) {
                // update query and continue pulling the remaining pages
                return updateQueryForNextPage(pulledRecords).then(function() {
                    return pullAllPages();
                });
            }
        });
    }
    
    // Check if the pull is complete or if there are more records left to be pulled
    function isPullComplete(pulledRecords) {
         // Pull is NOT complete when the number of fetched records is less than page size as the server's page size
         // can cause the result set to be smaller than the requested page size.
         // We consider the pull to be complete only when the result contains 0 records.
        return pulledRecords.length === 0;
    }
    
    // Pull the page as described by the query
    function pullPage() {

        // Define appropriate parameter to enable fetching of deleted records from the server.
        // Assumption is that soft delete is enabled on the server table.
        var params = {};
        params[tableConstants.includeDeletedFlag] = true;

        var pulledRecords;
        
        // azure-query-js does not support datatimeoffset
        // As a temporary workaround, convert the query to an odata string and replace datetime' with datetimeoffset'. 
        var queryString = pagePullQuery.toOData();
        var tableName = pagePullQuery.getComponents().table;
        queryString = queryString.replace(new RegExp('^/' + tableName), '').replace("datetime'", "datetimeoffset'");

        return mobileServiceTable.read(queryString, params).then(function(result) {
            pulledRecords = result || [];

            var chain = Platform.async(function(callback) {
                callback();
            })();
            
            // Process all records in the page
            for (var i = 0; i < pulledRecords.length; i++) {
                chain = processPulledRecord(chain, tableName, pulledRecords[i]); 
            }

            return chain;
        }).then(function(pulled) {
            return onPagePulled();
        }).then(function() {
            return pulledRecords;
        });
    }

    // Processes the pulled record by taking an appropriate action, which can be one of:
    // inserting, updating, deleting in the local store or no action at all.
    function processPulledRecord(chain, tableName, pulledRecord) {
        return chain.then(function() {

            // Update the store as per the pulled record 
            return storeTaskRunner.run(function() {
                if (Validate.isValidId(pulledRecord[idPropertyName])) {
                    throw new Error('Pulled record does not have a valid ID');
                }
                
                return operationTableManager.readPendingOperations(tableName, pulledRecord[idPropertyName]).then(function(pendingOperations) {
                    // If there are pending operations for the record we just pulled, we ignore it.
                    if (pendingOperations.length > 0) {
                        return;
                    }

                    if (pulledRecord[sysProps.deletedColumnName] === true) {
                        return store.del(tableName, pulledRecord.id);
                    } else if (pulledRecord[sysProps.deletedColumnName] === false) {
                        return store.upsert(tableName, pulledRecord);
                    } else {
                        throw new Error("'" + sysProps.deletedColumnName + "' system property is missing. Pull cannot work without it.'");
                    }
                });
            });
        });
    }

    // Gets the last known updatedAt timestamp.
    // For incremental pull, we check if we have any information about it in the store.
    // If not we simply use 1970 to start the sync operation, just like a non-incremental / vanilla pull.
    function getLastKnownUpdatedAt() {
        
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            
            if (pullQueryId) { // read lastKnownUpdatedAt from the store
                return store.lookup(pulltimeTableName, pullQueryId, true /* suppressRecordNotFoundError */);
            }

        }).then(function(result) {

            if (result) {
                return result.value;
            }

            return new Date (1970, 0, 0);
        });
    }

    // update the query to pull the next page
    function updateQueryForNextPage(pulledRecords) {
        return Platform.async(function(callback) {
            callback();
        })().then(function() {

            if (!pulledRecords) {
                throw new Error('Something is wrong. pulledRecords cannot be null at this point');
            }

            var lastRecord = pulledRecords[ pulledRecords.length - 1];

            if (!lastRecord) {
                throw new Error('Something is wrong. Possibly invalid response from the server. lastRecord cannot be null!');
            }

            var lastRecordTime = lastRecord[tableConstants.sysProps.updatedAtColumnName];

            if (!_.isDate(lastRecordTime)) {
                throw new Error('Property ' + tableConstants.sysProps.updatedAtColumnName + ' of the last record should be a valid date');
            }

            if (lastRecordTime.getTime() === lastKnownUpdatedAt.getTime()) {
                pagePullQuery.skip(pagePullQuery.getComponents().skip + pulledRecords.length);
            } else {
                buildQueryFromLastKnownUpdateAt(lastRecordTime);
            }
        });
    }

    // Builds a query to fetch one page
    // Records with updatedAt values >= updatedAt will be fetched 
    function buildQueryFromLastKnownUpdateAt(updatedAt) {

        lastKnownUpdatedAt = updatedAt;

        // Make a copy of the table query and tweak it to fetch the next first page
        pagePullQuery = copyQuery(tablePullQuery);
        pagePullQuery = pagePullQuery.where(function(lastKnownUpdatedAt) {
            // Ideally we would have liked to set this[tableConstants.sysProps.updatedAtColumnName]
            // but this isn't supported
            return this.updatedAt >= lastKnownUpdatedAt;
        }, lastKnownUpdatedAt);

        pagePullQuery.orderBy(tableConstants.sysProps.updatedAtColumnName);
        pagePullQuery.take(pageSize);
    }

    // Called after a page is pulled and processed
    function onPagePulled() {

        // For incremental pull, make a note of the lastKnownUpdatedAt in the store
        if (pullQueryId) {
            return store.upsert(pulltimeTableName, {
                id: pullQueryId,
                tableName: pagePullQuery.getComponents().table,
                value: lastKnownUpdatedAt
            });
        }
    }

    // Not all query operations are allowed while pulling.
    // This function validates that the query does not perform unsupported operations.
    function validateQuery(query) {
        Validate.isObject(query);
        Validate.notNull(query);
        
        var components = query.getComponents();
        
        for (var i in components.ordering) {
            throw new Error('orderBy and orderByDescending clauses are not supported in the pull query');
        }
        
        if (components.skip) {
            throw new Error('skip is not supported in the pull query');
        }

        if (components.take) {
            throw new Error('take is not supported in the pull query');
        }

        if (components.selections && components.selections.length !== 0) {
            throw new Error('select is not supported in the pull query');
        }

        if (components.includeTotalCount) {
            throw new Error('includeTotalCount is not supported in the pull query');
        }
    }

    // Makes a copy of the QueryJS object
    function copyQuery(query) {
        var components = query.getComponents();
        var queryCopy = new Query(components.table);
        queryCopy.setComponents(components);

        return queryCopy;
    }
}

exports.createPullManager = createPullManager;

},{"../MobileServiceTable":68,"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../Utilities/taskRunner":87,"../constants":88,"azure-query-js":19}],96:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Table purge logic implementation
 * @private
 */

var Validate = _dereq_('../Utilities/Validate'),
    Query = _dereq_('azure-query-js').Query,
    Platform = _dereq_('../Platform'),
    taskRunner = _dereq_('../Utilities/taskRunner'),
    MobileServiceTable = _dereq_('../MobileServiceTable'),
    tableConstants = _dereq_('../constants').table,
    _ = _dereq_('../Utilities/Extensions');
    
function createPurgeManager(store, storeTaskRunner) {

    return {
        purge: purge
    };

    /**
     * Purges data, pending operations and incremental sync state associated with a local table
     * A regular purge, would fail if there are any pending operations for the table being purged.
     * A forced purge will proceed even if pending operations for the table being purged exist in the operation table. In addition,
     * it will also delete the table's pending operations.
     * 
     * @param query Query object that specifies what records are to be purged
     * @param [forcePurge] An optional boolean, which if set to true, will perform a forced purge.
     * 
     * @returns A promise that is fulfilled when purge is complete OR is rejected if it fails.  
     */
    function purge(query, forcePurge) {
        return storeTaskRunner.run(function() {
            Validate.isObject(query, 'query');
            Validate.notNull(query, 'query');
            if (!_.isNull(forcePurge)) {
                Validate.isBool(forcePurge, 'forcePurge');
            }

            // Query for pending operations associated with this table
            var operationQuery = new Query(tableConstants.operationTableName)
                .where(function(tableName) {
                    return this.tableName === tableName; 
                }, query.getComponents().table);
            
            // Query to search for the incremental sync state associated with this table
            var incrementalSyncStateQuery = new Query(tableConstants.pulltimeTableName)
                .where(function(tableName) {
                    return this.tableName === tableName;
                }, query.getComponents().table);

            // 1. In case of force purge, simply remove operation table entries for the table being purged
            //    Else, ensure no records exists in the operation table for the table being purged.
            // 2. Delete pull state for all incremental queries associated with this table
            // 3. Delete the records from the table as specified by 'query'
            // 
            // TODO: All store operations performed while purging should be part of a single transaction
            // Note: An incremental pull after a purge should fetch purged records again. If we run 3 before 2,
            // we might end up in a state where 3 is complete but 2 has failed. In such a case subsequent incremental pull
            // will not re-fetch purged records. Hence, it is important to run 2 before 3.
            // There still exists a possibility of pending operations being deleted while force purging and the subsequent
            // operations failing which is tracked by the above TODO. 
            return Platform.async(function(callback) {
                callback();
            })().then(function() {
                if (forcePurge) {
                    return store.del(operationQuery);
                } else {
                    return store.read(operationQuery).then(function(operations) {
                        if (operations.length > 0) {
                            throw new Error('Cannot purge the table as it contains pending operations');
                        }
                    });
                }
            }).then(function() {
                return store.del(incrementalSyncStateQuery);
            }).then(function() {
                return store.del(query);
            });
        });
    }
}

exports.createPurgeManager = createPurgeManager;

},{"../MobileServiceTable":68,"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../Utilities/taskRunner":87,"../constants":88,"azure-query-js":19}],97:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Table push logic implementation
 * @private
 */

var Validate = _dereq_('../Utilities/Validate'),
    Query = _dereq_('azure-query-js').Query,
    verror = _dereq_('verror'),
    Platform = _dereq_('../Platform'),
    taskRunner = _dereq_('../Utilities/taskRunner'),
    MobileServiceTable = _dereq_('../MobileServiceTable'),
    constants = _dereq_('../constants'),
    tableConstants = constants.table,
    sysProps = _dereq_('../constants').table.sysProps,
    createPushError = _dereq_('./pushError').createPushError,
    handlePushError = _dereq_('./pushError').handlePushError,
    _ = _dereq_('../Utilities/Extensions');

function createPushManager(client, store, storeTaskRunner, operationTableManager) {
    // Task runner for running push tasks. We want only one push to run at a time. 
    var pushTaskRunner = taskRunner(),
        lastProcessedOperationId,
        pushConflicts,
        lastFailedOperationId,
        retryCount,
        maxRetryCount = 5,
        pushHandler;
    
    return {
        push: push
    };

    /**
     * Pushes operations performed on the local store to the server tables.
     * 
     * @returns A promise that is fulfilled when all pending operations are pushed. Conflict errors won't fail the push operation.
     *          All conflicts are collected and returned to the user at the completion of the push operation. 
     *          The promise is rejected if pushing any record fails for reasons other than conflict or is cancelled.
     */
    function push(handler) {
        return pushTaskRunner.run(function() {
            reset();
            pushHandler = handler;
            return pushAllOperations().then(function() {
                return pushConflicts;
            });
        });
    }
    
    // Resets the state for starting a new push operation
    function reset() {
        lastProcessedOperationId = -1; // Initialize to an invalid operation id
        lastFailedOperationId = -1; // Initialize to an invalid operation id
        retryCount = 0;
        pushConflicts = [];
    }
    
    // Pushes all pending operations, one at a time.
    // 1. Read the oldest pending operation
    // 2. If 1 did not fetch any operation, go to 6.
    // 3. Lock the operation obtained in step 1 and push it.
    // 4. If 3 is successful, unlock and remove the locked operation from the operation table and go to 1
    //    Else if 3 fails, unlock the operation.
    // 5. If the error is a conflict, handle the conflict and go to 1.
    // 6. Else, EXIT.
    function pushAllOperations() {
        var currentOperation,
            pushError;
        return readAndLockFirstPendingOperation().then(function(pendingOperation) {
            if (!pendingOperation) {
                return; // No more pending operations. Push is complete
            }
            
            var currentOperation = pendingOperation;
            
            return pushOperation(currentOperation).then(function() {
                return removeLockedOperation();
            }, function(error) {
                // failed to push
                return unlockPendingOperation().then(function() {
                    pushError = createPushError(store, operationTableManager, storeTaskRunner, currentOperation, error);
                    //TODO: If the conflict isn't resolved but the error is marked as handled by the user,
                    //we can end up in an infinite loop. Guard against this by capping the max number of 
                    //times handlePushError can be called for the same record.

                    // We want to reset the retryCount when we move on to the next record
                    if (lastFailedOperationId !== currentOperation.logRecord.id) {
                        lastFailedOperationId = currentOperation.logRecord.id;
                        retryCount = 0;
                    }

                    // Cap the number of times error handling logic is invoked for the same record
                    if (retryCount < maxRetryCount) {
                        ++retryCount;
                        return handlePushError(pushError, pushHandler);
                    }
                });
            }).then(function() {
                if (!pushError) { // no push error
                    lastProcessedOperationId = currentOperation.logRecord.id;
                } else if (pushError && !pushError.isHandled) { // push failed and not handled

                    // For conflict errors, we add the error to the list of errors and continue pushing other records
                    // For other errors, we abort push.
                    if (pushError.isConflict()) {
                        lastProcessedOperationId = currentOperation.logRecord.id;
                        pushConflicts.push(pushError);
                    } else { 
                        throw new verror.VError(pushError.getError(), 'Push failed while pushing operation for tableName : ' + currentOperation.logRecord.tableName +
                                                                 ', action: ' + currentOperation.logRecord.action +
                                                                 ', and record ID: ' + currentOperation.logRecord.itemId);
                    }
                } else { // push error handled
                    // No action needed - We want the operation to be re-pushed.
                    // No special handling is needed even if the operation was cancelled by the user as part of error handling  
                }
            }).then(function() {
                return pushAllOperations(); // push remaining operations
            });
        });
    }
    
    function readAndLockFirstPendingOperation() {
        return storeTaskRunner.run(function() {
            var pendingOperation;
            return operationTableManager.readFirstPendingOperationWithData(lastProcessedOperationId).then(function(operation) {
                pendingOperation = operation;
                
                if (!pendingOperation) {
                    return;
                }
                
                return operationTableManager.lockOperation(pendingOperation.logRecord.id);
            }).then(function() {
                return pendingOperation;
            });
        });
    }
    
    function unlockPendingOperation() {
        return storeTaskRunner.run(function() {
            return operationTableManager.unlockOperation();
        });
    }
    
    function removeLockedOperation() {
        return storeTaskRunner.run(function() {
            return operationTableManager.removeLockedOperation();
        });
    }
    
    function pushOperation(operation) {
        
        return Platform.async(function(callback) {
            callback();
        })().then(function() {
            // TODO: Invoke push request filter to allow user to change how the record is sent to the server
        }).then(function() {
            // perform push

            var mobileServiceTable = client.getTable(operation.logRecord.tableName);
            mobileServiceTable._features = [constants.features.OfflineSync];
            switch(operation.logRecord.action) {
                case 'insert':
                    removeSysProps(operation.data); // We need to remove system properties before we insert in the server table
                    return mobileServiceTable.insert(operation.data).then(function(result) {
                        return store.upsert(operation.logRecord.tableName, result); // Upsert the result of insert into the local table
                    });
                case 'update':
                    return mobileServiceTable.update(operation.data).then(function(result) {
                        return store.upsert(operation.logRecord.tableName, result); // Upsert the result of update into the local table
                    });
                case 'delete':
                    // Use the version info form the log record.
                    operation.logRecord.metadata = operation.logRecord.metadata || {};
                    return mobileServiceTable.del({id: operation.logRecord.itemId, version: operation.logRecord.metadata.version});
                default:
                    throw new Error('Unsupported action ' + operation.logRecord.action);
            }
            
        }).then(function() {
            // TODO: Invoke hook to notify record push completed successfully
        });
        
    }
    
    function removeSysProps(record) {
        for (var i in sysProps) {
            delete record[sysProps[i]];
        }
    }
}

exports.createPushManager = createPushManager;

},{"../MobileServiceTable":68,"../Platform":76,"../Utilities/Extensions":83,"../Utilities/Validate":86,"../Utilities/taskRunner":87,"../constants":88,"./pushError":98,"azure-query-js":19,"verror":61}],98:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/**
 * @file Table push error handling implementation. Defines various methods for resolving conflicts
 * @private
 */

var Platform = _dereq_('../Platform'),
    _ = _dereq_('../Utilities/Extensions'),
    tableConstants = _dereq_('../constants').table;
    
var operationTableName = tableConstants.operationTableName,
    deletedColumnName = tableConstants.sysProps.deletedColumnName;

/**
 * Creates a pushError object that wraps the low level error encountered while pushing
 * and adds other useful methods for error handling.
 * @private
 */
function createPushError(store, operationTableManager, storeTaskRunner, pushOperation, operationError) {

    // Calling getError will return the operationError object to the caller without cloning it.
    // (As operationError can have loops, our simplistic makeCopy(..) method won't be able to clone it)
    //
    // To guard ourselves from possible modifications to the operationError object by the caller,
    // we make a copy of its members we may need later.
    var serverRecord = makeCopy(operationError.serverInstance),
        statusCode = makeCopy(operationError.request.status);
    
    /**
     * @class PushError
     * @classdesc A conflict / error encountered while pushing a change to the server. This wraps the underlying error
     * and provides additional helper methods for handling the conflict / error. 
     * @protected
     */
    return {
        /**
         * @member {boolean} isHandled When set to true, the push logic will consider the conflict / error to be handled.
         *                             In such a case, an attempt would be made to push the change to the server again.
         *                             By default, `isHandled` is set to false.
         * @instance
         * @memberof PushError
         */
        isHandled: false,

        getError: getError,
        
        // Helper methods
        isConflict: isConflict,
        
        // Data query methods
        getTableName: getTableName,
        getAction: getAction,
        getServerRecord: getServerRecord,
        getClientRecord: getClientRecord,

        // Error handling methods
        cancelAndUpdate: cancelAndUpdate,
        cancelAndDiscard: cancelAndDiscard,
        cancel: cancel,
        update: update,
        changeAction: changeAction
    };

    /**
     * Gets the name of the table for which conflict / error occurred.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @returns {string} The name of the table for which conflict / error occurred. 
     */
    function getTableName() {
        return makeCopy(pushOperation.logRecord.tableName);
    }
    
    /**
     * Gets the action for which conflict / error occurred.
     * 
     * @function
     * @instance
     * @memberof PushError 
     * 
     * @returns {string} The action for which conflict / error occurred. Valid action values
     *                   are _'insert'_, _'update'_ or _'delete'_.
     */
    function getAction() {
        return makeCopy(pushOperation.logRecord.action);
    }
    
    /**
     * Gets the value of the record on the server, if available, when the conflict / error occurred.
     * This is useful while handling conflicts. However, **note** that in the event of
     * a conflict / error, the server may not always respond with the server record's value.
     * Example: If the push failed even before the client value reaches the server, we won't have the server value.
     * Also, there are some scenarios where the server does not respond with the server value.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @returns {object} Server record value.
     */
    function getServerRecord() {
        return makeCopy(serverRecord);
    }
    
    /**
     * Gets the value of the record that was pushed to the server when the conflict /error occurred.
     * Note that this may not be the latest value as local tables could have changed after we
     * started the push operation. 
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @returns {object} Client record value.
     */
    function getClientRecord() {
        return makeCopy(pushOperation.data);
    }
    
    /**
     * Gets the underlying error encountered while performing the push operation. This contains
     * grannular details of the failure like server response, error code, etc.
     * 
     * Note: Modifying value returned by this method will have a side effect of permanently
     * changing the underlying error object
     * 
     * @function
     * @instance
     * @memberof PushError
     * @returns {Error} The underlying error object.
     */
    function getError() {
        // As operationError can have loops, our simplistic makeCopy(..) method won't be able to clone it. 
        // Return without cloning.
        return operationError;
    }
    
    /**
     * Checks if the error is a conflict.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @returns {boolean} true if the error is a conflict. False, otherwise.
     */
    function isConflict() {
        return statusCode === 409 || statusCode === 412;
    }
    
    /**
     * Cancels the push operation for the current record and updates the record in the local store.
     * This will also set {@link PushError#isHandled} to true.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @param {object} newValue New value of the client record that will be updated in the local store.
     * 
     * @returns {Promise} A promise that is fulfilled when the operation is cancelled and the client record is updated.
     *                    The promise is rejected with the error if `cancelAndUpdate` fails.
     */
    function cancelAndUpdate(newValue) {
        var self = this;
        return storeTaskRunner.run(function() {

            if (pushOperation.logRecord.action === 'delete') {
                throw new Error('Cannot update a deleted record');
            }
            
            if (_.isNull(newValue)) {
                throw new Error('Need a valid object to update the record');
            }
            
            if (!_.isValidId(newValue.id)) {
                throw new Error('Invalid ID: ' + newValue.id);
            }
            
            if (newValue.id !== pushOperation.data.id) {
                throw new Error('Only updating the record being pushed is allowed');
            }
            
            // Operation to update the data record
            var dataUpdateOperation = {
                tableName: pushOperation.logRecord.tableName,
                action: 'upsert',
                data: newValue
            };
            
            // Operation to delete the log record
            var logDeleteOperation = {
                tableName: operationTableName,
                action: 'delete',
                id: pushOperation.logRecord.id
            };
            
            // Execute the log and data operations
            var operations = [dataUpdateOperation, logDeleteOperation];
            return store.executeBatch(operations).then(function() {
                self.isHandled = true;
            });
        });
    }
    
    /**
     * Cancels the push operation for the current record and discards the record from the local store.
     * This will also set {@link PushError#isHandled} to true.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @returns {Promise} A promise that is fulfilled when the operation is cancelled and the client record is discarded
     *                    and rejected with the error if `cancelAndDiscard` fails.
     */
    function cancelAndDiscard() {
        var self = this;
        return storeTaskRunner.run(function() {
            
            // Operation to delete the data record
            var dataDeleteOperation = {
                tableName: pushOperation.logRecord.tableName,
                action: 'delete',
                id: pushOperation.logRecord.itemId
            };
            
            // Operation to delete the log record
            var logDeleteOperation = {
                tableName: operationTableName,
                action: 'delete',
                id: pushOperation.logRecord.id
            };
            
            // Execute the log and data operations
            var operations = [dataDeleteOperation, logDeleteOperation];
            return store.executeBatch(operations).then(function() {
                self.isHandled = true;
            });
        });
    }
    
    /**
     * Updates the client data record associated with the current operation.
     * If required, the metadata in the log record will also be associated.
     * This will also set {@link PushError#isHandled} to true.
     *
     * @function
     * @instance
     * @memberof PushError
     * 
     * @param {object} newValue New value of the data record. 
     * 
     * @returns {Promise} A promise that is fulfilled when the data record is updated in the localstore.
     */
    function update(newValue) {
        var self = this;
        return storeTaskRunner.run(function() {
            if (pushOperation.logRecord.action === 'delete') {
                throw new Error('Cannot update a deleted record');
            }
            
            if (_.isNull(newValue)) {
                throw new Error('Need a valid object to update the record');
            }
            
            if (!_.isValidId(newValue.id)) {
                throw new Error('Invalid ID: ' + newValue.id);
            }
            
            if (newValue.id !== pushOperation.data.id) {
                throw new Error('Only updating the record being pushed is allowed');
            }

            //TODO: Do we need to disallow updating record if the record has been deleted after
            //we attempted push?

            return operationTableManager.getMetadata(pushOperation.logRecord.tableName, 'upsert', newValue).then(function(metadata) {
                pushOperation.logRecord.metadata = metadata;
                return store.executeBatch([
                    { // Update the log record
                        tableName: operationTableName,
                        action: 'upsert',
                        data: pushOperation.logRecord
                    },
                    { // Update the record in the local table
                        tableName: pushOperation.logRecord.tableName,
                        action: 'upsert',
                        data: newValue
                    }
                ]).then(function() {
                    self.isHandled = this;
                });
            });

        });
    }
    
    /**
     * Changes the type of operation that will be pushed to the server.
     * This is useful for handling conflicts where you might need to change the type of the 
     * operation to be able to push the changes to the server.
     * This will also set {@link PushError#isHandled} to true.
     *
     * Example: You might need to change _'insert'_ to _'update'_ to be able to push a record that 
     * was already inserted on the server.
     * 
     * Note: Changing the action to _'delete'_' will automatically remove the associated record from the 
     * data table in the local store.
     * 
     * @function
     * @instance
     * @memberof PushError
     * 
     * @param {string} newAction New type of the operation. Valid values are _'insert'_, _'update'_ and _'delete'_.
     * @param {object} [newClientRecord] New value of the client record. 
     *                          The `id` property of the new record should match the `id` property of the original record.
     *                          If `newAction` is _'delete'_, only the `id` and `version` properties will be read from `newClientRecord`.
     *                          Reading the `version` property while deleting is useful if
     *                          the conflict handler changes an _'insert'_  /_'update'_ action to _'delete'_' and also updated the version
     *                          to reflect the server version.
     * 
     * @returns {Promise} A promise that is fulfilled when the action is changed and, optionally, the data record is updated / deleted.
     *                    If this fails, the promsie is rejected with the error.
     */
    function changeAction(newAction, newClientRecord) {
        var self = this;
        return storeTaskRunner.run(function() {
            var dataOperation, // operation to edit the data record
                logOperation = { // operation to edit the log record 
                    tableName: operationTableName,
                    action: 'upsert',
                    data: makeCopy(pushOperation.logRecord)
                };

            // If a new value for the record is specified, use the version property to update the metadata
            // If not, there is nothing that needs to be changed in the metadata. Just use the metadata we already have.
            if (newClientRecord) {
                if (!newClientRecord.id) {
                    throw new Error('New client record value must specify the record ID');
                }
                    
                if (newClientRecord.id !== pushOperation.logRecord.itemId) {
                    throw new Error('New client record value cannot change the record ID. Original ID: ' +
                                    pushOperation.logRecord.id + ' New ID: ' + newClientRecord.id);
                }

                // FYI: logOperation.data and pushOperation.data are not the same thing!
                logOperation.data.metadata = logOperation.data.metadata || {};
                logOperation.data.metadata[tableConstants.sysProps.versionColumnName] = newClientRecord[tableConstants.sysProps.versionColumnName];
            }

            if (newAction === 'insert' || newAction === 'update') {
                
                // Change the action as specified
                var oldAction = logOperation.data.action;
                logOperation.data.action = newAction;

                // Update the client record, if a new value is specified
                if (newClientRecord) {
                    
                    dataOperation = {
                        tableName: pushOperation.logRecord.tableName,
                        action: 'upsert',
                        data: newClientRecord
                    };
                    
                } else if (oldAction !== 'insert' && oldAction !== 'update') {

                    // If we are here, it means we are changing the action from delete to insert / update. 
                    // In such a case we expect newClientRecord to be non-null as we won't otherwise know what to insert / update.
                    // Example: changing delete to insert without specifying a newClientRecord is meaningless.
                    throw new Error('Changing action from ' + oldAction + ' to ' + newAction +
                                    ' without specifying a value for the associated record is not allowed!');
                }
                
            } else if (newAction === 'delete' || newAction === 'del') {

                // Change the action to 'delete'
                logOperation.data.action = 'delete';

                // Delete the client record as the new action is 'delete'
                dataOperation = {
                    tableName: pushOperation.logRecord.tableName,
                    action: 'delete',
                    id: pushOperation.logRecord.id
                };

            } else {
                throw new Error('Action ' + newAction + ' not supported.');
            }
            
            // Execute the log and data operations
            return store.executeBatch([logOperation, dataOperation]).then(function() {
                self.isHandled = true;
            });
        });
    }
    
    /**
     * Cancels pushing the current operation to the server permanently.
     * This will also set {@link PushError#isHandled} to true.
     * 
     * This method simply removes the pending operation from the operation table, thereby 
     * permanently skipping the associated change from being pushed to the server. A future change 
     * done to the same record will not be affected and such changes will continue to be pushed.
     *  
     * @function
     * @instance
     * @memberof PushError
     *
     * @returns {Promise} A promise that is fulfilled when the operation is cancelled OR rejected
     *                    with the error if it fails to cancel it.
     */
    function cancel() {
        var self = this;
        return storeTaskRunner.run(function() {
            return store.del(operationTableName, pushOperation.logRecord.id).then(function() {
                self.isHandled = true;
            });
        });
    }
}

function makeCopy(value) {
    if (!_.isNull(value)) {
        value = JSON.parse( JSON.stringify(value) );
    }
    return value;
}

/**
 * Attempts error handling by delegating it to the user, if a push handler is provided
 * @private
 */
function handlePushError(pushError, pushHandler) {
    return Platform.async(function(callback) {
        callback();
    })().then(function() {
        
        if (pushError.isConflict()) {
            if (pushHandler && pushHandler.onConflict) {
                // NOTE: value of server record will not be available in case of 409.
                return pushHandler.onConflict(pushError);
            }
        } else if (pushHandler && pushHandler.onError) {
            return pushHandler.onError(pushError);
        }

    }).then(undefined, function(error) {
        // Set isHandled to false even if the user has set it to handled if the onConflict / onError failed 
        pushError.isHandled = false;
    });
}

exports.createPushError = createPushError;
exports.handlePushError = handlePushError;

},{"../Platform":76,"../Utilities/Extensions":83,"../constants":88}],99:[function(_dereq_,module,exports){
// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

var Query = _dereq_('azure-query-js').Query,
    Platform = _dereq_('./Platform');

// Copy select Query operators to the table so queries can be created
// compactly.  We'll just add them to the table prototype and then
// forward on directly to a new Query instance.
var queryOperators = ['where', 'select', 'orderBy', 'orderByDescending', 'skip', 'take', 'includeTotalCount'];

var copyOperator = function (table, operator) {
    table.prototype[operator] = function () {
        /// <summary>
        /// Creates a new query.
        /// </summary>

        // Create a query associated with this table
        var table = this;
        var query = new Query(table.getTableName());

        // Add a .read() method on the query which will execute the query.
        // This method is defined here per query instance because it's
        // implicitly tied to the table.
        query.read = function (parameters) {
            return table.read(query, parameters);
        };

        // Invoke the query operator on the newly created query
        return query[operator].apply(query, arguments);
    };
};

function defineQueryOperators(table) {
    var i = 0;
    for (; i < queryOperators.length; i++) {
        copyOperator(table, queryOperators[i]);
    }
}

exports.defineQueryOperators = defineQueryOperators;

},{"./Platform":76,"azure-query-js":19}]},{},[89])(89)
});

});
