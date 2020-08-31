(function( $ ){
 
	//read css properties
	getStyle=function(CLASSname, properties) {
		var styleSheets = this.document.styleSheets;
		var styleSheetsLength = styleSheets.length;
		for(var i = 0; i < styleSheetsLength; i++){
			if (styleSheets[i].rules ) { var classes = styleSheets[i].rules; }
			else { 
				try {  if(!styleSheets[i].cssRules) {continue;} } 
				//Note that SecurityError exception is specific to Firefox.
				catch(e) { if(e.name == 'SecurityError') { console.log("SecurityError. Cant readd: "+ styleSheets[i].href);  continue; }}
				var classes = styleSheets[i].cssRules ;
			}
			for (var x = 0; x < classes.length; x++) {
				if (classes[x].selectorText == CLASSname) {
					var ret = (classes[x].cssText) ? classes[x].cssText : classes[x].style.cssText ;
					if(ret.indexOf(classes[x].selectorText) == -1){ret = classes[x].selectorText + "{" + ret + "}";}
					if (properties == null)
						return ret;
					ret = ret.substr(ret.indexOf(properties));
					ret = ret.substr(ret.indexOf(":")+1);
					ret = ret.substr(0, ret.indexOf(";")); 
					ret = ret.trim();
					return ret;
				}
			}
		}
	}
	
	//random number between min and max
	randomIntFromInterval=function(min,max){
		return Math.floor(Math.random()*(max-min+1)+min);
	}
	
	//columns of the table
	var columnCount = 0;
	//rows of the table
    var rowCount =0;
	//current user selected cells
	var selectedCells = $( [] );
	//IDs of current user selected cells
	var selectedCellsId = $( [] );
	//IDs of same background color cells next by current user selected cells
	var nextBySelectedCellsId = new Set();
	//the default colors
	var selectedBackgroundColor = getStyle('table.chocolateBar td.selected', 'background-color').replace(/ /g,''); //remove blank characters;
	var borderColor = getStyle('table.chocolateBar td', 'border-color').replace(/ /g,'');
    //flag to end game
	var isEndGame = false;
	//message when the game is ended
	var endGameMsg = "";
	
    //the controller for the game.
    function ChocolateBar( selector, column, row){
        var self = this;
        this.table = $( selector );
        columnCount = (column || 4);
        rowCount = (row || 6);
        
        // Bind the click handler for the table. This way, we
        // don't have to attach event handlers to each cell.
        this.table.click(
            function( event ){
                // Pass off to the table click handler.
                self.onClick( event );
 
                // Cancel default event.
                return( false );
            }
        );
    };
 
	//button visual controller
	ChocolateBar.prototype.enableCutBtn = function(){
        $("#cutBtn").removeClass("ui-disabled");
    };
	
	//button visual controller
	ChocolateBar.prototype.disableCutBtn = function(){
       $("#cutBtn").addClass("ui-disabled");
    };
	
	// build the actual markup of the table using the
    // given number of columns and rows.
    ChocolateBar.prototype.buildTable = function(rowCount, columnCount){
		var tableHtml = "";
		var cellId=1;
		for (rowIndex=1; rowIndex<=rowCount; rowIndex++) {
			tableHtml += "<tr>";
			for (colIndex=1; colIndex<=columnCount; colIndex++) {
				tableHtml += "<td id=\"" + cellId++ + "\"></td>"; //each cell has its ID
			} 
			tableHtml += "</tr>";
		}
        // Set the HTML of the table to fill it out.
        this.table.html( tableHtml );		
    };
 
	
    // check to see if an end-game has been reached
    ChocolateBar.prototype.checkEndGame = function(){
        //Check if there is only one cell selected
		if (selectedCellsId.length == 1) { // the current player loses as he takes the smallest square
			// Set the message.
			if ($( "#playerTurn" ).text() == (document.getElementById('playerA').value + " Turn"))
				endGameMsg = document.getElementById('playerA').value  + " LOSES !";
			else
				endGameMsg = document.getElementById('playerB').value  + " LOSES !";
           
            // Flag the end game.
            isEndGame = true;
		}
        else {
			//check for no more cut possibilities
			isEndGame = true;
			this.cells.each(
				function( index, node ){
					var cell = $( this );
					var count = 1;
					//count for the near cells having the same background color: same piece
					cell.data( "near" ).each(
						function( indexNear, nodeNear ){
							var cellNear = $( this );
							if (cellNear.data("color") == cell.data("color")) {
								count = count + 1;
							}
						}
					);		
					
					if (count > 2) { //there is a piece that could be cut into smaller pieces
						isEndGame = false;
						return false;
					}
				}
			);
			if (isEndGame) { //no more cut possibilities, the current player wins
				// Set the message.
				if ($( "#playerTurn" ).text() == (document.getElementById('playerA').value + " Turn"))
					endGameMsg = document.getElementById('playerA').value  + " WINS !";
				else
					endGameMsg = document.getElementById('playerB').value  + " WINS !";
			}
		}
        
    };
 
	
    // initialize the table.
    ChocolateBar.prototype.initTable = function(){		
		
        var self = this;
 
		//clear table data;
		this.table.empty();
		
        // build out the HTML for the table.
        this.buildTable(rowCount, columnCount);
		
        // Gather the cells of the table.
        this.cells = this.table.find( "td" ); 
		
        // For each cell, keep a collection of the cells
        // that are near this cell.
        this.cells.each(
            function( index, cellNode ){
                var cell = $( this ); 
                // Store the near cells.
                cell.data( "near", cell.near() );
				//keep a current background color
                cell.data( "color", cell.css("background-color"));
            }
        );		
    };
 
	
    // handle the clicks at the table level.
    ChocolateBar.prototype.onClick = function( event ){
	
		//If the game is ended, no more action
		if (isEndGame)
			return;
		
		//enable the button
		this.enableCutBtn();
		
		// Get the trigger(cell) for the event.
        var target = $( event.target );
		var targetId = target.attr('id')
		if ($.inArray(targetId, selectedCellsId) == -1) {//update cell only if the target is not selected yet
			target.css("background-color", selectedBackgroundColor);
			if (nextBySelectedCellsId.has(targetId) == false) { //target is not in the next-by-celles
				//reset the selected cells
				selectedCells.each(
					function( index, node ){
						//reset cell color
						var cell = $( this );
						cell.css("background-color", cell.data("color"));
					}
				);
				selectedCells = $( [] );
				selectedCellsId = $( [] );
			}
			//add the target to the selectedCells
			selectedCells = selectedCells.add(target);	
			selectedCellsId.push(targetId);			
			
			//update nextBySelectedCells by near same background color cells            
			if (nextBySelectedCellsId.has(targetId) == false) { //target is not in the next-by-celles
				nextBySelectedCellsId = new Set();				
			}
			else { //target is in the next-by-celles
				//remove the target from the list
				nextBySelectedCellsId.delete(targetId);
			}		
            
			//update next-by-celles list by adding target unselected-same-background-near celles
			target.data( "near" ).each(
				function( index, node ){
					var cell = $( this );
					if (cell.data("color") == target.data("color")) {
						if ($.inArray(cell.attr('id'), selectedCellsId) == -1) { //not selected yet							
							nextBySelectedCellsId.add(cell.attr('id'));
						}
					}
				}
			);		
			//if nextBySelectedCellsId is null: we select the whole (already-taken) piece: reset to one cells selected=target
			if (nextBySelectedCellsId.size == 0) {
                //reset the selectedCells
				selectedCells.each(
					function( index, node ){
						//reset cell color
						var cell = $( this );
						cell.css("background-color", cell.data("color"));
					}
				);
                target.css("background-color", selectedBackgroundColor);
				selectedCells = $( [] );
				selectedCellsId = $( [] );
				//add the target to the selectedCells
				selectedCells = selectedCells.add(target);	
				selectedCellsId.push(targetId);		
				//update next-by-celles list by adding target unselected-same-background-near celles
				target.data( "near" ).each(
					function( index, node ){
						var cell = $( this );
						if (cell.data("color") == target.data("color")) {
							nextBySelectedCellsId.add(cell.attr('id'));
						}
					}
				);						
			}
		}
        
    };
 
	ChocolateBar.prototype.end = function(){	
        $('[data-role=dialog]').dialog( "close" );
        $('#playerTurn').html(endGameMsg);
    };  
	
    //restart the game.
    ChocolateBar.prototype.restart = function(){
        // Re-initialize the variables
		selectedCells = $( [] );
		selectedCellsId = $( [] );
		nextBySelectedCellsId = new Set();
		isEndGame = false;
		endGameMsg = "";
		
		//re-initialize table
		this.initTable();
		
		//disable the button
		this.disableCutBtn();
		
		//update header text
		if ($('input[name=firstPlayer]:checked').val() == 'aFirst') {
			$('#playerTurn').html(document.getElementById('playerA').value + " Turn");
		}
		else {
			$('#playerTurn').html(document.getElementById('playerB').value + " Turn");
		}		
    };
	
	//cut chocolate bar
	ChocolateBar.prototype.cut = function(){	
		//if the game is ended, no more actions
		if (isEndGame)
			return;
		
		//update taken piece background color		
		var red = randomIntFromInterval(0, 255);
		var green = randomIntFromInterval(0, 255);
		var blue = randomIntFromInterval(0, 255);
		var rgbStr = "rgb(" + red + "," + green + "," + blue + ")";
		while (rgbStr == selectedBackgroundColor || rgbStr == borderColor) { //the new background color is different from default selected color and the table border color
			red = randomIntFromInterval(0, 255);
			green = randomIntFromInterval(0, 255);
			blue = randomIntFromInterval(0, 255);
			rgbStr = "rgb(" + red + "," + green + "," + blue + ")";
		}
		selectedCells.each(
			function( index, node ){
				var cell = $( this );				
				//update cell background color GUI
				cell.css("background-color", rgbStr);
				//update cell background color data
				cell.data("color", rgbStr);
			}
		);
					
		
		//check for end game condition
        this.checkEndGame();
		
		if (isEndGame) {
			$("#msgConfirm").html(endGameMsg);
			$("#linkConfirDlg").click();	
        }
        else {
            //update the player turn
			if ($( "#playerTurn" ).text() == (document.getElementById('playerA').value + " Turn"))
				$('#playerTurn').html(document.getElementById('playerB').value + " Turn");			
			else
				$('#playerTurn').html(document.getElementById('playerA').value + " Turn");			
				
			//reset user selected cells
			selectedCells = $( [] );
			selectedCellsId = $( [] );
			nextBySelectedCellsId = new Set();
        }
		
		//after cut, disable the button
		this.disableCutBtn();	
    };
 
 
	//return near cells (4 or 8 directions): here only 4 is return: Left, Right, Above, Below
	$.fn.near = function(){
        var nearNodes = $( [] );
        var currentCell = $( this );
        var currentRow = currentCell.parent( "tr" );
        var tbody = currentRow.parent();
        var prevRow = currentRow.prev();
        var nextRow = currentRow.next();
        var currentCellIndex = currentRow.find( "td" ).index( currentCell );
 
        // Check to see if there is a previous row.
        if (prevRow.size()){
 
            // Grab the cell just above the current cell.
            var prevRowCell = prevRow.find( "td:eq(" + currentCellIndex + ")" );
 
            // Add the top 3 near cells to the collection that
            // we are going to return.
            nearNodes = nearNodes
                //.add( prevRowCell.prev() )
                .add( prevRowCell)
                //.add( prevRowCell.next() )
            ;
 
        }
 
        // Add the left / right near cells to the collection
        // that we are going to return.
        nearNodes = nearNodes
            .add( currentCell.prev() )
            .add( currentCell.next() )
        ;
 
        // Check to see if there is a next row.
        if (nextRow.size()){
 
            // Grab the cell just below the current cell.
            var nextRowCell = nextRow.find( "td:eq(" + currentCellIndex + ")" );
 
            // Add the bottom 3 near cells to the collection that
            // we are going to return.
            nearNodes = nearNodes
                //.add( nextRowCell.prev() )
                .add( nextRowCell )
                //.add( nextRowCell.next() )
            ;
 
        }
 
        // Return the collection of near cells.
        return( nearNodes );
    }
 
    // ------------------------------------------------------ //
    // ------------------------------------------------------ //
 
 
    // Store the game class in the window scope so
    // that people can reach it ouside of this bubble.
    window.ChocolateBar = ChocolateBar;
 
})( jQuery );