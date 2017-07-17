/**
 * Prototype für das datum mit W3C-Format
 * Wichtig für den Wareneingang!
 * Evtl. TO-DO wenn Plenty die Server-Zeit selber setzen würde
 */

Date.prototype.toW3CString = function() {
    var year = this.getFullYear();
    var month = this.getMonth();
    month++;
    if (month < 10) {
        month = '0' + month;
    }
    var day = this.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    var hours = this.getHours();
    if (hours < 10) {
        hours = '0' + hours;
    }
    var minutes = this.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    var seconds = this.getSeconds();
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    var offset = -this.getTimezoneOffset();
    var offsetHours = Math.abs(Math.floor(offset / 60));
    var offsetMinutes = Math.abs(offset) - offsetHours * 60;
    if (offsetHours < 10) {
        offsetHours = '0' + offsetHours;
    }
    if (offsetMinutes < 10) {
        offsetMinutes = '0' + offsetMinutes;
    }
    var offsetSign = '+';
    if (offset < 0) {
        offsetSign = '-';
    }
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + offsetSign + offsetHours + ':' + offsetMinutes;
};

/**
 * Globale variablen
 */
var variationId;
var warehouses = new Object();
var usedwarehouse;
var usedlocation;
var filledplaces = new Object();
var places = new Object();
var freeplaces = new Object();
var shelves = new Object();
/**
 * Funktion die einen Artikel über die Rest-Api anhand eines Barcodes sucht und in der div #output ausgibt
 * @param barcode string
 */
function findVariant(barcode) {

    $('#load').show();
    $('.findArticle').prop("disabled", true);
    $.ajax({
        type: "GET",
        url: "/rest/items/variations",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        data: {
            barcode: barcode
        },
        success: function(data) {
            variationId = 0;
            var items = 0;
            var used;
            $('#output').html("");
            if (data.totalsCount == 0) {
                $('#output').html("<p class='find-false'>Es wurde kein Artikel gefunden.</p>");
                $('.findArticle').removeAttr("disabled");
                $('.findArticle').select();
            } else {
                $('.back').removeAttr("disabled");
                //Wenn nur ein Artikel gefunden wurde
                data.entries.forEach(function(variant) {
                    items++;
                    used = variant.id;
                    number = variant.number;
                    if ($('#menu_var').text() == "umbuchen") {
                        $('#output').append("<div class='find-true'><p>Artikel <span id='variant_" + variant.id + "' class='number'>" + variant.number + "</span> wurde gefunden. </p><span variant='" + variant.id + "' class='use_variant btn'  onclick='usevariant(" + variant.id + ", true);'><i class='material-icons'>done</i></span></div>");

                    } else {
                        $('#output').append("<div class='find-true'><p>Artikel <span id='variant_" + variant.id + "' class='number'>" + variant.number + "</span> wurde gefunden. </p><span variant='" + variant.id + "' class='use_variant btn' onclick='usevariant(" + variant.id + ");'><i class='material-icons'>done</i></span></div>");

                    }
                });

                if (items == 1) {
                    variationId = used;
                    $('#output').html("<div class='find-true'><p>Artikel <span id='variant_" + used + "' class='number'>" + number + "</span> wurde ausgewählt</p></div>");

                    $('.use_variant').remove();
                    $('.locationEan').removeAttr("disabled");
                    if ($('#menu_var').text() == "umbuchen") {
                        findPlaces();
                    } else {
                        menge();
                    }

                }
            }
            $('#load').hide();

        },
        error: function(data) {
            var json = $.parseJSON(data.responseText);
            $('#output').html("<div class='find-false'><p>PlentyMarkets meldet folgenden Fehler: <br/> ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");
            $('.findArticle').removeAttr("disabled");
            $('.findArticle').select();
        }
    });
}
/**
 * Funktion die, die Lagerorte eines Artikels findet
 * beachtet werden die LagerCheckboxen
 */
