/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */
(function (windowRef, documentRef) {
    'use strict';
    var R = windowRef.RemoteTV, p = R && R.policy || {}, u = p.ui || {}, i, e;
    function each(a, fn) {
        if (!a)
            return;
        for (var j = 0; j < a.length; j++)
            fn(a[j]);
    }
    each(u.hide, function (s) {
        try {
            var q = documentRef.querySelectorAll(s);
            for (i = 0; i < q.length; i++) {
                q[i].style.display = 'none';
                q[i].tabIndex = -1;
            }
        } catch (x) {
        }
    });
    each(u.disable, function (s) {
        try {
            var q = documentRef.querySelectorAll(s);
            for (i = 0; i < q.length; i++) {
                q[i].disabled = true;
                q[i].tabIndex = -1;
            }
        } catch (x) {
        }
    });
    if (R)
        R.hooksApplied = true;
}(this, document));
