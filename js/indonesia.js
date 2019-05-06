/* Global variables */
var width = 960,
  height = 500,
  centered;
var currentYear = 0;
var projection = d3.geoEquirectangular()
  .scale(1050)
  .rotate([-120, 0])
  .translate([width / 2, height / 2]);
var path = d3.geoPath()
  .projection(projection);

/* Select elements */
var svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);
svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", mouseover);
var g = svg.append("g");
tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
var yearSlider = d3.select("#year-slider");
var sideInfo = d3.select("#side-info").style("color", "white");
var yearLabel = d3.select("#current-year");

var color = d3.scaleThreshold()
  .domain([87.5, 90, 92.5, 95, 97.5])
  .range(["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"]);

/* Import JSON Map data */
d3.json("data/indonesia.json").then(function (us) {
  var stateProvinces = topojson.feature(us, us.objects.states_provinces).features;

  /* Import csv APM data */
  d3.csv("data/indonesia.csv").then(data => {
    var dataByProvince = d3.nest()
      .key(function (d) { return d.province; })
      .map(data);

    currentYear = data[0].year;

    stateProvinces.forEach(singleProvince => {
      singleProvince.yearlyAPM = dataByProvince["$" + singleProvince.properties.name]
    });

    g.append("g")
      .attr("id", "subunits")
      .selectAll("path")
      .data(stateProvinces)
      .enter().append("path")
      .attr("d", path)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .style("fill", function (d) {
        if (!!d.yearlyAPM) {
          return color(d.yearlyAPM[0].APM);
        }
      });
    g.append("path")
      .datum(topojson.mesh(us, us.objects.states_provinces, function (a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);

    yearLabel.text(data[0].year);
    yearSlider
      .attr("min", data[0].year)
      .attr("max", data[data.length - 1].year)
      .on("input", function () {
        currentYear = yearSlider.property("value"); // get the current year
        yearLabel.text(currentYear);
        var dataSelection = svg.selectAll("g").data(stateProvinces);
        // TODO: change data
      });
    // sideInfo
    //   .data(data)
    //   .enter().append("li")
    //   .text(function (d) {
    //     return d.value
    //   });
    // TODO: change side info data
  }).catch(error => console.error(error));
}).catch(error => console.error(error));

function regionInfo(region) {
  return region.properties.name ? region.properties.name.toUpperCase() : region.properties.name;
}

function mouseover(d) {
  if (d) {
    document.getElementById('info').innerHTML = regionInfo(d);
  } else {
    document.getElementById('info').innerHTML = "INDONESIA";
  }
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }
  g.selectAll("path")
    .classed("active", centered && function (d) { return d === centered; });

  tooltip.transition()
    .duration(250)
    .style("opacity", 1);

  try {
    const provinceData = d.yearlyAPM.filter(singleData => singleData.year == currentYear)[0];
    tooltip.html("test")
    tooltip.html(
      "<p><strong>" + provinceData.province + "</strong></p>" +
      "<p>APM rate in " + currentYear + ": " + provinceData.APM + "%</p>"
    )
      .style("left", (d3.event.pageX + 15) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  } catch (error) {
    // do nothing
  }
}

function mouseout(d) {
  tooltip.transition()
    .duration(250)
    .style("opacity", 0);
}
