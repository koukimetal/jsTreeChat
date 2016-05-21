$(function () {
    $('#root').jstree({
        'core': {
            "check_callback": true,
            'data': {
                'url': function (node) {
                    return "core.php?p=" + node.id;
                }
            }
        },
        contextmenu: {
            items: function (o, cb) {
                var menu = {
                    "comment": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Comment",
                        "icon": "icon-speech",
                        "action": function (data) {
                            write(data, 'comment', 'icon-speech');
                        }
                    },
                    "link": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Link",
                        "icon": "icon-link",
                        "action": function (data) {
                            write(data, 'link', 'icon-link');
                        }
                    },
                    "thread": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Thread",
                        "icon": "icon-book-open",
                        "action": function (data) {
                            write(data, 'thread', 'icon-book-open');
                        }
                    },
                    "disable": {
                        "separator_before": false,
                        "separator_after": false,
                        "_disabled": false,
                        "label": "Disable",
                        "icon": "icon-ban",
                        "action": function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            disableNode(obj);
                        }
                    },
                    "refresh": {
                        "separator_before": false,
                        "separator_after": false,
                        "_disabled": false,
                        "label": "Refresh",
                        "icon": "icon-refresh",
                        "action": function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            $('#root').jstree().refresh_node(obj);
                        }
                    }
                };
                if (o.id === "0") {
                    delete menu.disable;
                }
                if (o.icon == "icon-ban") {
                    delete menu.disable;
                }
                if (o.icon == "icon-book-open") {
                    delete menu.disable;
                    menu.thread.submenu = {
                        "disable": {
                            "separator_before": false,
                            "separator_after": false,
                            "_disabled": false,
                            "label": "Force Disable",
                            "icon": "icon-fire",
                            "action": function (data) {
                                var inst = $.jstree.reference(data.reference),
                                    obj = inst.get_node(data.reference);
                                disableNode(obj);
                            }
                        }
                    }
                }
                return menu;
            }
        },
        "types" : {
            "default": {
                "icon": "icon-speech"
            }
        },
        "plugins": ["contextmenu", "types"]
    }).bind("changed.jstree", function (e, data) {
        if(data.node) {
            var href = data.node.a_attr.href;
            if(href !== "#") {
                window.open(href, '_blank');
            }
        }
    });
});

var JSTREECHAT_NAME = "jsTreeChatName";
var JSTREECHAT_PASS = "jsTreeChatPass";

//load
$(function () {
    $("#username").val(localStorage.getItem(JSTREECHAT_NAME));
    $("#password").val(localStorage.getItem(JSTREECHAT_PASS));
});

var write = function (data, action, icon) {
    var inst = $.jstree.reference(data.reference),
        obj = inst.get_node(data.reference);

    inst.create_node(obj, {"icon" : icon}, "first", function (new_node) {
        setTimeout(function () {
            inst.edit(new_node, null, function(node) {
                makeNewNode(node, action);
            })
        }, 0);
    });
};

var makeNewNode = function (node, action) {
    var username = $("#username").val();
    var password = $("#password").val();
    localStorage.setItem(JSTREECHAT_NAME, username);
    localStorage.setItem(JSTREECHAT_PASS, password);
    $.post("core.php",
        {
            action: action,
            parentId: node.parent,
            textContent: node.text,
            username: username,
            password: makeHash(password)
        },
        function (data) {
            handleResponse(data, node);
        },
        "json"
    );
};
var disableNode = function (node) {
    var password = $("#password").val();
    localStorage.setItem(JSTREECHAT_PASS, password);
    $.post("core.php",
        {
            action: 'disable',
            id: node.id,
            password: makeHash(password)
        },
        function (data) {
            handleResponse(data, node);
        },
        "json"
    );
};

var handleResponse = function(data, node) {
    var inst = $.jstree.reference(node.parent),
        obj = inst.get_node(node.parent);
    $('#root').jstree().refresh_node(obj);

    if (data.message != "success") {
        alert(data.message);
    }
};

var makeHash = function (str) {
    var hash = CryptoJS.SHA256(str);
    return hash.toString(CryptoJS.enc.Hex);
};