/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./preview-src/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/lodash.throttle/index.js":
/*!***********************************************!*\
  !*** ./node_modules/lodash.throttle/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = throttle;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./preview-src/activeLineMarker.ts":
/*!*****************************************!*\
  !*** ./preview-src/activeLineMarker.ts ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const scroll_sync_1 = __webpack_require__(/*! ./scroll-sync */ "./preview-src/scroll-sync.ts");
class ActiveLineMarker {
    onDidChangeTextEditorSelection(line) {
        const { previous } = scroll_sync_1.getElementsForSourceLine(line);
        this._update(previous && previous.element);
    }
    _update(before) {
        this._unmarkActiveElement(this._current);
        this._markActiveElement(before);
        this._current = before;
    }
    _unmarkActiveElement(element) {
        if (!element) {
            return;
        }
        element.className = element.className.replace(/\bcode-active-line\b/g, '');
    }
    _markActiveElement(element) {
        if (!element) {
            return;
        }
        element.className += ' code-active-line';
    }
}
exports.ActiveLineMarker = ActiveLineMarker;


/***/ }),

/***/ "./preview-src/events.ts":
/*!*******************************!*\
  !*** ./preview-src/events.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
function onceDocumentLoaded(f) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', f);
    }
    else {
        f();
    }
}
exports.onceDocumentLoaded = onceDocumentLoaded;


/***/ }),

/***/ "./preview-src/index.ts":
/*!******************************!*\
  !*** ./preview-src/index.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const activeLineMarker_1 = __webpack_require__(/*! ./activeLineMarker */ "./preview-src/activeLineMarker.ts");
const events_1 = __webpack_require__(/*! ./events */ "./preview-src/events.ts");
const messaging_1 = __webpack_require__(/*! ./messaging */ "./preview-src/messaging.ts");
const scroll_sync_1 = __webpack_require__(/*! ./scroll-sync */ "./preview-src/scroll-sync.ts");
const settings_1 = __webpack_require__(/*! ./settings */ "./preview-src/settings.ts");
const throttle = __webpack_require__(/*! lodash.throttle */ "./node_modules/lodash.throttle/index.js");
var scrollDisabled = true;
const marker = new activeLineMarker_1.ActiveLineMarker();
const settings = settings_1.getSettings();
const vscode = acquireVsCodeApi();
// Set VS Code state
const state = settings_1.getData('data-state');
vscode.setState(state);
const messaging = messaging_1.createPosterForVsCode(vscode);
window.cspAlerter.setPoster(messaging);
events_1.onceDocumentLoaded(() => {
    if (settings.scrollPreviewWithEditor) {
        setTimeout(() => {
            const initialLine = +settings.line;
            if (!isNaN(initialLine)) {
                scrollDisabled = true;
                scroll_sync_1.scrollToRevealSourceLine(initialLine);
            }
        }, 0);
    }
});
const onUpdateView = (() => {
    const doScroll = throttle((line) => {
        scrollDisabled = true;
        scroll_sync_1.scrollToRevealSourceLine(line);
    }, 50);
    return (line, settings) => {
        if (!isNaN(line)) {
            settings.line = line;
            doScroll(line);
        }
    };
})();
window.addEventListener('resize', () => {
    scrollDisabled = true;
}, true);
window.addEventListener('message', event => {
    if (event.data.source !== settings.source) {
        return;
    }
    switch (event.data.type) {
        case 'onDidChangeTextEditorSelection':
            marker.onDidChangeTextEditorSelection(event.data.line);
            break;
        case 'updateView':
            onUpdateView(event.data.line, settings);
            break;
    }
}, false);
document.addEventListener('dblclick', event => {
    if (!settings.doubleClickToSwitchToEditor) {
        return;
    }
    // Ignore clicks on links
    for (let node = event.target; node; node = node.parentNode) {
        if (node.tagName === 'A') {
            return;
        }
    }
    const offset = event.pageY;
    const line = scroll_sync_1.getEditorLineNumberForPageOffset(offset);
    if (typeof line === 'number' && !isNaN(line)) {
        messaging.postMessage('didClick', { line: Math.floor(line) });
    }
});
document.addEventListener('click', event => {
    if (!event) {
        return;
    }
    let node = event.target;
    while (node) {
        if (node.tagName && node.tagName === 'A' && node.href) {
            if (node.getAttribute('href').startsWith('#')) {
                break;
            }
            if (node.href.startsWith('file://') || node.href.startsWith('vscode-resource:')) {
                const [path, fragment] = node.href.replace(/^(file:\/\/|vscode-resource:)/i, '').split('#');
                messaging.postCommand('_rst.openDocumentLink', [{ path, fragment }]);
                event.preventDefault();
                event.stopPropagation();
                break;
            }
            break;
        }
        node = node.parentNode;
    }
}, true);
if (settings.scrollEditorWithPreview) {
    window.addEventListener('scroll', throttle(() => {
        if (scrollDisabled) {
            scrollDisabled = false;
        }
        else {
            const line = scroll_sync_1.getEditorLineNumberForPageOffset(window.scrollY);
            if (typeof line === 'number' && !isNaN(line)) {
                messaging.postMessage('revealLine', { line });
            }
        }
    }, 50));
}


/***/ }),

/***/ "./preview-src/messaging.ts":
/*!**********************************!*\
  !*** ./preview-src/messaging.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __webpack_require__(/*! ./settings */ "./preview-src/settings.ts");
exports.createPosterForVsCode = (vscode) => {
    return new class {
        postMessage(type, body) {
            vscode.postMessage({
                type,
                source: settings_1.getSettings().source,
                body
            });
        }
        postCommand(command, args) {
            this.postMessage('command', { command, args });
        }
    };
};


/***/ }),

/***/ "./preview-src/scroll-sync.ts":
/*!************************************!*\
  !*** ./preview-src/scroll-sync.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __webpack_require__(/*! ./settings */ "./preview-src/settings.ts");