function findPlaces() {
    $('#load').show();
    $('#lagerorteoutput').show();
    $('#lagerorteoutput').html("");
    $('#selectedoutput').hide();
    var comp = 0;
    var warehousesc = 0;
    var locationnames = new Object();
    $.each(warehouses, function(warehouseId, active) {
        if (active == "1") {
            warehousesc++;
            $.ajax({
                async: false,
                type: "GET",
                url: "/rest/stockmanagement/warehouses/" + warehouseId + "/stock/storageLocations",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
                data: {
                    variationId: variationId
                },
                success: function(data) {
                    var locations = 0;
                    var html = "<p style='color: white; text-align: center; background-color: #008EBD; width: auto;'>Lager: " + $('.whname[whid=' + warehouseId + ']').text() + "</p><table class='table'><thead><th>LagerortId</th><th>Lagerort</th><th>Menge</th><th>Aktion</th></thead><tbody>";

                    $.each(data.entries, function() {
                        if (this.quantity > 0) {
                            locations = locations + 1;
                            comp = comp + 1;
                            locationnames[this.storageLocationId] = new Object();
                            locationnames[this.storageLocationId] = warehouseId;
                            html = html + "<tr><td>" + this.storageLocationId + "</td><td class='place' sid='" + this.storageLocationId + "'></td><td>" + this.quantity + "</td><td><span value='Umbuchen' id='umbuchen_" + this.storageLocationId + "' class='btn umbuchenbutton' sid='" + this.storageLocationId + "' wid='" + warehouseId + "' wname='" + $('.whname[whid=' + warehouseId + ']').text() + "' qty='" + this.quantity + "' onclick='umbuchenbutton(" + this.storageLocationId + ");'><i class='material-icons'>done</i></span></td></tr>";
                        }
                    });
                    html = html + "</tbody></table>";
                    if (locations > 0) {
                        $("#lagerorteoutput").append(html);
                        getLocationName(locationnames);
                    } else {
                        $("#lagerorteoutput").append("<div class='find-false'><p>Für das Lager <b>" + $('.whname[whid=' + warehouseId + ']').text() + "</b> wurde kein Eintrag gefunden</p></div>");
                    }

                },
                error: function(data) {
                    console.log(data);
                }
            });

        }
    });

    if (warehousesc == 0) {
        $("#lagerorteoutput").html("<div class='find-false'><p>Bitte wählen Sie ein Lager aus.</p></div>");
        $('#load').hide();
    }

}

/**
 * Funktion die, die Lagerortnamen ermittelt
 * TO-DO: leider ist dies zurzeit nur möglich über einen Extra-Call der Rest-Api, d.h. es ist nicht sonderlich performant
 * @param array
 */
function getLocationName(locationames) {
    $('#load').show();
    $.each(locationames, function(locationId, warehouseId) {

        if (locationId > 0) {
            $('#load').show();
            setTimeout(function() {
                $.ajax({
                    type: "GET",
                    url: "/rest/stockmanagement/warehouses/" + warehouseId + "/management/storageLocations/" + locationId,
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("accessToken")
                    },
                    success: function(data) {
                        $('.place[sid=' + locationId + ']').text(data['name']);
                    },
                    error: function(data) {
                        console.log(data);
                    }
                });
            }, 5);
        } else {
            $('.place[sid=' + locationId + ']').text("Standard-Lagerort");
        }
    });

}
/**
 * Login Funktion über die Rest-Api mit den Plenty-Logindaten
 */
function login() {
    $('#load').show();
    var username = $('#username').val();
    var password = $('#password').val();
    $.ajax({
        type: "POST",
        url: "/rest/login",
        data: {
            username: username,
            password: password
        },
        success: function(data) {
            localStorage.setItem("accessToken", data.accessToken)
            checkaccess();
            $('#login').fadeOut(250);
            $('#load').fadeOut(100);

            setTimeout(function() {
                if (!$('.findArticle').is(":disabled")) {
                    $('.findArticle').select();
                }
            }, 300);

        },
        error: function(data) {
            alert("Benutername oder Passwort falsch!");
            $('#username').val("");
            $('#password').val("");
            $('#load').fadeOut(100);
        }
    });

}

/**
 * Funktion zum logout, derzeit wird nur das LocalStorage geleert, evtl. Logout über die Rest-Api
 */
function logout() {
    $('#load').fadeIn(100);
    localStorage.removeItem("accessToken");
    location.reload();
}
/**
 * Funktion die bestimmt ob die standardisierte menge aktiviert ist
 */
function menge() {
    $('.back').removeAttr("disabled");
    if ($("#standart_menge").is(':checked')) {
        $('.locationEan').removeAttr("disabled");
        $('.locationEan').select();
    } else {
        $('.locationEan').removeAttr("disabled");
        $('#menge').val("1");
        $('#menge').select();
    }
}
/**
 * Funktion die prüft ob der accessToken im LocalStorage gültig ist, wenn nicht erscheint die Login-Maske
 */
