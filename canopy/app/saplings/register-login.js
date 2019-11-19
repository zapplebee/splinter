!(function(n, t) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = t())
    : 'function' == typeof define && define.amd
    ? define([], t)
    : 'object' == typeof exports
    ? (exports['register-login'] = t())
    : (n['register-login'] = t());
})(this, function() {
  return (function(n) {
    var t = {};
    function e(r) {
      if (t[r]) return t[r].exports;
      var o = (t[r] = { i: r, l: !1, exports: {} });
      return n[r].call(o.exports, o, o.exports, e), (o.l = !0), o.exports;
    }
    return (
      (e.m = n),
      (e.c = t),
      (e.d = function(n, t, r) {
        e.o(n, t) || Object.defineProperty(n, t, { enumerable: !0, get: r });
      }),
      (e.r = function(n) {
        'undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(n, '__esModule', { value: !0 });
      }),
      (e.t = function(n, t) {
        if ((1 & t && (n = e(n)), 8 & t)) return n;
        if (4 & t && 'object' == typeof n && n && n.__esModule) return n;
        var r = Object.create(null);
        if (
          (e.r(r),
          Object.defineProperty(r, 'default', { enumerable: !0, value: n }),
          2 & t && 'string' != typeof n)
        )
          for (var o in n)
            e.d(
              r,
              o,
              function(t) {
                return n[t];
              }.bind(null, o)
            );
        return r;
      }),
      (e.n = function(n) {
        var t =
          n && n.__esModule
            ? function() {
                return n.default;
              }
            : function() {
                return n;
              };
        return e.d(t, 'a', t), t;
      }),
      (e.o = function(n, t) {
        return Object.prototype.hasOwnProperty.call(n, t);
      }),
      (e.p = ''),
      e((e.s = 0))
    );
  })([
    function(n, t, e) {
      'use strict';
      t.__esModule = !0;
      var r = e(1),
        o = e(2).createBrowserHistory();
      r.registerConfigSapling('login', function() {
        var n = window.sessionStorage.getItem('canopy_user');
        if (r.getUser() || !n) {
          if (!r.getUser()) {
            var t = new URL(window.location);
            (t.pathname = '/login' === t.pathname ? '/' : t.pathname),
              console.log(t);
            var e = t.href;
            o.push('/login'),
              r.registerApp(function(n) {
                function t(t) {
                  return function(o) {
                    var i = (function(n) {
                      return n.preventDefault(), new FormData(n.target);
                    })(o);
                    console.log({ formData: i, action: t });
                    var a = {
                      displayName: i.get('username'),
                      userId: 'ff00aa'
                    };
                    window.sessionStorage.setItem(
                      'canopy_user',
                      JSON.stringify(a)
                    );
                    var c = o.target.parentNode,
                      u = 0,
                      s = 1e4;
                    !(function n() {
                      (u += s / 1e3),
                        (c.innerHTML =
                          '<progress style="font-size: 3rem" max="' +
                          s / 2 +
                          '" value="' +
                          (u % s) +
                          '"/>'),
                        window.requestAnimationFrame(n);
                    })(),
                      setTimeout(function() {
                        r.setUser(a),
                          (n.innerHTML = ''),
                          (window.location.href = e);
                      }, s);
                  };
                }
                var o = t('register'),
                  i = t('login'),
                  a = document.createElement('form');
                a.addEventListener('submit', o);
                var c = document.createElement('form');
                c.addEventListener('submit', i),
                  (a.innerHTML =
                    "<h1>Register</h1><input type='text' name='username'/><input type='password' name='password'/><button type='submit'>Register</button>"),
                  (c.innerHTML =
                    "<h1>Login</h1><input type='text' name='username'/><input type='password' name='password'/><button type='submit'>Login</button>"),
                  n.insertAdjacentElement('beforeend', a),
                  n.insertAdjacentElement('beforeend', c);
              });
          }
        } else r.setUser(JSON.parse(n));
      });
    },
    function(n, t, e) {
      'use strict';
      t.__esModule = !0;
      var r = (function() {
        if (!window || !window.$CANOPY)
          throw new Error(
            "Must be in a Canopy with 'window.$CANOPY' in scope to call this CanopyJS functions"
          );
        return window.$CANOPY;
      })();
      (t.registerApp = r.registerApp),
        (t.registerConfigSapling = r.registerConfigSapling),
        (t.getUser = r.getUser),
        (t.setUser = r.setUser);
    },
    function(n, t, e) {
      'use strict';
      function r() {
        return (r =
          Object.assign ||
          function(n) {
            for (var t = 1; t < arguments.length; t++) {
              var e = arguments[t];
              for (var r in e)
                Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]);
            }
            return n;
          }).apply(this, arguments);
      }
      function o(n) {
        return '/' === n.charAt(0);
      }
      function i(n, t) {
        for (var e = t, r = e + 1, o = n.length; r < o; e += 1, r += 1)
          n[e] = n[r];
        n.pop();
      }
      e.r(t);
      var a = function(n, t) {
        void 0 === t && (t = '');
        var e,
          r = (n && n.split('/')) || [],
          a = (t && t.split('/')) || [],
          c = n && o(n),
          u = t && o(t),
          s = c || u;
        if (
          (n && o(n) ? (a = r) : r.length && (a.pop(), (a = a.concat(r))),
          !a.length)
        )
          return '/';
        if (a.length) {
          var f = a[a.length - 1];
          e = '.' === f || '..' === f || '' === f;
        } else e = !1;
        for (var l = 0, d = a.length; d >= 0; d--) {
          var h = a[d];
          '.' === h
            ? i(a, d)
            : '..' === h
            ? (i(a, d), l++)
            : l && (i(a, d), l--);
        }
        if (!s) for (; l--; l) a.unshift('..');
        !s || '' === a[0] || (a[0] && o(a[0])) || a.unshift('');
        var v = a.join('/');
        return e && '/' !== v.substr(-1) && (v += '/'), v;
      };
      function c(n) {
        return n.valueOf ? n.valueOf() : Object.prototype.valueOf.call(n);
      }
      var u = function n(t, e) {
          if (t === e) return !0;
          if (null == t || null == e) return !1;
          if (Array.isArray(t))
            return (
              Array.isArray(e) &&
              t.length === e.length &&
              t.every(function(t, r) {
                return n(t, e[r]);
              })
            );
          if ('object' == typeof t || 'object' == typeof e) {
            var r = c(t),
              o = c(e);
            return r !== t || o !== e
              ? n(r, o)
              : Object.keys(Object.assign({}, t, e)).every(function(r) {
                  return n(t[r], e[r]);
                });
          }
          return !1;
        },
        s = !0,
        f = 'Invariant failed';
      var l = function(n, t) {
        if (!n) throw s ? new Error(f) : new Error(f + ': ' + (t || ''));
      };
      function d(n) {
        return '/' === n.charAt(0) ? n : '/' + n;
      }
      function h(n) {
        return '/' === n.charAt(0) ? n.substr(1) : n;
      }
      function v(n, t) {
        return (function(n, t) {
          return (
            0 === n.toLowerCase().indexOf(t.toLowerCase()) &&
            -1 !== '/?#'.indexOf(n.charAt(t.length))
          );
        })(n, t)
          ? n.substr(t.length)
          : n;
      }
      function p(n) {
        return '/' === n.charAt(n.length - 1) ? n.slice(0, -1) : n;
      }
      function g(n) {
        var t = n || '/',
          e = '',
          r = '',
          o = t.indexOf('#');
        -1 !== o && ((r = t.substr(o)), (t = t.substr(0, o)));
        var i = t.indexOf('?');
        return (
          -1 !== i && ((e = t.substr(i)), (t = t.substr(0, i))),
          { pathname: t, search: '?' === e ? '' : e, hash: '#' === r ? '' : r }
        );
      }
      function m(n) {
        var t = n.pathname,
          e = n.search,
          r = n.hash,
          o = t || '/';
        return (
          e && '?' !== e && (o += '?' === e.charAt(0) ? e : '?' + e),
          r && '#' !== r && (o += '#' === r.charAt(0) ? r : '#' + r),
          o
        );
      }
      function w(n, t, e, o) {
        var i;
        'string' == typeof n
          ? ((i = g(n)).state = t)
          : (void 0 === (i = r({}, n)).pathname && (i.pathname = ''),
            i.search
              ? '?' !== i.search.charAt(0) && (i.search = '?' + i.search)
              : (i.search = ''),
            i.hash
              ? '#' !== i.hash.charAt(0) && (i.hash = '#' + i.hash)
              : (i.hash = ''),
            void 0 !== t && void 0 === i.state && (i.state = t));
        try {
          i.pathname = decodeURI(i.pathname);
        } catch (n) {
          throw n instanceof URIError
            ? new URIError(
                'Pathname "' +
                  i.pathname +
                  '" could not be decoded. This is likely caused by an invalid percent-encoding.'
              )
            : n;
        }
        return (
          e && (i.key = e),
          o
            ? i.pathname
              ? '/' !== i.pathname.charAt(0) &&
                (i.pathname = a(i.pathname, o.pathname))
              : (i.pathname = o.pathname)
            : i.pathname || (i.pathname = '/'),
          i
        );
      }
      function y(n, t) {
        return (
          n.pathname === t.pathname &&
          n.search === t.search &&
          n.hash === t.hash &&
          n.key === t.key &&
          u(n.state, t.state)
        );
      }
      function b() {
        var n = null;
        var t = [];
        return {
          setPrompt: function(t) {
            return (
              (n = t),
              function() {
                n === t && (n = null);
              }
            );
          },
          confirmTransitionTo: function(t, e, r, o) {
            if (null != n) {
              var i = 'function' == typeof n ? n(t, e) : n;
              'string' == typeof i
                ? 'function' == typeof r
                  ? r(i, o)
                  : o(!0)
                : o(!1 !== i);
            } else o(!0);
          },
          appendListener: function(n) {
            var e = !0;
            function r() {
              e && n.apply(void 0, arguments);
            }
            return (
              t.push(r),
              function() {
                (e = !1),
                  (t = t.filter(function(n) {
                    return n !== r;
                  }));
              }
            );
          },
          notifyListeners: function() {
            for (var n = arguments.length, e = new Array(n), r = 0; r < n; r++)
              e[r] = arguments[r];
            t.forEach(function(n) {
              return n.apply(void 0, e);
            });
          }
        };
      }
      e.d(t, 'createBrowserHistory', function() {
        return E;
      }),
        e.d(t, 'createHashHistory', function() {
          return j;
        }),
        e.d(t, 'createMemoryHistory', function() {
          return M;
        }),
        e.d(t, 'createLocation', function() {
          return w;
        }),
        e.d(t, 'locationsAreEqual', function() {
          return y;
        }),
        e.d(t, 'parsePath', function() {
          return g;
        }),
        e.d(t, 'createPath', function() {
          return m;
        });
      var P = !(
        'undefined' == typeof window ||
        !window.document ||
        !window.document.createElement
      );
      function O(n, t) {
        t(window.confirm(n));
      }
      var x = 'popstate',
        A = 'hashchange';
      function L() {
        try {
          return window.history.state || {};
        } catch (n) {
          return {};
        }
      }
      function E(n) {
        void 0 === n && (n = {}), P || l(!1);
        var t,
          e = window.history,
          o =
            ((-1 === (t = window.navigator.userAgent).indexOf('Android 2.') &&
              -1 === t.indexOf('Android 4.0')) ||
              -1 === t.indexOf('Mobile Safari') ||
              -1 !== t.indexOf('Chrome') ||
              -1 !== t.indexOf('Windows Phone')) &&
            window.history &&
            'pushState' in window.history,
          i = !(-1 === window.navigator.userAgent.indexOf('Trident')),
          a = n,
          c = a.forceRefresh,
          u = void 0 !== c && c,
          s = a.getUserConfirmation,
          f = void 0 === s ? O : s,
          h = a.keyLength,
          g = void 0 === h ? 6 : h,
          y = n.basename ? p(d(n.basename)) : '';
        function E(n) {
          var t = n || {},
            e = t.key,
            r = t.state,
            o = window.location,
            i = o.pathname + o.search + o.hash;
          return y && (i = v(i, y)), w(i, r, e);
        }
        function T() {
          return Math.random()
            .toString(36)
            .substr(2, g);
        }
        var S = b();
        function k(n) {
          r(q, n),
            (q.length = e.length),
            S.notifyListeners(q.location, q.action);
        }
        function C(n) {
          (function(n) {
            return (
              void 0 === n.state && -1 === navigator.userAgent.indexOf('CriOS')
            );
          })(n) || H(E(n.state));
        }
        function U() {
          H(E(L()));
        }
        var j = !1;
        function H(n) {
          if (j) (j = !1), k();
          else {
            S.confirmTransitionTo(n, 'POP', f, function(t) {
              t
                ? k({ action: 'POP', location: n })
                : (function(n) {
                    var t = q.location,
                      e = R.indexOf(t.key);
                    -1 === e && (e = 0);
                    var r = R.indexOf(n.key);
                    -1 === r && (r = 0);
                    var o = e - r;
                    o && ((j = !0), I(o));
                  })(n);
            });
          }
        }
        var M = E(L()),
          R = [M.key];
        function _(n) {
          return y + m(n);
        }
        function I(n) {
          e.go(n);
        }
        var N = 0;
        function F(n) {
          1 === (N += n) && 1 === n
            ? (window.addEventListener(x, C),
              i && window.addEventListener(A, U))
            : 0 === N &&
              (window.removeEventListener(x, C),
              i && window.removeEventListener(A, U));
        }
        var B = !1;
        var q = {
          length: e.length,
          action: 'POP',
          location: M,
          createHref: _,
          push: function(n, t) {
            var r = w(n, t, T(), q.location);
            S.confirmTransitionTo(r, 'PUSH', f, function(n) {
              if (n) {
                var t = _(r),
                  i = r.key,
                  a = r.state;
                if (o)
                  if ((e.pushState({ key: i, state: a }, null, t), u))
                    window.location.href = t;
                  else {
                    var c = R.indexOf(q.location.key),
                      s = R.slice(0, c + 1);
                    s.push(r.key), (R = s), k({ action: 'PUSH', location: r });
                  }
                else window.location.href = t;
              }
            });
          },
          replace: function(n, t) {
            var r = w(n, t, T(), q.location);
            S.confirmTransitionTo(r, 'REPLACE', f, function(n) {
              if (n) {
                var t = _(r),
                  i = r.key,
                  a = r.state;
                if (o)
                  if ((e.replaceState({ key: i, state: a }, null, t), u))
                    window.location.replace(t);
                  else {
                    var c = R.indexOf(q.location.key);
                    -1 !== c && (R[c] = r.key),
                      k({ action: 'REPLACE', location: r });
                  }
                else window.location.replace(t);
              }
            });
          },
          go: I,
          goBack: function() {
            I(-1);
          },
          goForward: function() {
            I(1);
          },
          block: function(n) {
            void 0 === n && (n = !1);
            var t = S.setPrompt(n);
            return (
              B || (F(1), (B = !0)),
              function() {
                return B && ((B = !1), F(-1)), t();
              }
            );
          },
          listen: function(n) {
            var t = S.appendListener(n);
            return (
              F(1),
              function() {
                F(-1), t();
              }
            );
          }
        };
        return q;
      }
      var T = 'hashchange',
        S = {
          hashbang: {
            encodePath: function(n) {
              return '!' === n.charAt(0) ? n : '!/' + h(n);
            },
            decodePath: function(n) {
              return '!' === n.charAt(0) ? n.substr(1) : n;
            }
          },
          noslash: { encodePath: h, decodePath: d },
          slash: { encodePath: d, decodePath: d }
        };
      function k(n) {
        var t = n.indexOf('#');
        return -1 === t ? n : n.slice(0, t);
      }
      function C() {
        var n = window.location.href,
          t = n.indexOf('#');
        return -1 === t ? '' : n.substring(t + 1);
      }
      function U(n) {
        window.location.replace(k(window.location.href) + '#' + n);
      }
      function j(n) {
        void 0 === n && (n = {}), P || l(!1);
        var t = window.history,
          e = (window.navigator.userAgent.indexOf('Firefox'), n),
          o = e.getUserConfirmation,
          i = void 0 === o ? O : o,
          a = e.hashType,
          c = void 0 === a ? 'slash' : a,
          u = n.basename ? p(d(n.basename)) : '',
          s = S[c],
          f = s.encodePath,
          h = s.decodePath;
        function g() {
          var n = h(C());
          return u && (n = v(n, u)), w(n);
        }
        var y = b();
        function x(n) {
          r(B, n),
            (B.length = t.length),
            y.notifyListeners(B.location, B.action);
        }
        var A = !1,
          L = null;
        function E() {
          var n,
            t,
            e = C(),
            r = f(e);
          if (e !== r) U(r);
          else {
            var o = g(),
              a = B.location;
            if (
              !A &&
              ((t = o),
              (n = a).pathname === t.pathname &&
                n.search === t.search &&
                n.hash === t.hash)
            )
              return;
            if (L === m(o)) return;
            (L = null),
              (function(n) {
                if (A) (A = !1), x();
                else {
                  y.confirmTransitionTo(n, 'POP', i, function(t) {
                    t
                      ? x({ action: 'POP', location: n })
                      : (function(n) {
                          var t = B.location,
                            e = R.lastIndexOf(m(t));
                          -1 === e && (e = 0);
                          var r = R.lastIndexOf(m(n));
                          -1 === r && (r = 0);
                          var o = e - r;
                          o && ((A = !0), _(o));
                        })(n);
                  });
                }
              })(o);
          }
        }
        var j = C(),
          H = f(j);
        j !== H && U(H);
        var M = g(),
          R = [m(M)];
        function _(n) {
          t.go(n);
        }
        var I = 0;
        function N(n) {
          1 === (I += n) && 1 === n
            ? window.addEventListener(T, E)
            : 0 === I && window.removeEventListener(T, E);
        }
        var F = !1;
        var B = {
          length: t.length,
          action: 'POP',
          location: M,
          createHref: function(n) {
            var t = document.querySelector('base'),
              e = '';
            return (
              t && t.getAttribute('href') && (e = k(window.location.href)),
              e + '#' + f(u + m(n))
            );
          },
          push: function(n, t) {
            var e = w(n, void 0, void 0, B.location);
            y.confirmTransitionTo(e, 'PUSH', i, function(n) {
              if (n) {
                var t = m(e),
                  r = f(u + t);
                if (C() !== r) {
                  (L = t),
                    (function(n) {
                      window.location.hash = n;
                    })(r);
                  var o = R.lastIndexOf(m(B.location)),
                    i = R.slice(0, o + 1);
                  i.push(t), (R = i), x({ action: 'PUSH', location: e });
                } else x();
              }
            });
          },
          replace: function(n, t) {
            var e = w(n, void 0, void 0, B.location);
            y.confirmTransitionTo(e, 'REPLACE', i, function(n) {
              if (n) {
                var t = m(e),
                  r = f(u + t);
                C() !== r && ((L = t), U(r));
                var o = R.indexOf(m(B.location));
                -1 !== o && (R[o] = t), x({ action: 'REPLACE', location: e });
              }
            });
          },
          go: _,
          goBack: function() {
            _(-1);
          },
          goForward: function() {
            _(1);
          },
          block: function(n) {
            void 0 === n && (n = !1);
            var t = y.setPrompt(n);
            return (
              F || (N(1), (F = !0)),
              function() {
                return F && ((F = !1), N(-1)), t();
              }
            );
          },
          listen: function(n) {
            var t = y.appendListener(n);
            return (
              N(1),
              function() {
                N(-1), t();
              }
            );
          }
        };
        return B;
      }
      function H(n, t, e) {
        return Math.min(Math.max(n, t), e);
      }
      function M(n) {
        void 0 === n && (n = {});
        var t = n,
          e = t.getUserConfirmation,
          o = t.initialEntries,
          i = void 0 === o ? ['/'] : o,
          a = t.initialIndex,
          c = void 0 === a ? 0 : a,
          u = t.keyLength,
          s = void 0 === u ? 6 : u,
          f = b();
        function l(n) {
          r(y, n),
            (y.length = y.entries.length),
            f.notifyListeners(y.location, y.action);
        }
        function d() {
          return Math.random()
            .toString(36)
            .substr(2, s);
        }
        var h = H(c, 0, i.length - 1),
          v = i.map(function(n) {
            return w(n, void 0, 'string' == typeof n ? d() : n.key || d());
          }),
          p = m;
        function g(n) {
          var t = H(y.index + n, 0, y.entries.length - 1),
            r = y.entries[t];
          f.confirmTransitionTo(r, 'POP', e, function(n) {
            n ? l({ action: 'POP', location: r, index: t }) : l();
          });
        }
        var y = {
          length: v.length,
          action: 'POP',
          location: v[h],
          index: h,
          entries: v,
          createHref: p,
          push: function(n, t) {
            var r = w(n, t, d(), y.location);
            f.confirmTransitionTo(r, 'PUSH', e, function(n) {
              if (n) {
                var t = y.index + 1,
                  e = y.entries.slice(0);
                e.length > t ? e.splice(t, e.length - t, r) : e.push(r),
                  l({ action: 'PUSH', location: r, index: t, entries: e });
              }
            });
          },
          replace: function(n, t) {
            var r = w(n, t, d(), y.location);
            f.confirmTransitionTo(r, 'REPLACE', e, function(n) {
              n &&
                ((y.entries[y.index] = r),
                l({ action: 'REPLACE', location: r }));
            });
          },
          go: g,
          goBack: function() {
            g(-1);
          },
          goForward: function() {
            g(1);
          },
          canGo: function(n) {
            var t = y.index + n;
            return t >= 0 && t < y.entries.length;
          },
          block: function(n) {
            return void 0 === n && (n = !1), f.setPrompt(n);
          },
          listen: function(n) {
            return f.appendListener(n);
          }
        };
        return y;
      }
    }
  ]);
});
