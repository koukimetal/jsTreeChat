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
                    "write": {
                        "separator_before": false,
                        "separator_after": true,
                        "_disabled": false,
                        "label": "Write",
                        "action": function (data) {
                            var inst = $.jstree.reference(data.reference),
                                obj = inst.get_node(data.reference);
                            inst.create_node(obj, {}, "first", function (new_node) {
                                setTimeout(function () {
                                    inst.edit(new_node, null, makeNewNode)
                                }, 0);
                            });
                        }
                    },
                    "edit": {
                        "separator_before": false,
                        "separator_after": false,
                        "_disabled": false,
                        "label": "Edit",
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
        "plugins": ["contextmenu"]
    });
});

//load
$(function () {
    $("#username").val(localStorage.getItem("name"));
    $("#password").val(localStorage.getItem("pass"));
});

var makeNewNode = function (node) {
    var username = $("#username").val();
    var password = $("#password").val();
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    $.post("core.php",
        {
            action: 'write',
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