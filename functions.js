var url = ("controller.php?action=getTableContents&table=");

// function that checks for an error
function error(data) {
    // if the status returned from the controller is 'OK' there is no error
    if (data.status && data.status === "OK") {
        return false;
    }
    else {
        // there is an error
        return true;
    }
}

// function to display the errors in toastr popup boxes
function displayError(data) {
    switch (data.status) {
        case "ERROR":
        // displays the error in a red popup box
            toastr.error('<b>Status ' + data.status + ': </b>' + data.message);
        break;
        // displays the warning in a yellow popup box
        case "WARNING":
            toastr.warning(data.status + ": "+ data.message);
        break;
        default:
        // displays messages that are not errors or warnings but may contain appropriate information
            toastr.info(data.status + ": " + data.message);
    }
}

// function to delete all table markup from the DOM
function clearHTML() {
    // gets the table by its ID using a jQuery selector and calls the remove property
    $('#returnedData').remove();
}

// hide contents of a table
function hideTableSection() {
    // refactored to remove markup
    // on the next version the method calls will go directly to the clearHTML function
    clearHTML();
}

// closes and opened table
function closeTable() {
    // gets a button by its ID using jQuery selector when it is clicked
    $('#closeTable').click(function(){
        // refactored to remove its contents from the DOM. On update this no longer needs to be a function calling another function
        clearHTML();
    });
}

// function for user to change the table
function changeTable() {
    // gets the dropdown value using a jQuery selector when a user changes the dropdown
    $("#dropdown").change(function() {
        var selectedTable = $(this).val();
        // calls the getTableFunction passing the new data as a parameter
        getTableData(selectedTable);
    });
}

// function to refresh table and it's contents
function refreshTable() {
    // gets button by its ID using a jquery Selector when clicked
    $('#refreshTable').click(function(){
        // clears the table
        clearHTML();
        // variable to get the current option in the select list
        var selectedTable = $('#dropdown option:selected').text();
        // passes data back to the getTableData function
        getTableData(selectedTable);
        // clears the text in the search box
        $('#search').val('');
        // notifies the users if this has been successful using a toastr popup
        toastr.success('<b>' + selectedTable + '</b>' + ' table has been refreshed');
    });
}

// function to build the initial select list
// Todo, this needs renaming
function buildSelectList() {
    // GET HTTP request to the controller->action getTables
    $.getJSON("controller.php?action=getTables", function(result) {
        // if there is no error
        if (!error(result)) {
            // generate a success message in a toastr success popup
            toastr.success('<b>Status ' + result.status + ": </b>" + result.numOfRows + " tables listed successfully");
            // store the selected object in a variable
            var select = $('#dropdown');
            // iterate though the dropdown
            $.each(result.data.tables, function(key, val) {
                // add each option to the select list
                $(select)
                    .append($("<option></option>")
                    .attr("value", val)
                    .text(val));
            });
        }
        else {
            // displays error if failed
            displayError(result);
        }
    });
}

// function to build the select list for the columns in chosen table
function buildColumnSelectList(columns) {
    // selector for the select list
    $("#columns")
       .find('option')
       .remove()
       .end();
       // iterate through the columns and generate the required markup
     $.each(columns, function(index, value){
       $('#columns').append($("<option></option>")
                             .attr("value",value)
                             .text(value));
     });
}


// gets data and builds the table
function getTableData(table) {
    $('#searchTable').fadeIn();
    // HTTP get request passing the table name into the action
    $.getJSON(url + table, function(result){
        // if there is no error
        if(!error(result)) {
            // check if there is data returned
            // delete all previous markup (the page is truely dynamic)
            clearHTML();
            // checks the number of rows from the JSONSchema class
            if(result.numOfRows > 0) {
                // start building the table html
                 html = '<table id="returnedData" class="table table-striped table-bordered"> <thead> <tr>';

                 // init empty array for columns
                 var columnArray = [];

                 // loop through each column in the row and build table header
                 $.each(result.data[0], function(column) {
                     // markup for table head
                     html = html + '<th>' +  column + '</th>';
                     // push the column into the array
                     columnArray.push(column);
                 });
                 // builds the select dropdown for the columns by passing in the columnArray as a parameter
                 buildColumnSelectList(columnArray);
                 // end table header
                 html = html + '</tr> </thead>';

                 // loop through each row in the table
                 $.each(result.data, function(index, row){
                     // build a new row for each index
                     html = html + '<tr>';

                     // loop through each column in row
                     $.each(row, function(item, value){
                        html = html + '<td>' + value + '</td>';
                     });
                     // end the row
                     html = html + '</tr>';
                 });

                 // close the table
                 html = html + '</table>';
                 $('#tableSection .container .panel-body').after(html);
            }
            else if (result.numOfRows < 1) {
                $.getJSON('controller.php?action=getColumnsInTable&table=' + table, function(result){
                    html = '<table id="returnedData" class="table table-striped table-bordered"> <thead> <tr>';
                    var columnArray = [];
                    $.each(result.data.columns, function(index, colName) {
                        html = html + '<th>' +  colName + '</th>';
                        columnArray.push(colName);
                    });
                    buildColumnSelectList(columnArray);
                    html = html + '</tr></thread>';
                    html = html + '<tbody><tr><td></td></tr></tbody>'
                    html = html + '</table>';
                    $('#tableSection .container .panel-body').after(html);
                });
            }
        }

        else {
            clearHTML();
            $('#searchTable').fadeOut();
            toastr.info('Table not selected');
        }
    });
}

