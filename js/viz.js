/*
Encasulates all the code for the visualization 
Returns a chart function object
*/

var scrollVis  = function() {
    // constants to define the size
    // and margins of the vis area.
    var width = 1500;
    var height = 500;
    var margin = {'left': 40, 'right': 40, 'bottom': 40, 'top':40};
    //RIGHT_SHIFT = how much should the elements in viz be shifted right
    var RIGHT_SHIFT= 250;
    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    //the autonomy scores by day of week
    var autoScores = [{'day': 'sunday', 'score':0.686},
						  {'day': 'monday', 'score':0.677},
						  {'day': 'tuesday', 'score': 0.734},
						  {'day': 'wednesday', 'score': 0.723},
						  {'day': 'thursday', 'score': 0.477},
						  {'day': 'friday', 'score': 0.483},
                          {'day': 'saturday', 'score': 0.556}];
    
    //importance data
    var impData = [
            {numImp: 0, numNotImp:25},
            {numImp: 5, numNotImp: 28},
            {numImp:4 , numNotImp: 22},
            {numImp:2 , numNotImp:20},
            {numImp:3 , numNotImp: 29},
            {numImp: 4, numNotImp: 39},
            {numImp:1 , numNotImp: 25}
        ];
    //main svg being used for visualization
    var svg = null;
    //d3 selection that will be used for displaying visualizations
    var g = null;


    //horizontal linear scale to map data to canvas
    var xScale = d3.scaleLinear().range([0, width]);

    
    //global time stuff
    var timeFormatter = d3.timeFormat('%H:%M');
    var timeParser = d3.timeParse('%H:%M');
    var tScale = d3.scaleTime()
                   .domain([timeParser('08:00'), timeParser('23:59')])
                   .range([margin.left, 0.75*width]);

    tScale.ticks(d3.timeMinute.every(15));

    //pScale domain will be set in setupViz()
    var pScale = d3.scaleLinear()
    .range([margin.top + 150, margin.top + 150 - 55]);

    //nScale domain will be set in setupViz()
    var nScale = d3.scaleLinear()
    .range([height - margin.bottom, (height - margin.bottom) - 55]);


    //horizontal day scaler for the line chart
    var dayScaler = d3.scaleBand().domain(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])
                                         .range([margin.left, width - margin.right - width/5]);
    //vertical scaler for the line chart                                     
    var lineScaler = d3.scaleLinear().domain([0.40,0.734]).range([height/2, margin.top]);

    //Set up scales for the bar chart
    var xScalerBar = d3.scaleBand()
    .domain(d3.range(7))
    .range([margin.left, 0.75* width])
    .paddingInner(0.05);
    
    //add yScaler for bar chart
    var yScalerBar = d3.scaleLinear()
    .domain([0,				
        d3.max(impData, function(d) {
                return d.numNotImp + d.numImp;
            })
        ])
        .range([height/2 , margin.top]);  // <-- Flipped vertical scale
    

        
    //Easy colors accessible via a 10-step ordinal scale
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    //xScaler for histogram, domain will be set in setupViz()
    var xScalerHist = d3.scaleLinear()
    .range([margin.left, width - margin.right]);
    //yScaler for histogram. domain will be set in the setupViz()
    var yScalerHist = d3.scaleLinear()
      .range([height/2, margin.top]);


    //blockCount init   	
	var blockCount = {
        '08:00':0,'08:10': 0, '08:20': 0,'08:30':0, '08:40':0, '08:50':0,'09:00':0,'09:10': 0,'09:20': 0,'09:30':0,'09:40':0,
		'09:50':0,'10:00':0,'10:10': 0,'10:20': 0,'10:30':0,'10:40':0,'10:50':0,'11:00':0,'11:10': 0,'11:20': 0,'11:30':0,
		'11:40':0,'11:50':0,'12:00':0,'12:10': 0,'12:20': 0,'12:30':0,'12:40':0,'12:50':0,'13:00':0,'13:10': 0,'13:20': 0,
		'13:30':0,'13:40':0,'13:50':0,'14:00':0,'14:10': 0,'14:20': 0,'14:30':0,'14:40':0,'14:50':0,'15:00':0,
		'15:10': 0,'15:20': 0,'15:30':0,'15:40':0,'15:50':0,'16:00':0,'16:10': 0,'16:20': 0,'16:30':0,'16:40':0,'16:50':0,'17:00':0,
		'17:10': 0,'17:20': 0,'17:30':0,'17:40':0,'17:50':0,'18:00':0,'18:10': 0,'18:20': 0,'18:30':0,'18:40':0,'18:50':0,'19:00':0,
		'19:10': 0,'19:20': 0,'19:30':0,'19:40':0,'19:50':0,'20:00':0,'20:10': 0,'20:20': 0,'20:30':0,'20:40':0,'20:50':0,
		'21:00':0,'21:10': 0,'21:20': 0,'21:30':0,'21:40':0,'21:50':0,'22:00':0,'22:10': 0,'22:20': 0,'22:30':0,'22:40':0,'22:50':0,
        '23:00':0,'23:10': 0,'23:20': 0,'23:30':0,'23:40':0,'23:50':0,
    };

    //icons locations
	var icons = {
        'instagram': '../images/instagram.png',
        'facebook': '../images/facebook.png',
        'gmail': '../images/gmail2.png',
        'slack': '../images/slack3.png',
        'whatsapp': '../images/whatsapp.png',
        'messenger': '../images/messenger.png',
        'hinge': '../images/hinge.png',
        'reddit': '../images/reddit.png',
        'duolingo': '../images/duolingo.png',
        'linkedin': '../images/linkedin.png',
        'botim': '../images/botim.png',
        'spotify': '../images/spotify.png',
        'messaging': '../images/messaging.png'
    };

    
    
    //chart is part of scrollVis() closure
    var chart = function(selection, dList) {
        selection.each(function(){
            
            //sets svg in closure
            svg = d3.select(this).append('svg').attr('height', height + margin.top + margin.bottom).attr('width', width + margin.left + margin.right);
            svg.append('g');
            //sets g in closure
            g = svg.select('g').attr('transform', 'translate(' + margin.left + ','+ margin.top + ')');
            
            //transform the data

            //chart function returns nothing, only calls setupVis, setupSections
            setupVis(dList);
            setupSections();

        });
        
    }
   /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   */
    var setupVis = function(dl) {
        var calData = dl[0];
        var intData = dl[1];
        var aptData = dl[2];
        var pnData = dl[3];
        //setupVis returns nothing
        dayList = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        //initiate a time axis             
        var timeAxis = d3.axisBottom().scale(tScale).ticks(24).tickFormat(timeFormatter).tickSize(-75).ticks(16);
        var yAxis_p = d3.axisLeft().scale(pScale).ticks(5);
        //PART I OF VISUALIZATION
        //create a calendar for each day in the dayList
        for (i=0; i < dayList.length;i++) {
            //get day from dayList
            day = dayList[i];
            
            //filter the rawData
            var dayData = filterCalendar(calData, day);

            //add the calendar for the selected day
            var calendarG = g.append('g').attr('class', day + 'Calendar').attr('opacity', 0);
            //shifting the calendar right to avoid overlapping with narrative (sections)
            calendarG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');
            

            //add the rects for the calendar
            calendarG.selectAll('rect')
                .data(dayData)
                .enter()
				.filter(function(d){
                    return timeParser(d.time) >= timeParser('8:00'); 
                    })
                .append('rect')
                .attr('x', function(d,i) {
						return tScale(timeParser(d.time)) ; 
					})
				.attr('y', height/2 - 75)
				.attr('width', 68)
				.attr('height', 75)
				.attr('fill', function(d) {
                    return 'blue';
                    })
                .attr('opacity', 0.3);
                
            //translate the time axis 
            calendarG.append('g')
            .attr('transform', 'translate(0,'+ (height/2) + ')')
            .call(timeAxis);
        
            //add the activity text
            calendarG.selectAll('.activityText')
            .data(dayData)
            .enter()
            .filter(function(d){
                return timeParser(d.time) >= timeParser('8:00'); 
            })
            .append('text')
            .attr('x', function(d,i) {
                return tScale(timeParser(d.time)) + 10;
            })
            .attr('y', height/2 - 65)  
            .text(function(d) {
                        return d.activity;
                })
            .attr('class', 'activityText')
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr('fill', 'white');

            //add subtitle for calendar
            calendarG
            .append('text')
            .attr('class', 'subtitle')
            .text(day.toUpperCase() + "'S SCHEDULE")
            .attr('x', 1/3*width)
            .attr('y', 1/4*height);
            
            
            
            //add the interruptions to the calendar
            initBlockCount();
            var intG = g.append('g').attr('class', day + 'Interruptions').attr('opacity', 0);
            //shifting the interruptions right to avoid overlapping with narrative (sections)
            intG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');

            var dayInt = filterInt(intData, day);
            
            intG.selectAll('image')
            .data(dayInt)
            .enter()
            .append('image')
            .attr('xlink:href', function(d){
                var app = d.app;
                return icons[d.app];
            })
            .attr('width', 14)
            .attr('height', 14)
            .attr('x', function(d) {
                var t = d.time;
                var rt = timeRounder(t);
                return tScale(timeParser(rt));
            })
            .attr('y', function(d) {
                var baseline = height/2 - 15;
                var xtime = timeRounder(d.time);
                var numBlocks = blockCount[xtime];
                blockCount[xtime] = blockCount[xtime] + 1;

                return baseline - numBlocks*15;
            });

            //add the pickups graph
            //pickup elements for each day will be drawn in pickupG
            var pickupG = g.append('g').attr('class', day + "Pickups").attr('opacity', 0);
            //shifting the pickups right to avoid overlapping with narrative (sections)
            pickupG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');
            
            var dayPickupNotif = filterPickupNotif(pnData, day);

             //first set the domain for the pscale we will use (defined in scrollVis closure)
            pScale.domain([
                d3.min(dayPickupNotif, function(d) {return d.pickups;}),
                d3.max(dayPickupNotif, function(d) {return d.pickups;})
                ]);
            
            // create a y-axis generator for the pickup chart
            var yAxis_p = d3.axisLeft().scale(pScale).ticks(5);
            
            //get the area plot generator
            var area_p = d3.area()
							.x(function(d,i) {
								var t = timeParser(d.time);
								t.setHours(t.getHours() + 1);
								return tScale(t);
							})	
							.y0(function() {
								return pScale.range()[0];
							})
							.y1(function(d) {
								var p = d.pickups;
								return pScale(p);
							});

			pickupG.append('path')
				.datum(dayPickupNotif)
                .attr('d', area_p)
                .attr('class', 'pArea');
				
            pickupG.append('g')
                .attr('transform', 'translate(0,' + (margin.top + 150) + ')')
				.call(timeAxis);
				
			pickupG.append('g')
				.attr('transform', 'translate(' + margin.left + ',0)')
                .call(yAxis_p);
                
            //add a subtitle for the pickup graph
            pickupG
            .append('text')
            .attr('class', 'subtitle')
            .text("Number of Phone Pickups")
            .attr('x', 1/3*width)
            .attr('y', margin.top);

                
            //add the notif area plot
            //all notif elements will be drawn in notifG
            var notifG = g.append('g').attr('class', day + 'Notifs').attr('opacity', 0);
            //shifting the notification graph right to avoid overlapping with narrative (sections)
            notifG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');

            //set nScale domain
            nScale.domain([
                d3.min(dayPickupNotif, function(d) { return d.notifs;}) ,
                d3.max(dayPickupNotif, function(d) { return d.notifs;})
            ]);
            
			var yAxis_n = d3.axisLeft().scale(nScale).ticks(5);
				
			var area_n = d3.area()
							.x(function(d,i) {
								var t = timeParser(d.time);
								t.setHours(t.getHours() + 1);
								return tScale(t);
							})	
							.y0(function() {
								return nScale.range()[0];
							})
							.y1(function(d) {
								var n = d.notifs;
								return nScale(n);
							});
				
				
			notifG.append('path')
				.datum(dayPickupNotif)
                .attr('d', area_n)
                .attr('class', 'nArea');
				
				
			notifG.append('g')
				.attr('transform', 'translate(' + 0 + ','+ (height - margin.bottom) + ')')
				.call(timeAxis);

			notifG.append('g')
				.attr('transform', 'translate(' + margin.left + ','+ 0 + ')')
                .call(yAxis_n);
            
            notifG
            .append('text')
            .attr('class', 'subtitle')
            .text("Number of Phone Notifications")
            .attr('x', 1/3*width)
            .attr('y', 2/3*height);
        }
        //PART II of VISUALIZATION
        //ADD THE LINE CHART FOR AUTONOMY SCORES
        //score axis for autonomy scores 
        var scoreAxis = d3.axisLeft().scale(lineScaler);
        
        //day axis common to line chart and bar chart
        var dayAxis = d3.axisBottom().scale(dayScaler);
        
        //line generator
        var line = d3.line().x(function(d) {
            return dayScaler(d.day);
        }).y(function(d) {
            return lineScaler(d.score);
        });
        //we will be drawing all our line chart elements to autoLineChart group
        var autoLineG = g.append('g').attr('class', 'autoLineChart').attr('opacity', 0);
        //shifting the line chart right to avoid overlapping with narrative (sections)
        autoLineG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');

        //first add the axes
        autoLineG.append('g').call(dayAxis).attr('transform', 'translate('+ (margin.left-20) + ',' + (height/2) + ')');
        autoLineG.append('g').call(scoreAxis).attr('transform', 'translate(' + (margin.left + 10) + ',' + '0)');

        //now add the actual lines in a path element
        autoLineG.append('path')
        .datum(autoScores)
        .attr('fill', 'none')
        .attr('stroke', 'tomato')
        .attr('stroke-width', 4)
        .attr('d',line)
        .attr('transform', 'translate(120,0)');

        //also add points to the line chart
        autoLineG.append('g')
        .selectAll('circle')
        .data(autoScores)
        .enter()
        .append('circle')
        .attr('cx', function(d) {
            return dayScaler(d.day);
        })  
		.attr('cy', function(d) {
            return lineScaler(d.score);
        })
        .attr('r', 3)
        .attr('transform', 'translate(120,0)');

        //add the vertical axis labels
        autoLineG.append('text')
        .attr("transform", 'translate(' + (margin.left -25) + ',' +(height/2 - 40) + ')rotate(-90)')
        .text('Autonomy Score')
        .attr('font-size', 15);

        //add subtitle for autolinechart
        autoLineG
        .append('text')
        .attr('class', 'subtitle')
        .text("Autonomy Scores")
        .attr('x', 1/3*width)
        .attr('y', margin.top - 30);


        //ADD THE BAR CHART FOR IMPORTANT INTERRUPTIONS PER DAY
        
        //Set up stack method
		var stack = d3.stack()
        .keys([ 'numNotImp', 'numImp' ])
        .order(d3.stackOrderDescending);  // <-- Flipped stacking order

        //Data, stacked
        var series = stack(impData);

        //We will draw our bar chart in the impBarChart group
        var impBarG = g.append('g').attr('class', 'impBarChart').attr('opacity', 0);
        //shifting the bar chart right to avoid overlapping with narrative (sections)
        impBarG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');

        // Add a group for each row of data
        var groups = impBarG.selectAll("g.bar")
        .data(series)
        .enter()
        .append("g")
        .style("fill", function(d, i) {
            return colors(i);
        });
        
        // Add a rect for each data value
        var rects = groups.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return 50 + xScalerBar(i);
        })
        .attr("y", function(d) {
            return yScalerBar(d[1]);  // <-- Changed y value
        })
        .attr("height", function(d) {
            return yScalerBar(d[0]) - yScalerBar(d[1]);  // <-- Changed height value
        })
        .attr("width", xScalerBar.bandwidth());
        
        var labels = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        
        var barText = impBarG.append('g');
        
        barText.selectAll('text')
        .data(labels)
        .enter()
        .append('text')
        .text(function(d) {return d;})
        .attr('x', function(d,i) {
            return margin.left + xScalerBar(i) + 75;
        })
        .attr('y', function(d,i) {
            return 1/2 * height + 20;
        });

        //yAxis for the bar chart
        var baryAxis = d3.axisLeft().scale(yScalerBar);
        impBarG.append('g').call(baryAxis).attr('transform', 'translate('+ (margin.left) + ',0)');
        //add legend
        impBarG.append('rect').attr('x', 1/3* width - 250).attr('y',2/3 * height ).attr('width', 30).attr('height', 30).attr('fill', d3.schemeCategory10[1]);
        impBarG.append('rect').attr('x', 1/3* width - 250).attr('y', 2/3 * height + 40).attr('width', 30).attr('height', 30).attr('fill', d3.schemeCategory10[0]);
        impBarG.append('text').attr('x', 1/3* width - 250 +40).attr('y', 2/3 * height + 20).text("Not Important")
        impBarG.append('text').attr('x', 1/3* width - 250 + 40).attr('y', 2/3 * height + 30 + 30) .text("Important")
        
        //add yaxis labels
        impBarG.append('text').attr("transform", 'translate(' + (margin.left -28) + ',' +(height/2) + ')rotate(-90)').text('No. of interruptions');

        //add subtitle for autolinechart
        impBarG
        .append('text')
        .attr('class', 'subtitle')
        .text("Total Number of Interruptions")
        .attr('x', 1/3*width)
        .attr('y', margin.top - 30);


        //ADD HISTOGRAM FOR INTERRUPTION DURATION
        var intDurG = g.append('g').attr('class', 'intDurHistChart').attr('opacity', 0);
        //shifting the histogram right to avoid overlapping with narrative (sections)
        intDurG.attr('transform', 'translate( +' + RIGHT_SHIFT + ',0)');

        intDataFiltered = intData.filter(function(d) {
            return +d.duration <= 20;
        })
        //set the xScaler's domain for the histogram
        xScalerHist.domain([0, d3.max(intDataFiltered, function(d) {return +d.duration;})])     


        
        // setup histogram layout 
        var histogram = d3.histogram()
                            .value(function(d) { return +d.duration; })   // I need to give the vector of value
                            .domain(xScalerHist.domain())  // then the domain of the graphic
                            .thresholds(xScalerHist.ticks(25)); // then the numbers of bins

        //histogramify the data
        var bins = histogram(intDataFiltered);

        //set domain for yScaler for histogram
        yScalerHist.domain([0, d3.max(bins, function(d) {return d.length})]);
          

          //place in the xaxis for histogram
          var histXaxis = d3.axisBottom().scale(xScalerHist);
          intDurG.append('g').call(histXaxis).attr('transform', 'translate(0,' + (height/2 - 30) + ')');

          //place in the yaxis for histogram

          var histYaxis = d3.axisLeft().scale(yScalerHist);
          intDurG.append('g').call(histYaxis).attr('transform', 'translate(' + (margin.left) + ',' + (-30) + ')');
          
          //append rect's to the figure
          
          intDurG.selectAll("rect")
             .data(bins)
             .enter()
             .append("rect")
             .attr('class', 'histRect')
             .attr("x", 1)
             .attr("transform", function(d) { return "translate(" + xScalerHist(d.x0) + "," + (yScalerHist(d.length) - margin.bottom + 10) + ")"; })
             .attr("width", function(d) { return xScalerHist(d.x1) - xScalerHist(d.x0) ; })
             .attr("height", function(d) { return height/2 - yScalerHist(d.length); })
             .attr("fill", "#69b3a2");

           
           //xaxis label
           intDurG.append('text').attr('x', width/2 - 10).attr('y', height/2).text('seconds')

           intDurG.append('text').attr("transform", 'translate(' + (margin.left -25) + ',' +(height/2 - 100) + ')rotate(-90)').text('Count')
            .attr('font-size', 15);

            //add subtitle for autolinechart
            intDurG
            .append('text')
            .attr('class', 'subtitle')
            .text("Total Number of Interruptions")
            .attr('x', 1/3*width)
            .attr('y', margin.top - 30);

            
            
            //setupViz() returns nothing 

    }

    /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   */
    var setupSections = function() {
        //setupSections returns nothing
        
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showSaturdayCalendar;
        activateFunctions[1] = showSaturdayInterruptions;
        activateFunctions[2] = showSaturdayPickupsNotifs;
        activateFunctions[3] = showSundayCalendar;
        activateFunctions[4] = showSundayInterruptions;
        activateFunctions[5] = showSundayPickupsNotifs;
        activateFunctions[6] = showMondayCalendar;
        activateFunctions[7] = showMondayInterruptions;
        activateFunctions[8] = showMondayPickupsNotifs;
        activateFunctions[9] = showTuesdayCalendar;
        activateFunctions[10] = showTuesdayInterruptions;
        activateFunctions[11] = showTuesdayPickupsNotifs;
        activateFunctions[12] = showWednesdayCalendar;
        activateFunctions[13] = showWednesdayInterruptions;
        activateFunctions[14] = showWednesdayPickupsNotifs;
        activateFunctions[15] = showThursdayCalendar;
        activateFunctions[16] = showThursdayInterruptions;
        activateFunctions[17] = showThursdayPickupsNotifs;
        activateFunctions[18] = showFridayCalendar;
        activateFunctions[19] = showFridayInterruptions;
        activateFunctions[20] = showFridayPickupsNotifs;
        activateFunctions[21] = showAutoLineChart;
        activateFunctions[22] = showImpBarChart;
        activateFunctions[23] = showIntDurHistChart;

        //add update functions here if needed
        
        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 24; i++) {
            updateFunctions[i] = function () {};
        }
    }

    /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showSaturdayCalendar - initial title
   *
   * hides: None
   * (no previous step to hide)
   * shows: Saturday calendar
   *
   */
   function showSaturdayCalendar() {
       g.selectAll('g.saturdayInterruptions').transition().attr('opacity', 0);   
       g.selectAll('g.saturdayCalendar').transition().attr('opacity', 1); 
       
   }

   /**
    * showSaturdayInterruptions - 
    * hides: None
    * shows: Saturday interruptions
    * 
    */
   function showSaturdayInterruptions() {
       g.selectAll('g.saturdayPickups').transition().attr('opacity', 0);
       g.selectAll('g.saturdayNotifs').transition().attr('opacity', 0);
       

       if (activeIndex < lastIndex) {
        g.selectAll('g.saturdayCalendar').transition().attr('opacity', 1);
       }

        g.selectAll('g.saturdayInterruptions').transition().attr('opacity', 1);
    }

   
   /**
    * showSaturdayPickupsNotifs
    * hides: saturdayCalendar, saturdayInterruptions, 
    * shows: saturdayPickups,Notifs
    */

   function showSaturdayPickupsNotifs() {
       g.selectAll('g.saturdayCalendar').transition().attr('opacity', 0);
       g.selectAll('g.saturdayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.sundayCalendar').transition().attr('opacity', 0);

       g.selectAll('g.saturdayPickups').transition().attr('opacity', 1);
       g.selectAll('g.saturdayNotifs').transition().attr('opacity', 1);

       
   }
   /**
    * showSundayCalendar
    * hides: saturday pikcups, saturday notifs
    * shows: sunday calendar
    */
   function showSundayCalendar() {
       g.selectAll('g.saturdayPickups').transition().attr('opacity', 0);
       g.selectAll('g.saturdayNotifs').transition().attr('opacity', 0);
       
       g.selectAll('g.sundayInterruptions').transition().attr('opacity', 0);
       g.selectAll('g.sundayCalendar').transition().attr('opacity', 1);
   }
   /**
    * showSundayInterruptions
    * hides: None
    * hides: sundayInterruptions
    */
   function showSundayInterruptions() {
       
       g.selectAll('g.sundayPickups').transition().attr('opacity', 0);
       g.selectAll('g.sundayNotifs').transition().attr('opacity',0);
       
       if (activeIndex < lastIndex) {
           g.selectAll('g.sundayCalendar').transition().attr('opacity', 1);
       }
       g.selectAll('g.sundayInterruptions').transition().attr('opacity', 1);
   }

   /**
    * showSundayPickupsNotifs
    * hides: sundayCalendar, sundayInterruptions
    * shows: sundayPickups, sundayNotifs
    */
   function showSundayPickupsNotifs() {
       g.selectAll('g.sundayCalendar').transition().attr('opacity', 0);
       g.selectAll('g.sundayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.mondayCalendar').transition().attr('opacity', 0);
       
       g.selectAll('g.sundayPickups').transition().attr('opacity', 1);
       g.selectAll('g.sundayNotifs').transition().attr('opacity', 1);
   }

   /**
    * showMondayCalendar
    * hides: saturday pikcups, saturday notifs
    * shows: sunday calendar
    */
   function showMondayCalendar() {
    g.selectAll('g.sundayPickups').transition().attr('opacity', 0);
    g.selectAll('g.sundayNotifs').transition().attr('opacity', 0);
    g.selectAll('g.mondayInterruptions').transition().attr('opacity', 0);
    g.selectAll('g.mondayCalendar').transition().attr('opacity', 1);
}
    /**
     * showMondayInterruptions
     * hides: None
     * hides: sundayInterruptions
     */
    function showMondayInterruptions() {
        g.selectAll('g.mondayPickups').transition().attr('opacity', 0);
        g.selectAll('g.mondayNotifs').transition().attr('opacity',0);
        
        if (activeIndex < lastIndex) {
            g.selectAll('g.mondayCalendar').transition().attr('opacity', 1);
        }

        g.selectAll('g.mondayInterruptions').transition().attr('opacity', 1);

        
    }

    /**
     * showSundayPickupsNotifs
     * hides: sundayCalendar, sundayInterruptions
     * shows: sundayPickups, sundayNotifs
     */
    function showMondayPickupsNotifs() {
        g.selectAll('g.mondayCalendar').transition().attr('opacity', 0);
        g.selectAll('g.mondayInterruptions').transition().attr('opacity', 0);

        g.selectAll('g.tuesdayCalendar').transition().attr('opacity', 0);

        g.selectAll('g.mondayPickups').transition().attr('opacity', 1);
        g.selectAll('g.mondayNotifs').transition().attr('opacity', 1);
    }

    /**
    * showSundayCalendar
    * hides: saturday pikcups, saturday notifs
    * shows: sunday calendar
    */
   function showTuesdayCalendar() {
       g.selectAll('g.mondayPickups').transition().attr('opacity', 0);
       g.selectAll('g.mondayNotifs').transition().attr('opacity', 0);

       g.selectAll('g.tuesdayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.tuesdayCalendar').transition().attr('opacity', 1);
}



    /**
     * showSundayInterruptions
     * hides: None
     * hides: sundayInterruptions
     */
    function showTuesdayInterruptions() {
        g.selectAll('g.tuesdayPickups').transition().attr('opacity', 0);
        g.selectAll('g.tuesdayNotifs').transition().attr('opacity',0);
        
        if (activeIndex < lastIndex) {
            g.selectAll('g.tuesdayCalendar').transition().attr('opacity', 1);
        }
        g.selectAll('g.tuesdayInterruptions').transition().attr('opacity', 1);
    }

    /**
     * showSundayPickupsNotifs
     * hides: sundayCalendar, sundayInterruptions
     * shows: sundayPickups, sundayNotifs
     */
    function showTuesdayPickupsNotifs() {
        g.selectAll('g.tuesdayCalendar').transition().attr('opacity', 0);
        g.selectAll('g.tuesdayInterruptions').transition().attr('opacity', 0);

        g.selectAll('g.wednesdayCalendar').transition().attr('opacity', 0);

        g.selectAll('g.tuesdayPickups').transition().attr('opacity', 1);
        g.selectAll('g.tuesdayNotifs').transition().attr('opacity', 1);
    }

    /**
    * showSundayCalendar
    * hides: saturday pikcups, saturday notifs
    * shows: sunday calendar
    */
   function showWednesdayCalendar() {
        g.selectAll('g.tuesdayPickups').transition().attr('opacity', 0);
        g.selectAll('g.tuesdayNotifs').transition().attr('opacity', 0);

        g.selectAll('g.wednesdayInterruptions').transition().attr('opacity', 0);

        g.selectAll('g.wednesdayCalendar').transition().attr('opacity', 1);
    }

    /**
    * showSundayInterruptions
    * hides: None
    * hides: sundayInterruptions
    */
   function showWednesdayInterruptions() {
    g.selectAll('g.wednesdayPickups').transition().attr('opacity', 0);
    g.selectAll('g.wednesdayNotifs').transition().attr('opacity',0);
    
    if (activeIndex < lastIndex) {
        g.selectAll('g.wednesdayCalendar').transition().attr('opacity', 1);
    }
       g.selectAll('g.wednesdayInterruptions').transition().attr('opacity', 1);
    }

    /**
    * showSundayPickupsNotifs
    * hides: sundayCalendar, sundayInterruptions
    * shows: sundayPickups, sundayNotifs
    * */
   function showWednesdayPickupsNotifs() {
       g.selectAll('g.wednesdayCalendar').transition().attr('opacity', 0);
       g.selectAll('g.wednesdayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.thursdayCalendar').transition().attr('opacity', 0);
       
       g.selectAll('g.wednesdayPickups').transition().attr('opacity', 1);
       g.selectAll('g.wednesdayNotifs').transition().attr('opacity', 1);
    }
    
    /**
    *  showSundayCalendar
    *   hides: saturday pikcups, saturday notifs
    *   shows: sunday calendar
    * */
   function showThursdayCalendar() {
       g.selectAll('g.wednesdayPickups').transition().attr('opacity', 0);
       g.selectAll('g.wednesdayNotifs').transition().attr('opacity', 0);

       g.selectAll('g.thursdayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.thursdayCalendar').transition().attr('opacity', 1);
    }
    
    /**
     *  showSundayInterruptions
     *  hides: None
     *  hides: sundayInterruptions
     * */
    function showThursdayInterruptions() {
        g.selectAll('g.thursdayPickups').transition().attr('opacity', 0);
        g.selectAll('g.thursdayNotifs').transition().attr('opacity',0);
        
        if (activeIndex < lastIndex) {
            g.selectAll('g.thursdayCalendar').transition().attr('opacity', 1);
        }
        g.selectAll('g.thursdayInterruptions').transition().attr('opacity', 1);
    }
    
    /**
     *   showSundayPickupsNotifs
     *   hides: sundayCalendar, sundayInterruptions
     *   shows: sundayPickups, sundayNotifs
     * */
    function showThursdayPickupsNotifs() {
        g.selectAll('g.thursdayCalendar').transition().attr('opacity', 0);
        g.selectAll('g.thursdayInterruptions').transition().attr('opacity', 0);
        
        g.selectAll('g.fridayCalendar').transition().attr('opacity', 0);

        g.selectAll('g.thursdayPickups').transition().attr('opacity', 1);
        g.selectAll('g.thursdayNotifs').transition().attr('opacity', 1);
    }

    /**
    *  showSundayCalendar
    *   hides: saturday pikcups, saturday notifs
    *   shows: sunday calendar
    * */
   function showFridayCalendar() {
       g.selectAll('g.thursdayPickups').transition().attr('opacity', 0);
       g.selectAll('g.thursdayNotifs').transition().attr('opacity', 0);

       g.selectAll('g.fridayInterruptions').transition().attr('opacity', 0);

       g.selectAll('g.fridayCalendar').transition().attr('opacity', 1);
    }
    
    /**
     *  showSundayInterruptions
     *  hides: None
     *  hides: sundayInterruptions
     *  */
    function showFridayInterruptions() {
        g.selectAll('g.fridayPickups').transition().attr('opacity', 0);
        g.selectAll('g.fridayNotifs').transition().attr('opacity',0);
        
        if (activeIndex < lastIndex) {
            g.selectAll('g.fridayCalendar').transition().attr('opacity', 1);
        }
        g.selectAll('g.fridayInterruptions').transition().attr('opacity', 1);
    }
    
    /**
    *   showSundayPickupsNotifs
    *   hides: sundayCalendar, sundayInterruptions, linechart
    *   shows: sundayPickups, sundayNotifs
    * */
   function showFridayPickupsNotifs() {
       g.selectAll('g.fridayCalendar').transition().attr('opacity', 0);
       g.selectAll('g.fridayInterruptions').transition().attr('opacity', 0);
       g.selectAll('g.autoLineChart').transition().attr('opacity', 0);

       g.selectAll('g.fridayPickups').transition().attr('opacity', 1);
       g.selectAll('g.fridayNotifs').transition().attr('opacity', 1);
    }
    
    //DAY OF WEEK ACTIVATION FUNCTIONS DONE
    //PART II VISUALIZATION STARTS HERE

    /**
     * showAutoLineChart
     * hides: friday's pickups, notifs, bar chart
     * shows: autonomy line chart
     */
    
    function showAutoLineChart() {
        g.selectAll('g.fridayPickups').transition().attr('opacity', 0);
        g.selectAll('g.fridayNotifs').transition().attr('opacity', 0);
        g.selectAll('g.impBarChart').transition().attr('opacity', 0);

        g.selectAll('g.autoLineChart').transition().attr('opacity', 1);
    } 

    /**
     * showImportance Barchart
     * hides: autonomyLineChart, histogram 
     * shows: impBarChart 
     */
    function showImpBarChart() {
        g.selectAll('g.autoLineChart').transition().attr('opacity', 0);
        g.selectAll('g.intDurHistChart').transition().attr('opacity', 0);

        g.selectAll('g.impBarChart').transition().attr('opacity', 1);
    }

    /**
     * show Interruptions duration histogram chart (last step)
     * hides: impBarChart
     * shows: histogram 
     */
    function showIntDurHistChart() {
        g.selectAll('g.impBarChart').transition().attr('opacity', 0);
        g.selectAll('g.intDurHistChart').transition().attr('opacity', 1);
    }

    /**
     *  activate -
     * 
     *  @param index - index of the activated section
    */
    chart.activate = function(index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };
    
    /**
     * * update
     * 
     *  @param index
     *  @param progress
     */
    chart.update = function(index, progress){
        //fill in update method of chart function here (if any updates )
        updateFunctions[index](progress);
    };
    
    
    //UTILITY FUNCTIONS

    //filter out calendar data from day and on the hour
    function filterCalendar(data, day) {
        var dayArr = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].day == day & data[i].time.slice(-2) == '00') {
                dayArr.push(data[i]);
                }
            }
        return dayArr;
            }
    
    function filterInt(data, day) { 
        var dayDis = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].day == day) {
                dayDis.push(data[i]);
            }
        }
        return dayDis;
    }

    function filterPickupNotif(data, day) {
        var filterData = [];
        for (var i = 0; i < data.length; i++) {
            var t = timeParser(data[i].time);
            if (t >= timeParser('7:00') & t <= timeParser('23:59') & data[i].day == day) {
                filterData.push(data[i]);
            }
        }
        return filterData; 
    }

    function timeRounder(t) {
        var mins = t.slice(-2);
        var hours = t.slice(0,2);

        if (+mins >= 55) {
            var newHours = +hours + 1;
            var newMins = '00';
            return newHours.toString() + ':' + newMins;
        }
        else {
            var roundedMins = (Math.round(+mins/10) * 10);
            var roundedTime = hours + ':' + roundedMins.toString()
            if (roundedMins == 0) {
                return roundedTime + '0';
            }
            return roundedTime;
        }	
    }

    function initBlockCount() {
        blockCount = {
            '08:00':0,'08:10': 0, '08:20': 0,'08:30':0, '08:40':0, '08:50':0,'09:00':0,'09:10': 0,'09:20': 0,'09:30':0,'09:40':0,
            '09:50':0,'10:00':0,'10:10': 0,'10:20': 0,'10:30':0,'10:40':0,'10:50':0,'11:00':0,'11:10': 0,'11:20': 0,'11:30':0,
            '11:40':0,'11:50':0,'12:00':0,'12:10': 0,'12:20': 0,'12:30':0,'12:40':0,'12:50':0,'13:00':0,'13:10': 0,'13:20': 0,
            '13:30':0,'13:40':0,'13:50':0,'14:00':0,'14:10': 0,'14:20': 0,'14:30':0,'14:40':0,'14:50':0,'15:00':0,
            '15:10': 0,'15:20': 0,'15:30':0,'15:40':0,'15:50':0,'16:00':0,'16:10': 0,'16:20': 0,'16:30':0,'16:40':0,'16:50':0,'17:00':0,
            '17:10': 0,'17:20': 0,'17:30':0,'17:40':0,'17:50':0,'18:00':0,'18:10': 0,'18:20': 0,'18:30':0,'18:40':0,'18:50':0,'19:00':0,
            '19:10': 0,'19:20': 0,'19:30':0,'19:40':0,'19:50':0,'20:00':0,'20:10': 0,'20:20': 0,'20:30':0,'20:40':0,'20:50':0,
            '21:00':0,'21:10': 0,'21:20': 0,'21:30':0,'21:40':0,'21:50':0,'22:00':0,'22:10': 0,'22:20': 0,'22:30':0,'22:40':0,'22:50':0,
            '23:00':0,'23:10': 0,'23:20': 0,'23:30':0,'23:40':0,'23:50':0,
    };
    }

    //scrollVis returns chart function
    return chart
    
    
    

}

function display() {
    var dataList = [calendarData, intData, appTimeData, notifPickupData]; 
    //callback function when the data is loaded
    //returns chart function closure
    var plot = scrollVis();
    //calls chart function closure with #vis as argument
    d3.select("#vis")
    .call(plot, dataList);

    // setup scroll functionality
    var scroll = scroller()
    .container(d3.select("#graphic"));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
        .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
        
        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });


}
var calendarData;
var intData;
var appTimeData;
var notifPickupData;

d3.csv("../data/calendar.csv", function(data) {
    calendarData = data;
});

d3.csv("../data/interruptions2.csv", function(data){
    intData = data;
});

d3.csv("../data/apps-time.csv", function(data) {
    appTimeData = data;
});

d3.csv("../data/notifs-pickups.csv", function(data) {
    notifPickupData = data;

    d3.timeout(display, 1000);
    //;
});