function checkaccess() {

    $.ajax({
        type: "GET",
        url: "/rest/authorized_user",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        success: function(data) {
            $('#realName').text(data.realName);
            $('#names').fadeIn(100);
        },
        error: function(data) {
            $('#names').hide();
            $('#username').val("");
            $('#password').val("")
            $('#login').fadeIn(250);
            $('#username').focus();
        }
    });
}
/**
 * Funktion die einen Artikel "benutzt" beim button "Ok" wenn mehrere Artikel gefunden wurden
 */
function usevariant(id, umbuchen = false) {

    var number = $("#variant_" + id).text();
    $('#output').html("<div class='find-true'>Artikel <span class='number'>" + number + "</span> wurde ausgewählt</div>");
    variationId = id;
    if (umbuchen) {
        $('#load').show();
        setTimeout(function() {
            findPlaces();
        }, 20);

    } else {
        menge();
    }

}
/**
 * Funktion die, die Ware beim erfolgreichen scannen über die Rest-Api einbucht
 */
function einbuchen() {
    $('#load').show();
    var locationean = $('.locationEan').val();
    var x = locationean.split("L");
    var error = 0;
    if (typeof x[1] != 'undefined') {
        var xx = x[1].split("S");
    } else {
        var x = locationean.split("l");
        if (typeof x[1] != 'undefined') {
            var xx = x[1].split("s");
        } else {
            error = 1;
        }
    }

    if (error === 0) {
        var lager = xx[0];
        if (warehouses[lager] == "1") {
            var location = xx[1];

            var qty = $('#menge').val();
            var date = new Date();
            date = date.toW3CString();
            //date = "2017-05-15T03:30:29-04:00";
            var url = "/rest/stockmanagement/warehouses/" + lager + "/stock/bookIncomingItems";

            $.ajax({
                type: "PUT",
                url: url,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
                data: {
                    incomingItems: [{
                        variationId: variationId,
                        currency: "EUR",
                        reasonId: 101,
                        quantity: qty,
                        storageLocationId: location,
                        deliveredAt: date
                    }]
                },
                success: function(data) {
                    deletefreeplace(location);
                    $('#load').hide();
                    $('#output').html("<div class='green'><p>Artikel wurde erfolgreich eingebucht</p></div>");
                    $('.locationEan').prop("disabled", true);
                    $('.locationEan').val("");
                    $('.findArticle').removeAttr("disabled");
                    $('.findArticle').select();
                },
                error: function(data) {
                    $('#load').hide();
                    var json = $.parseJSON(data.responseText);
                    $('#output').html("<div class='find-false'><p>PlentyMarkets meldet folgenden Fehler: <br/> ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");

                }
            });

        } else {
            alert("Das von Ihnen gewählte Lager wurde nicht gefunden oder Sie haben es nicht ausgewählt!");
            $('#load').hide();
            $('.locationEan').select();
        }
    } else {
        $('#output').html("<div class='find-false'><p>Bitte überprüfen Sie Ihre eingabe!</p></div>");
        $('#load').hide();
        $('.locationEan').select();
    }
}
/**
 * Funktion die, den ausgewählten Datensatz auf einen neuen über die Rest-Api umbucht
 */
function umbuchen() {
    $('#load').show();
    var locationean = $('.locationEan').val();
    var x = locationean.split("L");
    var error = 0;
    if (typeof x[1] != 'undefined') {
        var xx = x[1].split("S");
    } else {
        var x = locationean.split("l");
        if (typeof x[1] != 'undefined') {
            var xx = x[1].split("s");
        } else {
            error = 1;
        }
    }

    if (error === 0) {
        var lager = xx[0];
        var location = xx[1];
        var qty = $('#menge').val();
        var date = new Date();
        date = date.toW3CString();
        //date = "2017-05-15T03:30:29-04:00";
        var url = "/rest/stockmanagement/stock/redistribute";

        $.ajax({
            type: "PUT",
            url: url,
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            data: {
                redistributions: [{
                    variationId: variationId,
                    reasonId: 401,
                    quantity: qty,
                    currentStorageLocationId: usedlocation,
                    currentWarehouseId: usedwarehouse,
                    newWarehouseId: lager,
                    newStorageLocationId: location,
                }]
            },
            success: function(data) {
                deletefreeplace(location);
                $('#load').hide();
                $('#output').html("<div class='green'><p>Artikel wurde erfolgreich umgebucht</p></div>");
                $('.output').hide();
                $('#output').show();
                $('.locationEan').prop("disabled", true);
                $('.locationEan').val("");
                $('.findArticle').removeAttr("disabled");
                $('.findArticle').select();
            },
            error: function(data) {
                $('#load').hide();
                var json = $.parseJSON(data.responseText);
                $('#output').html("<div class='find-false'><p>PlentyMarkets meldet folgenden Fehler: <br/> ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");

            }
        });

    } else {
        $('#output').html("<div class='find-false'><p>Bitte überprüfen Sie Ihre eingabe!</p></div>");
        $('#load').hide();
        $('.locationEan').select();
    }
}

