/**
 * Globale variablen
 */
var warehouses = new Object();
var filledplaces = new Object();
var places = new Object();
var freeplaces = new Object();
var shelves = new Object();
var calced = 0;
var userId = 0;

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
    $.each(returnfreeplaces("2"), function(key, place) {
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

function generatePdf(){
  var doc = new jsPDF('p', 'pt');
  var columns = ["StorageLocationId", "StorageLocationName"];
  var rows = [];
  var x = 0;
  var pg = 1;
  $.each(returnfreeplaces(2), function(){
  	rows[x] = this;
  	x++;
  });
  doc.autoTable(columns, rows, {
    theme: "striped",
    bodyStyles: {
      lineColor: 1,
      lineWidth: 1
    },
    headerStyles: {
      lineColor: 1,
      lineWidth: 1,
      fillColor: 1,
      textColor: 500
    }
  });


  doc.save('FreePlaces.pdf');
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
            var page = 1;
            var isLastPage = true;
            $.ajax({
                type: "GET",
                url: "/rest/warehouses/"+warehouseId+"/locations",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("accessToken")
                },
                data: {
                    itemsPerPage: "100",
                    page: page
                },
                success: function(data) {
                    


                    
                    $.each(data.entries, function() {
                        places[this.id] = new Object();
                        places[this.id] = this;
                    });
                    $.each(places, function(id, place) {
                        if (typeof(filledplaces[id]) != "undefined") {} else {
                            freeplaces[id] = new Object();
                            freeplaces[id] = place;
                        }
                    });
                    isLastPage = data.isLastPage
                    
                    while(isLastPage === false)
                    {
                        page++;
                        $.ajax({
                            type: "GET",
                            url: "/rest/warehouses/"+warehouseId+"/locations",
                            async: false,
                            headers: {
                                "Authorization": "Bearer " + localStorage.getItem("accessToken")
                            },
                            data: {
                                itemsPerPage: "100",
                                page: page
                            },
                            success: function(datax) {
                                
            
            
                                
                                $.each(datax.entries, function() {
                                    places[this.id] = new Object();
                                    places[this.id] = this;
                                });
            
                                $.each(places, function(id, place) {
                                    if (typeof(filledplaces[id]) != "undefined") {} else {
                                        freeplaces[id] = new Object();
                                        freeplaces[id] = place;
                                    }
                                });
            
                                isLastPage = datax.isLastPage;

                                if(page == datax.lastPageNumber)
                                {
                                    isLastPage = true;
                                }

                            },
            
                        });

                    }
                },

            });
            
        },

    });
    
    $('.showplaces').removeAttr("disabled");
    $('.export').removeAttr("disabled");
    $('.pdf').removeAttr("disabled");
}

function changeregal(id) {
    var html = "<select id='shelvselects' ><option value='all'>Alle</option>";
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
            var html = "<select id='freeplaceswarehouses'>";

            $.each(data, function() {
                html = html + "<option value='" + this.id + "'>" + this.name + "</option>"
            });
            html = html + "</select>";
            $('#warehousesselect').html(html);
        },
        error: function(data) {}
    });

}

function getuser() {
    $.ajax({
        async: false,
        type: "GET",
        url: "/rest/authorized_user",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("accessToken")
        },
        success: function(data) {
            userId = data.userId;
        },
        error: function(data) {}
    });
}

function returnfreeplaces(exp = "0") {
    if (Object.keys(places).length > 0) {
        var limit = $('#freeplaceslimit').val();
        var type = $('#freeplacestype').val();
        var rackId = $('#freeplacesracks').val();
        var shelvId = $('#shelvselects').val();
        var limitzaehler = 0;
        var results = 0;
        var html = "<table class='table table-striped table-bordered'><th>storageLocationId</th><th>storageLocationName</th>";
        var xreturn = new Object();
        $.each(freeplaces, function(id, place) {
            if (limitzaehler == limit) {
                return false;
            }

            if(type == "all")
            {
                results++;
                limitzaehler++;
                html = html + "<tr><td>" + id + "</td><td>" + place.label + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.label];
            }
            else if(type == place.type)
            {
                results++;
                limitzaehler++;
                html = html + "<tr><td>" + id + "</td><td>" + place.label + "</td></tr>";
                xreturn[results] = new Object();
                xreturn[results] = [id, place.label];    
            }
        });
        html = html + "</table>";
        if (exp == "0") {
            if (results > 0) {
                $('#freeplacesausgabe').html(html);
            } else {
                $('#freeplacesausgabe').html("<hr><p style='color: red;'>Keine Lagerorte gefunden.</p>");
            }
        }
        if(exp == "1")
        {
          html = html.replace("<table", "<table style='border-spacing: 2px !important;' ");
          html = html.replace("<td", "<td style='padding: 2px;' ");
          return html;
        }
        return xreturn;
    } else {
        alert("Bitte berechnen Sie zuerst Ihre freien Lagerorte");
    }
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
    $('.pdf').click( function(){
        generatePdf();
    });


    setTimeout(function() {
        $('.ueberschnittmessage').fadeOut(250);
    }, 7500);

    setTimeout(function() {
        $('.updatemessage').fadeOut(250);
    }, 15000);
});
