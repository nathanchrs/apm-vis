function getDataPoint(data, year, province, level) {
  if (data.byYearAndProvince['$' + year] && data.byYearAndProvince['$' + year]['$' + province]) {
    return data.byYearAndProvince['$' + year]['$' + province][0][level];
  }
  return 0;
}

function getDataYears(data) {
  console.log(data);
  const years = Object.keys(data.byYear).map(x => +x.slice(1));
  years.sort();
  return years;
}

function drawChoropleth(topoJsonData, data, year, level) {

  const years = getDataYears(data);
  choroplethYearSlider
    .min(years[0])
    .max(years[years.length - 1])
    .tickValues(years)
    .marks(years)
    .on('onchange', newYear => {
      updateChoropleth(topoJsonData, data, newYear, level);
    });

  sliderContainer.call(choroplethYearSlider);
  sliderContainer.append('text')
    .attr('fill', '#555')
    .attr('transform', 'translate(-20, -20)')
    .classed('slider-label', true);

  updateChoropleth(topoJsonData, data, year, level);

/*

    // y-axis
    distributionContainer.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")


    var picker = d3.select(".education-level").append("select")
    picker.append("option").text("SD").attr("value", "SD")
    picker.append("option").text("SMP").attr("value", "SMP")
    picker.append("option").text("SMA").attr("value", "SMA")
    picker.on("input", function () {
      const educationLevel = this.value;
      const year = d3.select(".slider").selectAll("input").property("value");
      updateMapAndDistribution(year, educationLevel, provinces, dataByYear);
    });
    updateMapAndDistribution(2003, "SD", provinces, dataByYear);
*/
  
}

function updateChoropleth(topoJsonData, data, year, level) {
  const geoJsonData = topojson.feature(topoJsonData, topoJsonData.objects.states_provinces);

  // Map
  const mapPaths = mapContainer.selectAll('path')
    .data(geoJsonData.features);

  mapPaths.exit().remove();
  const mapPathsEnter = mapPaths.enter()
    .append('path')
      .attr('class', 'province')
    .on('mouseenter', d => {
      d3.select(d3.event.target).attr('stroke', '#222');
      mapTooltip.transition().style('opacity', 0.9);
      mapTooltip.html(d.properties.province + '<br />' + getDataPoint(data, year, d.properties.province, level) + '%');
    })
    .on('mousemove', d => {
      mapTooltip
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY) + 'px');
    })
    .on('mouseleave', d => {
      d3.select(d3.event.target).attr('stroke', '');
      mapTooltip.transition().style('opacity', 0);
    });

  mapPathsEnter.merge(mapPaths)
    .transition()
      .attr('d', geoPath)
      .style('fill', d => choroplethColorScale(getDataPoint(data, year, d.properties.province, level)));

  // Legend
  const legendBoxes = mapLegendContainer.selectAll('rect')
    .data(choroplethLegendColors);

  legendBoxes.exit().remove();
  const legendBoxesEnter = legendBoxes.enter()
    .append('rect')
      .attr('y', 6)
      .attr('width', 30)
      .attr('height', 8);
  legendBoxesEnter.merge(legendBoxes)
    .attr('x', (d, i) => i * 30)
    .style("fill", d => d);

  const legendLabels = mapLegendContainer.selectAll('text')
    .data(choroplethLegendText);

  legendLabels.exit().remove();
  const legendLabelsEnter = legendLabels.enter()
    .append('text')
    .classed('legend-label', true)
    .attr('y', 0)
    .attr('fill', '#888')
    .style('text-anchor', 'middle')
  legendLabelsEnter.merge(legendLabels)
    .attr('x', (d, i) => i * 30)
    .text(d => d);

  // Slider
  choroplethYearSlider.silentValue(year);
  choroplethSvg.select('.slider-label').text('Tahun ' + year);
}

// Setup projection
const geoPath = d3.geoPath().projection(
  d3.geoEquirectangular()
  .scale(1000)
  .translate([-1650, 110])
);

// Setup color scale
var choroplethLegendText = ["%", "60", "65", "70", "75", "80", "85", "90", "95"];
const choroplethLegendColors = ["#bbdefb", "#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0"];
const choroplethColorScale = d3.scaleThreshold()
  .domain([60, 65, 70, 75, 80, 85, 90, 95])
  .range(choroplethLegendColors);

