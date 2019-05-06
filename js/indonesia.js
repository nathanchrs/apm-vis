var width = 960,
  height = 500,
  centered;
var projection = d3.geoEquirectangular()
  .scale(1050)
  .rotate([-120, 0])
  .translate([width / 2, height / 2]);
var path = d3.geoPath()
  .projection(projection);
var svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);
svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", clicked);
var g = svg.append("g");

/* Select elements */
tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
var yearSlider = d3.select("#year-slider");
var sideInfo = d3.select("#side-info").style("color", "white");

var color = d3.scaleThreshold()
  .domain([87.5, 90, 92.5, 95, 97.5])
  .range(["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"]);

/* Import JSON Map data */
d3.json("data/indonesia.json").then(function (us) {
  var stateProvinces = topojson.feature(us, us.objects.states_provinces).features;
  var currentYear = 0;

  /* Import csv APM data */
  d3.csv("data/indonesia.csv").then(data => {
    var dataByProvince = d3.nest()
      .key(function (d) { return d.province; })
      .map(data);

    stateProvinces.forEach(singleProvince => {
      singleProvince.yearlyAPM = dataByProvince["$" + singleProvince.properties.name]
    });

    g.append("g")
      .attr("id", "subunits")
      .selectAll("path")
      .data(stateProvinces)
      .enter().append("path")
      .attr("d", path)
      .on("click", clicked)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout)
      .style("fill", function (d) {
        if (d.yearlyAPM) {
          return color(d.yearlyAPM[0].APM);
        }
      });
    g.append("path")
      .datum(topojson.mesh(us, us.objects.states_provinces, function (a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);

    yearSlider
      .attr("min", data[0].year)
      .attr("max", data[data.length - 1].year)
      .on("input", /* TODO: update data */ function () {
        currentYear = yearSlider.property("value"); // get the current year
        // console.log(data.filter(x => x.year == currentYear));
        sideInfo.data(data.filter(x => x.year == currentYear)).enter().append("li")
          .text(function (d) {
            return d.value
          });;
      });
    sideInfo
      .data(data)
      .enter().append("li")
      .text(function (d) {
        return d.value
      });
  }).catch(error => console.error(error));
}).catch(error => console.error(error));


function regionInfo(region) {
  return region.properties.name ? region.properties.name.toUpperCase() : region.properties.name;
}
//*/
function clicked(d) {
  console.log(d);
  var x, y, k;
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
  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .style("stroke-width", 1.5 / k + "px");
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
  tooltip.html("test")
    // tooltip.html(
    //   "<p><strong>" + d.properties.years[1996][0].county + ", " + d.properties.years[1996][0].state + "</strong></p>" +
    //   "<table><tbody><tr><td class='wide'>Smoking rate in 1996:</td><td>" + formatPercent((d.properties.years[1996][0].rate) / 100) + "</td></tr>" +
    //   "<tr><td>Smoking rate in 2012:</td><td>" + formatPercent((d.properties.years[2012][0].rate) / 100) + "</td></tr>" +
    //   "<tr><td>Change:</td><td>" + formatPercent((d.properties.years[2012][0].rate - d.properties.years[1996][0].rate) / 100) + "</td></tr></tbody></table>"
    // )
    .style("left", (d3.event.pageX + 15) + "px")
    .style("top", (d3.event.pageY - 28) + "px");
}

function mouseout(d) {
  tooltip.transition()
    .duration(250)
    .style("opacity", 0);
}