function exportfreeplaces() {
    $('#load').show();
    var csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "storageLocationId;storageLocationName" + "\n";
    $.each(returnfreeplaces("1"), function(key, place) {
        console.log(place);
        csvContent += place[0] + ";" + place[1] + "\n";
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
    $('#load').hide();
}

function getfreeplaces(warehouseId) {
    /**
     * Reset the objects
     */
    filledplaces = new Object();
    freeplaces = new Object();
    places = new Object();
    /**
     * Ajax
     */
    $.ajax({
        type: "GET",
        url: "/rest/stockmanagement/warehouses/" + warehouseId + "/stock/storageLocations",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        data: {
            itemsPerPage: "9999999"
        },
        success: function(data) {
            $.each(data.entries, function() {
                if (this.quantity > 0) {
                    filledplaces[this.storageLocationId] = new Object();
                    filledplaces[this.storageLocationId] = 1;
                }
            });
            /**
             * Wenn die Storagelocations durch sind sucht er sich alle Locations
             */
            var limit = 4;
            var limitzaehler = 0;
            $.ajax({
                type: "GET",
                url: "/rest/stockmanagement/warehouses/" + warehouseId + "/management/storageLocations",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
                data: {
                    itemsPerPage: "9999999"
                },
                success: function(data) {
                    /**
                     * Racks bekommen
                     */
                    $.ajax({
                        type: "GET",
                        url: "/rest/stockmanagement/warehouses/" + warehouseId + "/management/racks",
                        headers: {
                            "Authorization": "Bearer " + localStorage.getItem("accessToken")
                        },
                        data: {
                            itemsPerPage: "9999999"
                        },
                        success: function(data) {
                            var xhtml = "<select id='freeplacesracks' class='form-control'><option value='all'>Alle</option>";
                            $.each(data.entries, function() {
                                xhtml = xhtml + "<option value='" + this.id + "'>" + this.name + "</option>";
                                $.ajax({
                                    type: "GET",
                                    url: "/rest/stockmanagement/warehouses/" + warehouseId + "/management/racks/" + this.id + "/shelves",
                                    headers: {
                                        "Authorization": "Bearer " + localStorage.getItem("accessToken")
                                    },
                                    data: {
                                        itemsPerPage: "9999999"
                                    },
                                    success: function(data) {

                                        $.each(data.entries, function() {
                                            shelves[this.id] = new Object();
                                            shelves[this.id] = this;
                                        });
                                    }
                                });
                            });
                            xhtml = xhtml + "</select><script>$(document).ready(function(){$('#freeplacesracks').change( function(){changeregal($(this).val());});});</script>";
                            $('#rackselect').html(xhtml);
                            alert("Berechnung erfolgreich.");
                        }
                    });

                    $.each(data.entries, function() {
                        places[this.id] = new Object();
                        places[this.id] = {
                            name: this.name,
                            type: this.type,
                            rack: this.rackId,
                            shelf: this.shelfId
                        };
                    });

                    $.each(places, function(id, place) {

                        if (typeof(filledplaces[id]) != "undefined") {} else {
                            freeplaces[id] = new Object();
                            freeplaces[id] = place;
                        }

                    });

                },
                error: function(data) {
                    console.log(data)
                }
            });

        },
        error: function(data) {
            console.log(data)
        }
    });

}

function changeregal(id) {
    var html = "<select id='shelvselects' class='form-control'><option value='all'>Alle</option>";
    $.each(shelves, function() {
        if (this.rackId == id) {
            html = html + "<option value='" + this.id + "'>" + this.name + "</option>";
        }
    });
    html = html + "</select>";
    $('#shelvselect').html(html);
}

function returnfreeplaces(exp = "0") {
    var limit = $('#freeplaceslimit').val();
    var type = $('#freeplacestype').val();
    var rackId = $('#freeplacesracks').val();
    var shelvId = $('#shelvselects').val();
    var limitzaehler = 0;
    var results = 0;
    var html = "<hr><table class='table table-striped'><th>Lagerorte</th>";
    var xreturn = new Object();
    $.each(freeplaces, function(id, place) {
        if (limitzaehler == limit) {
            return false;
        }

        if (rackId == "all" && shelvId == "all" && type == "all") {
            limitzaehler++;
            results++;
            html = html + "<tr><td>" + place.name + "</td></tr>";
            xreturn[results] = new Object();
            xreturn[results] = [id, place.name];
        } else if (rackId == "all" && shelvId == "all" && type != "all") {
            if (place.type == type) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId == "all" && shelvId != "all" && type == "all") {
            if (place.shelf == shelvId) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId != "all" && shelvId == "all" && type == "all") {
            if (place.rack == rackId) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId == "all" && shelvId != "all" && type != "all") {
            if (place.shelf == shelvId && place.type == type) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId != "all" && shelvId != "all" && type == "all") {
            if (place.shelf == shelvId && place.rack == rackId) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId != "all" && shelvId == "all" && type != "all") {
            if (place.rack == rackId && place.type == type) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        } else if (rackId != "all" && shelvId != "all" && type != "all") {
            if (place.shelf == shelvId && place.rack == rackId && place.type == type) {
                limitzaehler++;
                results++;
                html = html + "<tr><td>" + place.name + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.name];
            }
        }

    });
    html = html + "</table>";
    console.log(results);
    if (exp == "0") {
        if (results > 0) {
            $('#freeplacesausgabe').html(html);
        } else {
            $('#freeplacesausgabe').html("<hr><p style='color: red;'>Keine Lagerorte gefunden.</p>");
        }
    }
    return xreturn;
}

function togglefreielagerorte() {
    $('#freeplacesdialog').dialog("open");
}

function deletefreeplace(id) {
    delete freeplaces[id];
    returnfreeplaces();
}

/**
 * Wenn das dokument ready ist
 */
$(document).ready(function() {

    /**
     * Button "login" -> funktion login();
     */
    $('#submit').click(function() {
        login();
    });
    /**
     * Input "username" bei enter -> funktion login();
     */
    $('#username').bind("keydown", function(e) {
        if (e.keyCode === 13) {
            login();
        }
    });
    /**
     * Input "password" bei enter -> funktion login();
     */
    $('#password').bind("keydown", function(e) {
        if (e.keyCode === 13) {
            login();
        }
    });
    /**
     * Wenn ein Ajax-Request gestartet wird
     * 1. Ladebalken wird eingeblentet
     * 2. accessToken wird geprüft
     */
    $(document).ajaxStart(function() {
        $('#load').fadeIn(100);
        checkaccess();
        /**
         * Wenn ein Ajax-Request beendet wird
         * Ladebalken wird ausgeblentet
         */
    }).ajaxStop(function() {
        $('#load').fadeOut(100);
    });

    /**
     * Wenn ein Lager ausgewählt wird
     */
    $('.warehousecheckbox').change(function() {

        $('.warehousecheckbox').each(function() {
            var checked = 0;
            if ($(this).is(":checked")) {
                checked = 1;

            }
            warehouses[$(this).attr('whid')] = new Object();
            warehouses[$(this).attr('whid')] = checked;
        });

        if ($('.findarticle').is(":disabled") && $('#menu_var').text() == "umbuchen" && $('.locationean').is(":disabled")) {
            $('#load').show();
            setTimeout(function() {
                findPlaces();
            }, 20);
        }
    });

    $('#togglemenu').click(function() {
        var active = $(this).attr("act");
        if (active == "1") {
            $('#freeplacessettings').fadeOut(100);
            $(this).text("Menü einblenden");
            $(this).attr("act", "0");
        } else {
            $('#freeplacessettings').fadeIn(100);
            $(this).text("Menü ausblenden");
            $(this).attr("act", "1");
        }
    });
    /**
     * Menubuttons z.b. Einbuchen oder Umbuchen
     */
    $('.menutip').click(function() {
        window.location = $(this).attr('href');
    });

    /**
     * Definiert Menu/Tab
     */
    $('.menutip[menu=' + $('#menu_var').text() + ']').removeClass("menutip");
});