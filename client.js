$('[data-toggle="tooltip"]').tooltip()


$.getScript("functions.js", function(data, textStatus, jqxhr){
    // console.log( data ); // Data returned
    // console.log( textStatus ); // Success
    // console.log( jqxhr.status ); // 200
    console.log( "functions.js has been loaded into the client." );
    hideTableSection();
    clearHTML();
    buildSelectList();
    changeTable();
    closeTable();
    refreshTable();
});
