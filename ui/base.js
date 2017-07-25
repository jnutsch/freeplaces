/**
 * Globale variablen
 */
var warehouses = new Object();
var filledplaces = new Object();
var places = new Object();
var freeplaces = new Object();
var shelves = new Object();
var calced = 0;
/**
 * Funktion die, die Lagerorte eines Artikels findet
 * beachtet werden die LagerCheckboxen
 */
function findPlaces() {
    $('#load').modal('show')
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
            });

        }
    });

    if (warehousesc == 0) {
        $("#lagerorteoutput").html("<div class='find-false'><p>Bitte wählen Sie ein Lager aus.</p></div>");
        $('#load').modal('hide')
    }

}


function exportfreeplaces() {
    $('#load').modal('show');
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
    $('#load').modal('hide')
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

            });

        },

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

function getwarehouses() {
    var html = "";
    $.ajax({
        async: false,
        type: "GET",
        url: "/rest/stockmanagement/warehouses",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        success: function(data) {
            var html = "<select class='form-control' id='freeplaceswarehouses'>";

            $.each(data, function() {
                html = html + "<option value='" + this.id + "'>" + this.name + "</option>"
            });
            html = html + "</select>";
            $('#warehousesselect').html(html);
        },
        error: function(data) {
            console.log(data);
        }
    });
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
    getwarehouses();
    /**
     * Wenn ein Ajax-Request gestartet wird
     */
    $(document).ajaxStart(function() {
        $('#error_body').html("");
        $('#load').modal('show');
    }).ajaxStop(function() {
        $('#load').modal('hide');
    }).ajaxError(function(data) {
        var json = $.parseJSON(data.responseText);
        $('#error_body').append("<div class='find-false'><p>ErrorCode: " + json.error.code + " <br/> Message: " + json.error.message + "</p></div>");
        $('#error_modal').modal('show');
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
            $('#load').modal('show');
            setTimeout(function() {
                findPlaces();
            }, 20);
        }
    });

    $('#togglemenu').click(function() {
        var active = $(this).attr("act");
        if (active == "1") {
            $('#freeplacessettings').fadeOut(100);
            $(this).val("Menü einblenden");
            $(this).attr("act", "0");
        } else {
            $('#freeplacessettings').fadeIn(100);
            $(this).val("Menü ausblenden");
            $(this).attr("act", "1");
        }
    });
    /**
     * Menubuttons z.b. Einbuchen oder Umbuchen
     */
    $('.menutip').click(function() {
        window.location = $(this).attr('href');
    });

    $('.ueberschnitt').click(function() {
        $('.ueberschnittmessage').fadeOut(200);
        $(this).fadeOut(200)
    });
    $('.calcfreeplaces').click(function() {
        getfreeplaces($('#freeplaceswarehouses').val());
    });
    $('.showplaces').click(function() {
        returnfreeplaces();
    });
    $('.export').click(function() {
        exportfreeplaces();
    });

    setInterval(function() {
        var pins = $('#loadingpins').attr("pins");
        switch (pins) {
            case "0":
                $('#loadingpins').text(".");
                $('#loadingpins').attr("pins", "1");
                break;
            case "1":
                $('#loadingpins').text("..");
                $('#loadingpins').attr("pins", "2");
                break;
            case "2":
                $('#loadingpins').text("...");
                $('#loadingpins').attr("pins", "3");
                break;
            case "3":
                $('#loadingpins').text("....");
                $('#loadingpins').attr("pins", "0");
                break;

        }
    }, 500);
});