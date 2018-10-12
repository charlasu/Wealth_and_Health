// Set up the canvas
var svgWidth = 800;
var svgHeight = 500;

// Define the canvas' margins
var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

//Clarify the actual width/height of the visual output
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create the SVG wrapper
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group ("g")
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


// Created variables to store the min/max values from the CSV
var xMin; 
var xMax;
var yMin;
var yMax;

// Import data
d3.csv("assets/data/data.csv").then(function(healthData) {
  //if (error) return console.warn(error);
  console.log(healthData);

  // Step 1: Parse data/cast as numbers
  healthData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    //data.abbr = +data.abbr;
  });

 // Step 2: Create scale functions 
 var xLinearScale = xScale(healthData, defaultXAxis);

// Create y scale function
var yLinearScale = d3.scaleLinear()
.domain([0, d3.max(healthData, d => d.healthcare)])
.range([height, 0]);

// Create initial axis functions
var bottomAxis = d3.axisBottom(xLinearScale);
var leftAxis = d3.axisLeft(yLinearScale);

// append x axis
var xAxis = chartGroup.append("g")
.classed("x-axis", true)
.attr("transform", `translate(0, ${height})`)
.call(bottomAxis);

// append y axis
chartGroup.append("g")
.call(leftAxis);

// append initial circles
var circlesGroup = chartGroup.selectAll("circle")
.data(healthData)
.enter()
.append("circle")
.attr("cx", d => xLinearScale(d[defaultXAxis]))
.attr("cy", d => yLinearScale(d.healthcare))
.attr("r", 20)
.attr("fill", "green")
.attr("opacity", ".75");


  // Create group for  2 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("Population In Poverty (%)");

// Add the state abbreviations to the circles
  var stateLabel = labelsGroup.append("text")
  	.data(healthData)
  	.enter()
  	.append("text")
  	.text(function(d){
  		return d.abbr;
  	})
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "abbr") // value to grab for event listener
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("class", "stateLabel")
    .attr("abbr");
    

  // var stateLabel = labelsGroup.append("text")
  //   .attr("x", 0)
  //   .attr("y", 40)
  //   .attr("value", "abbr") // value to grab for event listener
  //   .classed("inactive", true)
  //   .text("U.S. State");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Population Lacking Healthcare");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(defaultXAxis, circlesGroup);

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== defaultXAxis) {

        // replaces defaultXAxis with value
        defaultXAxis = value;

        // console.log(defaultXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(healthData, defaultXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, defaultXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(defaultXAxis, circlesGroup);

        // changes classes to change bold text
        if (defaultXAxis === "abbr") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          stateLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          stateLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
});



// Initial Params
var defaultXAxis = "poverty";

// The xScale function updates x-scale variable upon click on axis label
function xScale(healthData, defaultXAxis) {
  // Create scales ... reminder "d" = data
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(healthData, d => d[defaultXAxis]) * .8,
      d3.max(healthData, d => d[defaultXAxis]) * 1.1
    ])
    .range([0, width]);

  return xLinearScale;
}


// The renderAxes function updates xAxis variable upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// The renderCircles function updates circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, defaultXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[defaultXAxis]));

  return circlesGroup;
}

// The updateToolTip function updates circles group with new on/off tooltip
function updateToolTip(defaultXAxis, circlesGroup) {

  if (defaultXAxis === "poverty") {
    var label = "Lives in Poverty (%)";
  }
  else {
    var label = "Lacks Healthcare (%)";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    //IS "OFFSET" THE LOCATION? 
    //DELETING NOR CHANGING ".OFFSET" DOESN'T MAKE tip CLOSER TO THE CIRCLES, SO???
    .offset([80, -60])
    .html(function(d) {
    	var stateLabel = d.abbr;
    	//return stateLabel;

      return (`${d.abbr}<br>In Poverty: ${d.poverty}<br>Has Healthcare: ${d.healthcare}`);
    });

//Officially create/call the tooltip
  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
  	//NEW STUFF, DOESN'T CHANGE ANYTHING ... WHY????
 //  	div.transition()
 //  		.duration(200)
 //  		.style("opacity", .9);
	// div.html()
	//     .style("right", d3.select(this).attr("cx")+"px")
 //    	.style("bottom", d3.select(this).attr("cy")+"px");
    toolTip.show(data)
    //NEW STUFF, DOESN'T CHANGE ANYTHING ... WHY????
    toolTip.html(data)
    	.style("right", d3.select(this).attr("cx")+"px")
    	.style("bottom", d3.select(this).attr("cy")+"px");
  })
    // Mouseout function that removes tooltip from screen
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