// function to dymanically search through table
function searchTable(table, column, value) {
    // log the url builder into the console for dev pupropses
    console.log("controller.php?action=searchTable&table=" + table + "&column=" + column + "&value=" + value);
    // passes the built URL (controll->action) into the GET HTTP request
    $.getJSON("controller.php?action=searchTable&table=" + table + "&column=" + column + "&value=" + value, function(result){
        if(!error(result)) {
            clearHTML();
            // start building the table html
             html = '<table id="returnedData" class="table table-striped table-bordered "> <thead> <tr>';

             // loop through each column in the row and build table header
             $.each(result.data[0], function(column, columnsInRow) {
                html = html + '<th>' +  column + '</th>';
             });

             // end table header
             html = html + '</tr> </thead>';
             html = html + '<tbody>';

             // loop through each row in the table
             $.each(result.data, function(index, row){
                 // build a new row for each index
                 html = html + '<tr>';

                 // loop through each column in row
                 $.each(row, function(item, value){
                    html = html + '<td>' + value + '</td>';
                 });
                 // end the row
                 html = html + '</tr>';
             });

             // close the table
             html = html + '</tbody></table>';
        $('#tableSection .container .panel-body').after(html);
        }
    });
}

// add dynamic row for user to input data
function newRow() {
    // get the number of columns in current table
    var numberOfColumns = $('#columns > option').length;
    var html = '<tr class="newDataRow info"><td><button id="saveRow" class="btn btn-success btn-sm"><span class="glyphicon glyphicon-ok"></span></button> <br /> <br /> <button id="cancel" class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-remove"></span></button></td>';
    // first column will not need an input box as the field is auto incremented
    $('#returnedData tbody tr:first').before(html);

    // loop to add additional columns to capture data started at the next point
    for (var i = 1; i < numberOfColumns; i++) {
        var currentColumn = $('#columns option').eq(i).val();
        $('#returnedData tbody .newDataRow').append('<td style="vertical-align:middle"><input attribute="' + currentColumn + '"placeholder="' + currentColumn + '"type="text" class="form-control" /></td>');
    }
}
// function to save data entered by user
function saveUserInput() {
    // build URL (controller->action) + (tablename selected in dropdown select list)
    var saveQuery = 'controller.php?action=addRow&table=' + $('#dropdown :selected').val();
    // itterate through each text box assigning it the correct attribute
    $('.newDataRow input[type="text"]').each(function(){
        saveQuery += "&" + $(this).attr('attribute') + "=" + $(this).val();
    });

    // generate a log to see the URL builder. This would be removed after production
    console.log(saveQuery);

    // jQuery's ajax function
    $.ajax({
        // passes the saveQuery variable to the url parameter
        url: saveQuery,
        // ajax success method
        success: function() {
            // success message for user in toastr popup box
            toastr.success('Record added to table');
        },
        // ajax error method
        error: function() {
            // error message for user in toastr popup box
            toastr.error('Unable to save data to database');
        }
    });
}

// when a variable changes in the search box (defined by its jQuery select #search)
$('#search').on('input', function(){
    // deletes the table contents (to stop duplicated markup)
    clearHTML();
    // gets value of text in dropdown, value of text in columns drop down, and gets the value of text in the searchbox
    // and passes these back as parameters to the searchTable function
    searchTable($('#dropdown :selected').val(),$('#columns :selected').val(),$(this).val());
});

// detects a click event on the add row button
$('#addRow').click(function(){
    // calls the method to add a new row
    newRow();
});

// document on click to bind event handler to dynamically created button
$(document).on("click", "#saveRow", function(){
    saveUserInput();
});

$('#searchTable').hide();