function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}
function clampLine(line) {
    return clamp(0, settings_1.getSettings().lineCount - 1, line);
}
const getCodeLineElements = (() => {
    let elements;
    return () => {
        if (elements)
            return elements;
        elements = [];
        for (const element of document.getElementsByClassName('code-line')) {
            const attr = element.getAttribute('data-line');
            if (typeof attr === "string") {
                const line = parseInt(attr);
                if (!isNaN(line))
                    elements.push({ element, line });
            }
        }
        return elements;
    };
})();
/**
 * Find the html elements that map to a specific target line in the editor.
 *
 * If an exact match, returns a single element. If the line is between elements,
 * returns the element prior to and the element after the given line.
 */
function getElementsForSourceLine(targetLine) {
    const lineNumber = Math.floor(targetLine);
    const lines = getCodeLineElements();
    let previous = lines[0] || null;
    for (const entry of lines) {
        if (entry.line === lineNumber) {
            return { previous: entry, next: undefined };
        }
        else if (entry.line > lineNumber) {
            return { previous, next: entry };
        }
        previous = entry;
    }
    return { previous };
}
exports.getElementsForSourceLine = getElementsForSourceLine;
/**
 * Find the html elements that are at a specific pixel offset on the page.
 */
function getLineElementsAtPageOffset(offset) {
    const lines = getCodeLineElements();
    const position = offset - window.scrollY;
    let lo = -1;
    let hi = lines.length - 1;
    while (lo + 1 < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const bounds = lines[mid].element.getBoundingClientRect();
        if (bounds.top + bounds.height >= position) {
            hi = mid;
        }
        else {
            lo = mid;
        }
    }
    const hiElement = lines[hi];
    const hiBounds = hiElement.element.getBoundingClientRect();
    if (hi >= 1 && hiBounds.top > position) {
        const loElement = lines[lo];
        return { previous: loElement, next: hiElement };
    }
    return { previous: hiElement };
}
exports.getLineElementsAtPageOffset = getLineElementsAtPageOffset;
/**
 * Attempt to reveal the element for a source line in the editor.
 */
function scrollToRevealSourceLine(line) {
    const { previous, next } = getElementsForSourceLine(line);
    if (previous && settings_1.getSettings().scrollPreviewWithEditor) {
        let scrollTo = 0;
        const rect = previous.element.getBoundingClientRect();
        const previousTop = rect.top;
        if (next && next.line !== previous.line) {
            // Between two elements. Go to percentage offset between them.
            const betweenProgress = (line - previous.line) / (next.line - previous.line);
            const elementOffset = next.element.getBoundingClientRect().top - previousTop;
            scrollTo = previousTop + betweenProgress * elementOffset;
        }
        else {
            scrollTo = previousTop;
        }
        window.scroll(0, Math.max(1, window.scrollY + scrollTo));
    }
}
exports.scrollToRevealSourceLine = scrollToRevealSourceLine;
function getEditorLineNumberForPageOffset(offset) {
    const { previous, next } = getLineElementsAtPageOffset(offset);
    if (previous) {
        const previousBounds = previous.element.getBoundingClientRect();
        const offsetFromPrevious = (offset - window.scrollY - previousBounds.top);
        if (next) {
            const progressBetweenElements = offsetFromPrevious / (next.element.getBoundingClientRect().top - previousBounds.top);
            const line = previous.line + progressBetweenElements * (next.line - previous.line);
            return clampLine(line);
        }
        else {
            const progressWithinElement = offsetFromPrevious / (previousBounds.height);
            const line = previous.line + progressWithinElement;
            return clampLine(line);
        }
    }
    return null;
}
exports.getEditorLineNumberForPageOffset = getEditorLineNumberForPageOffset;


/***/ }),

