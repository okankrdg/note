

$(function () {


    //Globals
    $body = $("body");
    var selectedNote = null;
    var selectedLink = null;
    $(document).on({
        ajaxStart: function() { $body.addClass("loading"); },
        ajaxStop: function () { $body.removeClass("loading"); }
    });
    var apiUrl = 'https://localhost:44339/';
    //var apiUrl = 'http://mynoteapi.okankaradag.com/';
    //Funcitons
    function checkLogin() {
        var loginData = getloginData();
        if (!loginData || !loginData.access_token) {
            showLoginPage();
            return;
        }

        //is Token Valid?
        ajax("api/Account/UserInfo", "GET",null,
            function (data) {
                showAppPage();
            },
            function () {
                showLoginPage();
            }
        )
    }
    function showAppPage() {
        $(".only-logged-in").show();
        $(".only-logged-out").hide();
        $(".page").hide();
        ajax("api/Notes/List", "GET", null,
            function (data) {
                for (var i = 0; i < data.length; i++) {
                    addMenuLink(data[i]);
                }

                $("#page-app").show();
            },
            function () {

            });
       
    }
    function addMenuLink(note, isActive = false) {
        var a = $('<a/>').addClass("list-group-item list-group-item-action show-note")
            .attr("href", "#")
            .text(note.Title)
            .prop('note', note);
       
        if (isActive) {
            $(".show-note").removeClass("active");
            a.addClass("active");
            selectedLink = a.get(0);
            selectedNote = note;
        }
        $("#notes").prepend(a);
        
    }
    function showLoginPage() {
        $(".only-logged-in").hide();
        $(".only-logged-out").show();
        $(".page").hide();
        //retrieve notes
        $("#page-login").show();
    }
    function getAuthHeader() {
        return { Authorization: "Bearer " + getloginData().access_token };
    }
    function ajax(url,type, data,successFunc, errorFunc) {
        $.ajax({
            url: apiUrl + url,
            type: type,
            data:data,
            headers: getAuthHeader(),
            success: successFunc,
            error: errorFunc
        })
    }
    function updateNote() {
        ajax("api/Notes/Update/" + selectedNote.Id, "Put",
            {
                Id: selectedNote.Id,
                Title: $('#noteTitle').val(),
                Content:$('#noteContent').val()
            },
            function (data) {
                selectedLink.note = data;
                $(selectedLink).text(data.Title);
                alert("Güncelleme Başarılı")
            },
            function () {

            }
        )
    }
    function addNote() {
        ajax("api/Notes/New/", "Post",
            {
                Title: $('#noteTitle').val(),
                Content: $('#noteContent').val()
            },
            function (data) {
                addMenuLink(data, true);
            },
            function () {

            }
        )
    }
    function getloginData() {
      
        var json = sessionStorage["login"] || localStorage["login"]
        if (json) {
            try {
                return JSON.parse(json);
            } catch (e) {
                return null;
            }
           
        }
        return null;
        
    }
    function success(message) {
        $(".tab-pane.active .message").removeClass("alert-danger").addClass("alert-success").text(message).show();
    }
    function error(modelState,loginerror) {
        if (modelState) {
            var errors = [];
            for (var prop in modelState) {
                for (var i = 0; i < modelState[prop].length; i++) {
                    errors.push(modelState[prop][i]);
                }
            }
        }
        var ul = $("<ul/>")
        for (var i = 0; i < errors.length; i++) {
            ul.append($("<li/>").text(errors[i]));
            $(".tab-pane.active .message").removeClass("alert-success").addClass("alert-danger").html(ul).show();
        }
    }
    function resetLoginForms() {
        $('.message').hide();
        $("#login form").each(function () {
            this.reset();
        })
    }
    function loginError(errorMessage) {
        $(".tab-pane.active .message").removeClass("alert-success").addClass("alert-danger").text(errorMessage).show();
    }
    function resetNoteForm() {
        selectedLink = null;
        selectedNote = null;
        $(".show-note").removeClass("active");
        $("#noteTitle").val("");
        $("#noteContent").val("");
    }
    $('#signupform').submit(function (event) {
        event.preventDefault();
        var formdata = $(this).serialize();
        $.post(apiUrl + "api/Account/Register", formdata, function (data) {
            resetLoginForms();
            success("created successfully");
        }).fail(function (xhr) {
            error(null,xhr.responseJSON.ModelState);
        })
    });
    $('#signinform').submit(function (event) {
        event.preventDefault();
        var formdata = $(this).serialize();
        $.post(apiUrl + "Token", formdata, function (data) {
            var datastr = JSON.stringify(data);
            if ($("#signinrememberme").prop("checked")) {
                sessionStorage.removeItem("login");
                localStorage["login"] = datastr;
            }
            else {
                localStorage.removeItem("login");
                sessionStorage["login"] = datastr;
            }
            resetLoginForms();
            success("You have been Token successfullly created. Now you are being redirected..");

            setTimeout(function () {
                resetLoginForms();
                showAppPage()
            },1000)
        }).fail(function (xhr) {
            loginError(xhr.responseJSON.error_description)
        })
    });
    $('#login a[data-toggle="pill"]').on('shown.hidden.bs.tab', function (e) {
        $('#login form').each(function () {
            this.reset();
        })
        resetLoginForms();
    });
    $('.navbar-login a').click(function (e) {
        e.preventDefault();
        var href = $(this).attr("href");
        $('#pills-tab a[href="' + href + '"]').tab('show')
    })
    $('#btnLogout').click(function (e) {
        e.preventDefault();
        sessionStorage.removeItem("login");
        localStorage.removeItem("login");
        resetNoteForm()
        showLoginPage();
    });
    $(".add-new-note").click(function () {
        resetNoteForm();
    })
    $("body").on("click",".show-note", function (e) {
        e.preventDefault();
        selectedNote = this.note;
        selectedLink = this;
        $('#noteContent').val(selectedNote.Content);
        $('#noteTitle').val(selectedNote.Title);
        $(".show-note").removeClass("active");
        $(this).addClass("active");
    })
    $("#frmNote").submit(function (event) {
        event.preventDefault();
        if (selectedNote) {
            updateNote();
        }
        else {
            addNote();
        }
    })
    $("#btnDelete").click(function () {
        if (selectedNote) {
            if (confirm("Are you sure to delete the selected note")) {
                ajax("api/Notes/Delete/" + selectedNote.Id, "Delete", null, function (data) {
                    $(selectedLink).remove();
                    resetNoteForm();
                })
            }
           
        }
        else {
            if (confirm("Are you sure to delete the draft")) {
                resetNoteForm();
            }
        }
    })
    //Commands
    checkLogin();
})