// Setup container SVG
const choroplethSvg = d3.select('#choropleth')
  .attr('viewBox', '0 0 1200 460');

const mapContainer = choroplethSvg.append('g')
  .classed('map', true);

const mapLegendContainer = choroplethSvg.append('g')
  .classed('map-legend', true)
  .attr('transform', 'translate(10, 300)');

const sliderContainer = choroplethSvg.append('g')
  .attr('transform', 'translate(20, 380)');

const distributionContainer = choroplethSvg.append('g')
  .attr('transform', 'translate(720, 0)');

// Setup tooltips
const mapTooltip = d3.select('body').append('div')
  .attr('id', 'map-tooltip')
  .attr('class', 'tooltip')
  .style("opacity", 0);

const distributionTooltip = d3.select("body").append("div")
  .attr('id', 'distribution-tooltip')
  .attr('class', 'tooltip')
  .style("opacity", 0);

const choroplethYearSlider = d3
  .sliderHorizontal()
  .width(774)
  .tickFormat(d3.format('d'))
  .displayValue(false);


/*
var yValue = function (d) { return d.APM },
  yScale = d3.scaleLinear().range([height, 0])
    .domain([0, 1]),
  yMap = function (d) { return yScale(yValue(d)) },
  yAxis = d3.axisLeft(yScale).tickSize(0);


*/

Promise.all([
  d3.csv('data/choropleth.csv'),
  d3.json('data/indonesia.json')
])
  .then(([data, topoJsonData]) => {
    const provinces = topojson.feature(topoJsonData, topoJsonData.objects.states_provinces);
    const indexedData = {
      byYear: d3.nest()
        .key(d => d.year)
        .map(data),
      byYearAndProvince: d3.nest()
        .key(d => d.year)
        .key(d => d.province)
        .map(data)
    };

    provinces.features.forEach(d => {
      d.properties.province = d.properties.name;
    });

    const years = getDataYears(indexedData);
    const initialYear = years[years.length - 1];
    drawChoropleth(topoJsonData, indexedData, initialYear, 'smp');
  })
  .catch(err => console.error(err));

/*
function updateMapAndDistribution(year, educationLevel, provinces, dataByYear) {
  d3.select(".year").text(year);

  // draw map
  var provinceShapes = mapSvg.selectAll(".county").data([]);
  provinceShapes.exit().remove();

  provinceShapes = mapSvg.selectAll(".county")
    .data(provinces.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .on("mouseover", function (d) {
      mapTooltip.transition()
        .duration(250)
        .style("opacity", 1);
      mapTooltip.html(
        "<p><strong>" + d.properties.years["$" + year][0].province + "</strong></p>" +
        "<p>APM: " + d.properties.years["$" + year][0]["APM_" + educationLevel] + "%</p>"
      )
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      mapTooltip.transition()
        .duration(250)
        .style("opacity", 0);
    })
    .style("fill", function (d) {
      const years = d.properties.years;
      if (years) {
        return color(d.properties.years["$" + year][0]["APM_" + educationLevel])
      }
    }).merge(provinceShapes).transition();

  // draw dots
  var circles = distributionSvg.selectAll(".dot").data([]);
  circles.exit().remove();

  yScale.domain([
    d3.min(dataByYear["$" + year], function (d) { return d["APM_" + educationLevel] }),
    d3.max(dataByYear["$" + year], function (d) { return d["APM_" + educationLevel] })
  ]);

  circles = distributionSvg.selectAll(".dot")
    .data(dataByYear["$" + year]).enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 7)
    .attr("cy", function (d) { return yScale(d["APM_" + educationLevel]) })
    .style("fill", function (d) { return color(d["APM_" + educationLevel]); })
    .on("mouseover", function (d) {
      distributionTooltip.transition()
        .duration(200)
        .style("opacity", .9);
      distributionTooltip.html(d.province + "<br>" + d["APM_" + educationLevel] + "%")
        .style("left", (d3.event.pageX + 5) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      distributionTooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .merge(circles).transition();
}

d3.select(self.frameElement).style("height", "685px");
*/