/***/ "./preview-src/settings.ts":
/*!*********************************!*\
  !*** ./preview-src/settings.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
let cachedSettings = undefined;
function getData(key) {
    const element = document.getElementById('vscode-rst-preview-data');
    if (element) {
        const data = element.getAttribute(key);
        if (data) {
            return JSON.parse(data);
        }
    }
    throw new Error(`Could not load data for ${key}`);
}
exports.getData = getData;
function getSettings() {
    if (cachedSettings) {
        return cachedSettings;
    }
    cachedSettings = getData('data-settings');
    if (cachedSettings) {
        return cachedSettings;
    }
    throw new Error('Could not load settings');
}
exports.getSettings = getSettings;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vKHdlYnBhY2spL2J1aWxkaW4vZ2xvYmFsLmpzIiwid2VicGFjazovLy8uL3ByZXZpZXctc3JjL2FjdGl2ZUxpbmVNYXJrZXIudHMiLCJ3ZWJwYWNrOi8vLy4vcHJldmlldy1zcmMvZXZlbnRzLnRzIiwid2VicGFjazovLy8uL3ByZXZpZXctc3JjL2luZGV4LnRzIiwid2VicGFjazovLy8uL3ByZXZpZXctc3JjL21lc3NhZ2luZy50cyIsIndlYnBhY2s6Ly8vLi9wcmV2aWV3LXNyYy9zY3JvbGwtc3luYy50cyIsIndlYnBhY2s6Ly8vLi9wcmV2aWV3LXNyYy9zZXR0aW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1FBQUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7OztRQUdBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwwQ0FBMEMsZ0NBQWdDO1FBQzFFO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0Esd0RBQXdELGtCQUFrQjtRQUMxRTtRQUNBLGlEQUFpRCxjQUFjO1FBQy9EOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSx5Q0FBeUMsaUNBQWlDO1FBQzFFLGdIQUFnSCxtQkFBbUIsRUFBRTtRQUNySTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDJCQUEyQiwwQkFBMEIsRUFBRTtRQUN2RCxpQ0FBaUMsZUFBZTtRQUNoRDtRQUNBO1FBQ0E7O1FBRUE7UUFDQSxzREFBc0QsK0RBQStEOztRQUVySDtRQUNBOzs7UUFHQTtRQUNBOzs7Ozs7Ozs7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LElBQUksY0FBYyxHQUFnQyxTQUFTLENBQUM7QUFFNUQsU0FBZ0IsT0FBTyxDQUFDLEdBQVc7SUFDbEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ25FLElBQUksT0FBTyxFQUFFO1FBQ1osTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxJQUFJLElBQUksRUFBRTtZQUNULE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN4QjtLQUNEO0lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBVkQsMEJBVUM7QUFFRCxTQUFnQixXQUFXO0lBQzFCLElBQUksY0FBYyxFQUFFO1FBQ25CLE9BQU8sY0FBYyxDQUFDO0tBQ3RCO0lBRUQsY0FBYyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMxQyxJQUFJLGNBQWMsRUFBRTtRQUNuQixPQUFPLGNBQWMsQ0FBQztLQUN0QjtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBWEQsa0NBV0MiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3ByZXZpZXctc3JjL2luZGV4LnRzXCIpO1xuIiwiLyoqXG4gKiBsb2Rhc2ggKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pxdWVyeS5vcmcvPlxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBOQU4gPSAwIC8gMDtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlLiAqL1xudmFyIHJlVHJpbSA9IC9eXFxzK3xcXHMrJC9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmFkIHNpZ25lZCBoZXhhZGVjaW1hbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCYWRIZXggPSAvXlstK10weFswLTlhLWZdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJpbmFyeSBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNCaW5hcnkgPSAvXjBiWzAxXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBvY3RhbCBzdHJpbmcgdmFsdWVzLiAqL1xudmFyIHJlSXNPY3RhbCA9IC9eMG9bMC03XSskL2k7XG5cbi8qKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB3aXRob3V0IGEgZGVwZW5kZW5jeSBvbiBgcm9vdGAuICovXG52YXIgZnJlZVBhcnNlSW50ID0gcGFyc2VJbnQ7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbC5PYmplY3QgPT09IE9iamVjdCAmJiBnbG9iYWw7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG52YXIgZnJlZVNlbGYgPSB0eXBlb2Ygc2VsZiA9PSAnb2JqZWN0JyAmJiBzZWxmICYmIHNlbGYuT2JqZWN0ID09PSBPYmplY3QgJiYgc2VsZjtcblxuLyoqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuICovXG52YXIgcm9vdCA9IGZyZWVHbG9iYWwgfHwgZnJlZVNlbGYgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcbiAgICBuYXRpdmVNaW4gPSBNYXRoLm1pbjtcblxuLyoqXG4gKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdGhhdCBoYXZlIGVsYXBzZWQgc2luY2VcbiAqIHRoZSBVbml4IGVwb2NoICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBEYXRlXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSB0aW1lc3RhbXAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uZGVmZXIoZnVuY3Rpb24oc3RhbXApIHtcbiAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcbiAqIH0sIF8ubm93KCkpO1xuICogLy8gPT4gTG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgaW52b2NhdGlvbi5cbiAqL1xudmFyIG5vdyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gcm9vdC5EYXRlLm5vdygpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcbiAqIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgc2luY2UgdGhlIGxhc3QgdGltZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdhc1xuICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxuICogZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG8gaW1tZWRpYXRlbHkgaW52b2tlIHRoZW0uXG4gKiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGVcbiAqIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBUaGUgYGZ1bmNgIGlzIGludm9rZWRcbiAqIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uIFN1YnNlcXVlbnRcbiAqIGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgXG4gKiBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF1cbiAqICBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4LlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHNlbmRNYWlsYCB3aGVuIGNsaWNrZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxscy5cbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICpcbiAqIC8vIEVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHMuXG4gKiB2YXIgZGVib3VuY2VkID0gXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7ICdtYXhXYWl0JzogMTAwMCB9KTtcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIGpRdWVyeShzb3VyY2UpLm9uKCdtZXNzYWdlJywgZGVib3VuY2VkKTtcbiAqXG4gKiAvLyBDYW5jZWwgdGhlIHRyYWlsaW5nIGRlYm91bmNlZCBpbnZvY2F0aW9uLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3BvcHN0YXRlJywgZGVib3VuY2VkLmNhbmNlbCk7XG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxhc3RBcmdzLFxuICAgICAgbGFzdFRoaXMsXG4gICAgICBtYXhXYWl0LFxuICAgICAgcmVzdWx0LFxuICAgICAgdGltZXJJZCxcbiAgICAgIGxhc3RDYWxsVGltZSxcbiAgICAgIGxhc3RJbnZva2VUaW1lID0gMCxcbiAgICAgIGxlYWRpbmcgPSBmYWxzZSxcbiAgICAgIG1heGluZyA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHdhaXQgPSB0b051bWJlcih3YWl0KSB8fCAwO1xuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XG4gICAgbWF4aW5nID0gJ21heFdhaXQnIGluIG9wdGlvbnM7XG4gICAgbWF4V2FpdCA9IG1heGluZyA/IG5hdGl2ZU1heCh0b051bWJlcihvcHRpb25zLm1heFdhaXQpIHx8IDAsIHdhaXQpIDogbWF4V2FpdDtcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/ICEhb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaW52b2tlRnVuYyh0aW1lKSB7XG4gICAgdmFyIGFyZ3MgPSBsYXN0QXJncyxcbiAgICAgICAgdGhpc0FyZyA9IGxhc3RUaGlzO1xuXG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gbGVhZGluZ0VkZ2UodGltZSkge1xuICAgIC8vIFJlc2V0IGFueSBgbWF4V2FpdGAgdGltZXIuXG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIC8vIFN0YXJ0IHRoZSB0aW1lciBmb3IgdGhlIHRyYWlsaW5nIGVkZ2UuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAvLyBJbnZva2UgdGhlIGxlYWRpbmcgZWRnZS5cbiAgICByZXR1cm4gbGVhZGluZyA/IGludm9rZUZ1bmModGltZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW1haW5pbmdXYWl0KHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lLFxuICAgICAgICByZXN1bHQgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nID8gbmF0aXZlTWluKHJlc3VsdCwgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRocm90dGxlZCBmdW5jdGlvbiB0aGF0IG9ubHkgaW52b2tlcyBgZnVuY2AgYXQgbW9zdCBvbmNlIHBlclxuICogZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gVGhlIHRocm90dGxlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGBcbiAqIG1ldGhvZCB0byBjYW5jZWwgZGVsYXllZCBgZnVuY2AgaW52b2NhdGlvbnMgYW5kIGEgYGZsdXNoYCBtZXRob2QgdG9cbiAqIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLiBQcm92aWRlIGBvcHRpb25zYCB0byBpbmRpY2F0ZSB3aGV0aGVyIGBmdW5jYFxuICogc2hvdWxkIGJlIGludm9rZWQgb24gdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YFxuICogdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkIHdpdGggdGhlIGxhc3QgYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZVxuICogdGhyb3R0bGVkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gcmV0dXJuIHRoZVxuICogcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBpbnZvY2F0aW9uLlxuICpcbiAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXNcbiAqIGludm9rZWQgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uXG4gKiBpcyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogSWYgYHdhaXRgIGlzIGAwYCBhbmQgYGxlYWRpbmdgIGlzIGBmYWxzZWAsIGBmdW5jYCBpbnZvY2F0aW9uIGlzIGRlZmVycmVkXG4gKiB1bnRpbCB0byB0aGUgbmV4dCB0aWNrLCBzaW1pbGFyIHRvIGBzZXRUaW1lb3V0YCB3aXRoIGEgdGltZW91dCBvZiBgMGAuXG4gKlxuICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZGVib3VuY2luZy10aHJvdHRsaW5nLWV4cGxhaW5lZC1leGFtcGxlcy8pXG4gKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLnRocm90dGxlYCBhbmQgYF8uZGVib3VuY2VgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgaW52b2NhdGlvbnMgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBBdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nLlxuICogalF1ZXJ5KHdpbmRvdykub24oJ3Njcm9sbCcsIF8udGhyb3R0bGUodXBkYXRlUG9zaXRpb24sIDEwMCkpO1xuICpcbiAqIC8vIEludm9rZSBgcmVuZXdUb2tlbmAgd2hlbiB0aGUgY2xpY2sgZXZlbnQgaXMgZmlyZWQsIGJ1dCBub3QgbW9yZSB0aGFuIG9uY2UgZXZlcnkgNSBtaW51dGVzLlxuICogdmFyIHRocm90dGxlZCA9IF8udGhyb3R0bGUocmVuZXdUb2tlbiwgMzAwMDAwLCB7ICd0cmFpbGluZyc6IGZhbHNlIH0pO1xuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIHRocm90dGxlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyB0aHJvdHRsZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIHRocm90dGxlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsZWFkaW5nID0gdHJ1ZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gJ2xlYWRpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuICByZXR1cm4gZGVib3VuY2UoZnVuYywgd2FpdCwge1xuICAgICdsZWFkaW5nJzogbGVhZGluZyxcbiAgICAnbWF4V2FpdCc6IHdhaXQsXG4gICAgJ3RyYWlsaW5nJzogdHJhaWxpbmdcbiAgfSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHN5bWJvbCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwidmFyIGc7XG5cbi8vIFRoaXMgd29ya3MgaW4gbm9uLXN0cmljdCBtb2RlXG5nID0gKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcztcbn0pKCk7XG5cbnRyeSB7XG5cdC8vIFRoaXMgd29ya3MgaWYgZXZhbCBpcyBhbGxvd2VkIChzZWUgQ1NQKVxuXHRnID0gZyB8fCBuZXcgRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xufSBjYXRjaCAoZSkge1xuXHQvLyBUaGlzIHdvcmtzIGlmIHRoZSB3aW5kb3cgcmVmZXJlbmNlIGlzIGF2YWlsYWJsZVxuXHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gXCJvYmplY3RcIikgZyA9IHdpbmRvdztcbn1cblxuLy8gZyBjYW4gc3RpbGwgYmUgdW5kZWZpbmVkLCBidXQgbm90aGluZyB0byBkbyBhYm91dCBpdC4uLlxuLy8gV2UgcmV0dXJuIHVuZGVmaW5lZCwgaW5zdGVhZCBvZiBub3RoaW5nIGhlcmUsIHNvIGl0J3Ncbi8vIGVhc2llciB0byBoYW5kbGUgdGhpcyBjYXNlLiBpZighZ2xvYmFsKSB7IC4uLn1cblxubW9kdWxlLmV4cG9ydHMgPSBnO1xuIiwiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcbmltcG9ydCB7IGdldEVsZW1lbnRzRm9yU291cmNlTGluZSB9IGZyb20gJy4vc2Nyb2xsLXN5bmMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFjdGl2ZUxpbmVNYXJrZXIge1xyXG5cdHByaXZhdGUgX2N1cnJlbnQ6IGFueTtcclxuXHJcblx0b25EaWRDaGFuZ2VUZXh0RWRpdG9yU2VsZWN0aW9uKGxpbmU6IG51bWJlcikge1xyXG5cdFx0Y29uc3QgeyBwcmV2aW91cyB9ID0gZ2V0RWxlbWVudHNGb3JTb3VyY2VMaW5lKGxpbmUpO1xyXG5cdFx0dGhpcy5fdXBkYXRlKHByZXZpb3VzICYmIHByZXZpb3VzLmVsZW1lbnQpO1xyXG5cdH1cclxuXHJcblx0X3VwZGF0ZShiZWZvcmU6IEVsZW1lbnQgfCB1bmRlZmluZWQpIHtcclxuXHRcdHRoaXMuX3VubWFya0FjdGl2ZUVsZW1lbnQodGhpcy5fY3VycmVudCk7XHJcblx0XHR0aGlzLl9tYXJrQWN0aXZlRWxlbWVudChiZWZvcmUpO1xyXG5cdFx0dGhpcy5fY3VycmVudCA9IGJlZm9yZTtcclxuXHR9XHJcblxyXG5cdF91bm1hcmtBY3RpdmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQpIHtcclxuXHRcdGlmICghZWxlbWVudCkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRlbGVtZW50LmNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UoL1xcYmNvZGUtYWN0aXZlLWxpbmVcXGIvZywgJycpO1xyXG5cdH1cclxuXHJcblx0X21hcmtBY3RpdmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQgfCB1bmRlZmluZWQpIHtcclxuXHRcdGlmICghZWxlbWVudCkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRlbGVtZW50LmNsYXNzTmFtZSArPSAnIGNvZGUtYWN0aXZlLWxpbmUnO1xyXG5cdH1cclxufSIsIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uY2VEb2N1bWVudExvYWRlZChmOiAoKSA9PiB2b2lkKSB7XHJcblx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xyXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGYpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRmKCk7XHJcblx0fVxyXG59IiwiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5pbXBvcnQgeyBBY3RpdmVMaW5lTWFya2VyIH0gZnJvbSAnLi9hY3RpdmVMaW5lTWFya2VyJztcclxuaW1wb3J0IHsgb25jZURvY3VtZW50TG9hZGVkIH0gZnJvbSAnLi9ldmVudHMnO1xyXG5pbXBvcnQgeyBjcmVhdGVQb3N0ZXJGb3JWc0NvZGUgfSBmcm9tICcuL21lc3NhZ2luZyc7XHJcbmltcG9ydCB7IGdldEVkaXRvckxpbmVOdW1iZXJGb3JQYWdlT2Zmc2V0LCBzY3JvbGxUb1JldmVhbFNvdXJjZUxpbmUgfSBmcm9tICcuL3Njcm9sbC1zeW5jJztcclxuaW1wb3J0IHsgZ2V0U2V0dGluZ3MsIGdldERhdGEgfSBmcm9tICcuL3NldHRpbmdzJztcclxuaW1wb3J0IHRocm90dGxlID0gcmVxdWlyZSgnbG9kYXNoLnRocm90dGxlJyk7XHJcblxyXG5kZWNsYXJlIHZhciBhY3F1aXJlVnNDb2RlQXBpOiBhbnk7XHJcblxyXG52YXIgc2Nyb2xsRGlzYWJsZWQgPSB0cnVlO1xyXG5jb25zdCBtYXJrZXIgPSBuZXcgQWN0aXZlTGluZU1hcmtlcigpO1xyXG5jb25zdCBzZXR0aW5ncyA9IGdldFNldHRpbmdzKCk7XHJcblxyXG5jb25zdCB2c2NvZGUgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XHJcblxyXG4vLyBTZXQgVlMgQ29kZSBzdGF0ZVxyXG5jb25zdCBzdGF0ZSA9IGdldERhdGEoJ2RhdGEtc3RhdGUnKTtcclxudnNjb2RlLnNldFN0YXRlKHN0YXRlKTtcclxuXHJcbmNvbnN0IG1lc3NhZ2luZyA9IGNyZWF0ZVBvc3RlckZvclZzQ29kZSh2c2NvZGUpO1xyXG5cclxud2luZG93LmNzcEFsZXJ0ZXIuc2V0UG9zdGVyKG1lc3NhZ2luZyk7XHJcblxyXG5vbmNlRG9jdW1lbnRMb2FkZWQoKCkgPT4ge1xyXG5cdGlmIChzZXR0aW5ncy5zY3JvbGxQcmV2aWV3V2l0aEVkaXRvcikge1xyXG5cdFx0c2V0VGltZW91dCgoKSA9PiB7XHJcblx0XHRcdGNvbnN0IGluaXRpYWxMaW5lID0gK3NldHRpbmdzLmxpbmU7XHJcblx0XHRcdGlmICghaXNOYU4oaW5pdGlhbExpbmUpKSB7XHJcblx0XHRcdFx0c2Nyb2xsRGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0XHRcdHNjcm9sbFRvUmV2ZWFsU291cmNlTGluZShpbml0aWFsTGluZSk7XHJcblx0XHRcdH1cclxuXHRcdH0sIDApO1xyXG5cdH1cclxufSk7XHJcblxyXG5jb25zdCBvblVwZGF0ZVZpZXcgPSAoKCkgPT4ge1xyXG5cdGNvbnN0IGRvU2Nyb2xsID0gdGhyb3R0bGUoKGxpbmU6IG51bWJlcikgPT4ge1xyXG5cdFx0c2Nyb2xsRGlzYWJsZWQgPSB0cnVlO1xyXG5cdFx0c2Nyb2xsVG9SZXZlYWxTb3VyY2VMaW5lKGxpbmUpO1xyXG5cdH0sIDUwKTtcclxuXHJcblx0cmV0dXJuIChsaW5lOiBudW1iZXIsIHNldHRpbmdzOiBhbnkpID0+IHtcclxuXHRcdGlmICghaXNOYU4obGluZSkpIHtcclxuXHRcdFx0c2V0dGluZ3MubGluZSA9IGxpbmU7XHJcblx0XHRcdGRvU2Nyb2xsKGxpbmUpO1xyXG5cdFx0fVxyXG5cdH07XHJcbn0pKCk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xyXG5cdHNjcm9sbERpc2FibGVkID0gdHJ1ZTtcclxufSwgdHJ1ZSk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGV2ZW50ID0+IHtcclxuXHRpZiAoZXZlbnQuZGF0YS5zb3VyY2UgIT09IHNldHRpbmdzLnNvdXJjZSkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0c3dpdGNoIChldmVudC5kYXRhLnR5cGUpIHtcclxuXHRcdGNhc2UgJ29uRGlkQ2hhbmdlVGV4dEVkaXRvclNlbGVjdGlvbic6XHJcblx0XHRcdG1hcmtlci5vbkRpZENoYW5nZVRleHRFZGl0b3JTZWxlY3Rpb24oZXZlbnQuZGF0YS5saW5lKTtcclxuXHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0Y2FzZSAndXBkYXRlVmlldyc6XHJcblx0XHRcdG9uVXBkYXRlVmlldyhldmVudC5kYXRhLmxpbmUsIHNldHRpbmdzKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0fVxyXG59LCBmYWxzZSk7XHJcblxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIGV2ZW50ID0+IHtcclxuXHRpZiAoIXNldHRpbmdzLmRvdWJsZUNsaWNrVG9Td2l0Y2hUb0VkaXRvcikge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gSWdub3JlIGNsaWNrcyBvbiBsaW5rc1xyXG5cdGZvciAobGV0IG5vZGUgPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7IG5vZGU7IG5vZGUgPSBub2RlLnBhcmVudE5vZGUgYXMgSFRNTEVsZW1lbnQpIHtcclxuXHRcdGlmIChub2RlLnRhZ05hbWUgPT09ICdBJykge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjb25zdCBvZmZzZXQgPSBldmVudC5wYWdlWTtcclxuXHRjb25zdCBsaW5lID0gZ2V0RWRpdG9yTGluZU51bWJlckZvclBhZ2VPZmZzZXQob2Zmc2V0KTtcclxuXHRpZiAodHlwZW9mIGxpbmUgPT09ICdudW1iZXInICYmICFpc05hTihsaW5lKSkge1xyXG5cdFx0bWVzc2FnaW5nLnBvc3RNZXNzYWdlKCdkaWRDbGljaycsIHsgbGluZTogTWF0aC5mbG9vcihsaW5lKSB9KTtcclxuXHR9XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XHJcblx0aWYgKCFldmVudCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0bGV0IG5vZGU6IGFueSA9IGV2ZW50LnRhcmdldDtcclxuXHR3aGlsZSAobm9kZSkge1xyXG5cdFx0aWYgKG5vZGUudGFnTmFtZSAmJiBub2RlLnRhZ05hbWUgPT09ICdBJyAmJiBub2RlLmhyZWYpIHtcclxuXHRcdFx0aWYgKG5vZGUuZ2V0QXR0cmlidXRlKCdocmVmJykuc3RhcnRzV2l0aCgnIycpKSB7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG5vZGUuaHJlZi5zdGFydHNXaXRoKCdmaWxlOi8vJykgfHwgbm9kZS5ocmVmLnN0YXJ0c1dpdGgoJ3ZzY29kZS1yZXNvdXJjZTonKSkge1xyXG5cdFx0XHRcdGNvbnN0IFtwYXRoLCBmcmFnbWVudF0gPSBub2RlLmhyZWYucmVwbGFjZSgvXihmaWxlOlxcL1xcL3x2c2NvZGUtcmVzb3VyY2U6KS9pLCAnJykuc3BsaXQoJyMnKTtcclxuXHRcdFx0XHRtZXNzYWdpbmcucG9zdENvbW1hbmQoJ19yc3Qub3BlbkRvY3VtZW50TGluaycsIFt7IHBhdGgsIGZyYWdtZW50IH1dKTtcclxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0fVxyXG5cdFx0bm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHR9XHJcbn0sIHRydWUpO1xyXG5cclxuaWYgKHNldHRpbmdzLnNjcm9sbEVkaXRvcldpdGhQcmV2aWV3KSB7XHJcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRocm90dGxlKCgpID0+IHtcclxuXHRcdGlmIChzY3JvbGxEaXNhYmxlZCkge1xyXG5cdFx0XHRzY3JvbGxEaXNhYmxlZCA9IGZhbHNlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc3QgbGluZSA9IGdldEVkaXRvckxpbmVOdW1iZXJGb3JQYWdlT2Zmc2V0KHdpbmRvdy5zY3JvbGxZKTtcclxuXHRcdFx0aWYgKHR5cGVvZiBsaW5lID09PSAnbnVtYmVyJyAmJiAhaXNOYU4obGluZSkpIHtcclxuXHRcdFx0XHRtZXNzYWdpbmcucG9zdE1lc3NhZ2UoJ3JldmVhbExpbmUnLCB7IGxpbmUgfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9LCA1MCkpO1xyXG59IiwiLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogIENvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLiBTZWUgTGljZW5zZS50eHQgaW4gdGhlIHByb2plY3Qgcm9vdCBmb3IgbGljZW5zZSBpbmZvcm1hdGlvbi5cclxuICotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5pbXBvcnQgeyBnZXRTZXR0aW5ncyB9IGZyb20gJy4vc2V0dGluZ3MnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlUG9zdGVyIHtcclxuXHQvKipcclxuXHQgKiBQb3N0IGEgbWVzc2FnZSB0byB0aGUgcnN0IGV4dGVuc2lvblxyXG5cdCAqL1xyXG5cdHBvc3RNZXNzYWdlKHR5cGU6IHN0cmluZywgYm9keTogb2JqZWN0KTogdm9pZDtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIFBvc3QgYSBjb21tYW5kIHRvIGJlIGV4ZWN1dGVkIHRvIHRoZSByc3QgZXh0ZW5zaW9uXHJcblx0ICovXHJcblx0cG9zdENvbW1hbmQoY29tbWFuZDogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBjcmVhdGVQb3N0ZXJGb3JWc0NvZGUgPSAodnNjb2RlOiBhbnkpID0+IHtcclxuXHRyZXR1cm4gbmV3IGNsYXNzIGltcGxlbWVudHMgTWVzc2FnZVBvc3RlciB7XHJcblx0XHRwb3N0TWVzc2FnZSh0eXBlOiBzdHJpbmcsIGJvZHk6IG9iamVjdCk6IHZvaWQge1xyXG5cdFx0XHR2c2NvZGUucG9zdE1lc3NhZ2Uoe1xyXG5cdFx0XHRcdHR5cGUsXHJcblx0XHRcdFx0c291cmNlOiBnZXRTZXR0aW5ncygpLnNvdXJjZSxcclxuXHRcdFx0XHRib2R5XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0cG9zdENvbW1hbmQoY29tbWFuZDogc3RyaW5nLCBhcmdzOiBhbnlbXSkge1xyXG5cdFx0XHR0aGlzLnBvc3RNZXNzYWdlKCdjb21tYW5kJywgeyBjb21tYW5kLCBhcmdzIH0pO1xyXG5cdFx0fVxyXG5cdH07XHJcbn07XHJcblxyXG4iLCIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbmltcG9ydCB7IGdldFNldHRpbmdzIH0gZnJvbSAnLi9zZXR0aW5ncyc7XHJcblxyXG5cclxuZnVuY3Rpb24gY2xhbXAobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcblx0cmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGFtcExpbmUobGluZTogbnVtYmVyKSB7XHJcblx0cmV0dXJuIGNsYW1wKDAsIGdldFNldHRpbmdzKCkubGluZUNvdW50IC0gMSwgbGluZSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIENvZGVMaW5lRWxlbWVudCB7XHJcblx0ZWxlbWVudDogRWxlbWVudDtcclxuXHRsaW5lOiBudW1iZXI7XHJcbn1cclxuXHJcbmNvbnN0IGdldENvZGVMaW5lRWxlbWVudHMgPSAoKCkgPT4ge1xyXG5cdGxldCBlbGVtZW50czogQ29kZUxpbmVFbGVtZW50W107XHJcblx0cmV0dXJuICgpID0+IHtcclxuXHRcdGlmIChlbGVtZW50cykgcmV0dXJuIGVsZW1lbnRzXHJcblx0XHRlbGVtZW50cyA9IFtdXHJcblx0XHRmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY29kZS1saW5lJykpIHtcclxuXHRcdFx0Y29uc3QgYXR0ciA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWxpbmUnKTtcclxuXHRcdFx0aWYgKHR5cGVvZiBhdHRyID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0Y29uc3QgbGluZSA9IHBhcnNlSW50KGF0dHIpXHJcblx0XHRcdFx0aWYgKCFpc05hTihsaW5lKSlcclxuXHRcdFx0XHQgIGVsZW1lbnRzLnB1c2goeyBlbGVtZW50LCBsaW5lIH0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBlbGVtZW50c1xyXG5cdH07XHJcbn0pKCk7XHJcblxyXG4vKipcclxuICogRmluZCB0aGUgaHRtbCBlbGVtZW50cyB0aGF0IG1hcCB0byBhIHNwZWNpZmljIHRhcmdldCBsaW5lIGluIHRoZSBlZGl0b3IuXHJcbiAqXHJcbiAqIElmIGFuIGV4YWN0IG1hdGNoLCByZXR1cm5zIGEgc2luZ2xlIGVsZW1lbnQuIElmIHRoZSBsaW5lIGlzIGJldHdlZW4gZWxlbWVudHMsXHJcbiAqIHJldHVybnMgdGhlIGVsZW1lbnQgcHJpb3IgdG8gYW5kIHRoZSBlbGVtZW50IGFmdGVyIHRoZSBnaXZlbiBsaW5lLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnRzRm9yU291cmNlTGluZSh0YXJnZXRMaW5lOiBudW1iZXIpOiB7IHByZXZpb3VzOiBDb2RlTGluZUVsZW1lbnQ7IG5leHQ/OiBDb2RlTGluZUVsZW1lbnQ7IH0ge1xyXG5cdGNvbnN0IGxpbmVOdW1iZXIgPSBNYXRoLmZsb29yKHRhcmdldExpbmUpO1xyXG5cdGNvbnN0IGxpbmVzID0gZ2V0Q29kZUxpbmVFbGVtZW50cygpO1xyXG5cdGxldCBwcmV2aW91cyA9IGxpbmVzWzBdIHx8IG51bGw7XHJcblx0Zm9yIChjb25zdCBlbnRyeSBvZiBsaW5lcykge1xyXG5cdFx0aWYgKGVudHJ5LmxpbmUgPT09IGxpbmVOdW1iZXIpIHtcclxuXHRcdFx0cmV0dXJuIHsgcHJldmlvdXM6IGVudHJ5LCBuZXh0OiB1bmRlZmluZWQgfTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKGVudHJ5LmxpbmUgPiBsaW5lTnVtYmVyKSB7XHJcblx0XHRcdHJldHVybiB7IHByZXZpb3VzLCBuZXh0OiBlbnRyeSB9O1xyXG5cdFx0fVxyXG5cdFx0cHJldmlvdXMgPSBlbnRyeTtcclxuXHR9XHJcblx0cmV0dXJuIHsgcHJldmlvdXMgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZpbmQgdGhlIGh0bWwgZWxlbWVudHMgdGhhdCBhcmUgYXQgYSBzcGVjaWZpYyBwaXhlbCBvZmZzZXQgb24gdGhlIHBhZ2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZUVsZW1lbnRzQXRQYWdlT2Zmc2V0KG9mZnNldDogbnVtYmVyKTogeyBwcmV2aW91czogQ29kZUxpbmVFbGVtZW50OyBuZXh0PzogQ29kZUxpbmVFbGVtZW50OyB9IHtcclxuXHRjb25zdCBsaW5lcyA9IGdldENvZGVMaW5lRWxlbWVudHMoKTtcclxuXHRjb25zdCBwb3NpdGlvbiA9IG9mZnNldCAtIHdpbmRvdy5zY3JvbGxZO1xyXG5cdGxldCBsbyA9IC0xO1xyXG5cdGxldCBoaSA9IGxpbmVzLmxlbmd0aCAtIDE7XHJcblx0d2hpbGUgKGxvICsgMSA8IGhpKSB7XHJcblx0XHRjb25zdCBtaWQgPSBNYXRoLmZsb29yKChsbyArIGhpKSAvIDIpO1xyXG5cdFx0Y29uc3QgYm91bmRzID0gbGluZXNbbWlkXS5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0aWYgKGJvdW5kcy50b3AgKyBib3VuZHMuaGVpZ2h0ID49IHBvc2l0aW9uKSB7XHJcblx0XHRcdGhpID0gbWlkO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGxvID0gbWlkO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRjb25zdCBoaUVsZW1lbnQgPSBsaW5lc1toaV07XHJcblx0Y29uc3QgaGlCb3VuZHMgPSBoaUVsZW1lbnQuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRpZiAoaGkgPj0gMSAmJiBoaUJvdW5kcy50b3AgPiBwb3NpdGlvbikge1xyXG5cdFx0Y29uc3QgbG9FbGVtZW50ID0gbGluZXNbbG9dO1xyXG5cdFx0cmV0dXJuIHsgcHJldmlvdXM6IGxvRWxlbWVudCwgbmV4dDogaGlFbGVtZW50IH07XHJcblx0fVxyXG5cdHJldHVybiB7IHByZXZpb3VzOiBoaUVsZW1lbnQgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEF0dGVtcHQgdG8gcmV2ZWFsIHRoZSBlbGVtZW50IGZvciBhIHNvdXJjZSBsaW5lIGluIHRoZSBlZGl0b3IuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2Nyb2xsVG9SZXZlYWxTb3VyY2VMaW5lKGxpbmU6IG51bWJlcikge1xyXG5cdGNvbnN0IHsgcHJldmlvdXMsIG5leHQgfSA9IGdldEVsZW1lbnRzRm9yU291cmNlTGluZShsaW5lKTtcclxuXHRpZiAocHJldmlvdXMgJiYgZ2V0U2V0dGluZ3MoKS5zY3JvbGxQcmV2aWV3V2l0aEVkaXRvcikge1xyXG5cdFx0bGV0IHNjcm9sbFRvID0gMDtcclxuXHRcdGNvbnN0IHJlY3QgPSBwcmV2aW91cy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cdFx0Y29uc3QgcHJldmlvdXNUb3AgPSByZWN0LnRvcDtcclxuXHRcdGlmIChuZXh0ICYmIG5leHQubGluZSAhPT0gcHJldmlvdXMubGluZSkge1xyXG5cdFx0XHQvLyBCZXR3ZWVuIHR3byBlbGVtZW50cy4gR28gdG8gcGVyY2VudGFnZSBvZmZzZXQgYmV0d2VlbiB0aGVtLlxyXG5cdFx0XHRjb25zdCBiZXR3ZWVuUHJvZ3Jlc3MgPSAobGluZSAtIHByZXZpb3VzLmxpbmUpIC8gKG5leHQubGluZSAtIHByZXZpb3VzLmxpbmUpO1xyXG5cdFx0XHRjb25zdCBlbGVtZW50T2Zmc2V0ID0gbmV4dC5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIHByZXZpb3VzVG9wO1xyXG5cdFx0XHRzY3JvbGxUbyA9IHByZXZpb3VzVG9wICsgYmV0d2VlblByb2dyZXNzICogZWxlbWVudE9mZnNldDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRzY3JvbGxUbyA9IHByZXZpb3VzVG9wO1xyXG5cdFx0fVxyXG5cdFx0d2luZG93LnNjcm9sbCgwLCBNYXRoLm1heCgxLCB3aW5kb3cuc2Nyb2xsWSArIHNjcm9sbFRvKSk7XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWRpdG9yTGluZU51bWJlckZvclBhZ2VPZmZzZXQob2Zmc2V0OiBudW1iZXIpIHtcclxuXHRjb25zdCB7IHByZXZpb3VzLCBuZXh0IH0gPSBnZXRMaW5lRWxlbWVudHNBdFBhZ2VPZmZzZXQob2Zmc2V0KTtcclxuXHRpZiAocHJldmlvdXMpIHtcclxuXHRcdGNvbnN0IHByZXZpb3VzQm91bmRzID0gcHJldmlvdXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHRcdGNvbnN0IG9mZnNldEZyb21QcmV2aW91cyA9IChvZmZzZXQgLSB3aW5kb3cuc2Nyb2xsWSAtIHByZXZpb3VzQm91bmRzLnRvcCk7XHJcblx0XHRpZiAobmV4dCkge1xyXG5cdFx0XHRjb25zdCBwcm9ncmVzc0JldHdlZW5FbGVtZW50cyA9IG9mZnNldEZyb21QcmV2aW91cyAvIChuZXh0LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gcHJldmlvdXNCb3VuZHMudG9wKTtcclxuXHRcdFx0Y29uc3QgbGluZSA9IHByZXZpb3VzLmxpbmUgKyBwcm9ncmVzc0JldHdlZW5FbGVtZW50cyAqIChuZXh0LmxpbmUgLSBwcmV2aW91cy5saW5lKTtcclxuXHRcdFx0cmV0dXJuIGNsYW1wTGluZShsaW5lKTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjb25zdCBwcm9ncmVzc1dpdGhpbkVsZW1lbnQgPSBvZmZzZXRGcm9tUHJldmlvdXMgLyAocHJldmlvdXNCb3VuZHMuaGVpZ2h0KTtcclxuXHRcdFx0Y29uc3QgbGluZSA9IHByZXZpb3VzLmxpbmUgKyBwcm9ncmVzc1dpdGhpbkVsZW1lbnQ7XHJcblx0XHRcdHJldHVybiBjbGFtcExpbmUobGluZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBudWxsO1xyXG59XHJcbiIsIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U2V0dGluZ3Mge1xyXG5cdHNvdXJjZTogc3RyaW5nO1xyXG5cdGxpbmU6IG51bWJlcjtcclxuXHRsaW5lQ291bnQ6IG51bWJlcjtcclxuXHRzY3JvbGxQcmV2aWV3V2l0aEVkaXRvcj86IGJvb2xlYW47XHJcblx0c2Nyb2xsRWRpdG9yV2l0aFByZXZpZXc6IGJvb2xlYW47XHJcblx0ZGlzYWJsZVNlY3VyaXR5V2FybmluZ3M6IGJvb2xlYW47XHJcblx0ZG91YmxlQ2xpY2tUb1N3aXRjaFRvRWRpdG9yOiBib29sZWFuO1xyXG59XHJcblxyXG5sZXQgY2FjaGVkU2V0dGluZ3M6IFByZXZpZXdTZXR0aW5ncyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRhKGtleTogc3RyaW5nKTogUHJldmlld1NldHRpbmdzIHtcclxuXHRjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZzY29kZS1yc3QtcHJldmlldy1kYXRhJyk7XHJcblx0aWYgKGVsZW1lbnQpIHtcclxuXHRcdGNvbnN0IGRhdGEgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShrZXkpO1xyXG5cdFx0aWYgKGRhdGEpIHtcclxuXHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGRhdGEgZm9yICR7a2V5fWApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2V0dGluZ3MoKTogUHJldmlld1NldHRpbmdzIHtcclxuXHRpZiAoY2FjaGVkU2V0dGluZ3MpIHtcclxuXHRcdHJldHVybiBjYWNoZWRTZXR0aW5ncztcclxuXHR9XHJcblxyXG5cdGNhY2hlZFNldHRpbmdzID0gZ2V0RGF0YSgnZGF0YS1zZXR0aW5ncycpO1xyXG5cdGlmIChjYWNoZWRTZXR0aW5ncykge1xyXG5cdFx0cmV0dXJuIGNhY2hlZFNldHRpbmdzO1xyXG5cdH1cclxuXHJcblx0dGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgbG9hZCBzZXR0aW5ncycpO1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiIn0=