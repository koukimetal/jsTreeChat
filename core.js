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
            items: function (o, cb) { // Could be an object directly
                var menu = {
                    "comment": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Comment",
                        "icon": "icon-speech",
                        "action": function (data) {
                            write(data, 'comment');
                        }
                    },
                    "link": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Link",
                        "icon": "icon-link",
                        "action": function (data) {
                            write(data, 'link');
                        }
                    },
                    "edit": {
                        "separator_before": false,
                        "separator_after": false,
                        "_disabled": false,
                        "label": "Edit",
                        "icon": "icon-pencil",
                        "action": function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            inst.edit(obj, null, editNode);
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
                    delete menu.edit;
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
    });;
});

//load
$(function () {
    $("#username").val(localStorage.getItem("name"));
    $("#password").val(localStorage.getItem("pass"));
});

var write = function (data, action) {
    var inst = $.jstree.reference(data.reference),
        obj = inst.get_node(data.reference);

    var icon = 'icon-speech';
    if (action === 'link') {
        icon = 'icon-link';
    }

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
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    $.post("core.php",
        {
            action: action,
            parentId: node.parent,
            textContent: node.text,
            username: username,
            password: makeHash(password)
        },
        function (data) {
            var inst = $.jstree.reference(node.parent),
                obj = inst.get_node(node.parent);
            $('#root').jstree().refresh_node(obj);

            if (data.message != "success") {
                alert(data.message);
            }
        },
        "json"
    );
};
var editNode = function (node) {
    var password = $("#password").val();
    localStorage.setItem('password', password);
    $.post("core.php",
        {
            action: 'edit',
            id: node.id,
            textContent: node.text,
            password: makeHash(password)
        },
        function (data) {
            var inst = $.jstree.reference(node.parent),
                obj = inst.get_node(node.parent);
            $('#root').jstree().refresh_node(obj);

            if (data.message != "success") {
                alert(data.message);
            }
        },
        "json"
    );
};

var makeHash = function (str) {
    var hash = CryptoJS.SHA256(str);
    return hash.toString(CryptoJS.enc.Hex);
};