var width = 1340,
    size = 150,
    padding = 30;

var x = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]);

var y = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]);

var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(3);

var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(3);

var color = d3.scaleOrdinal()
    .domain(["SD", "SMP", "SMA"])
    .range(["#F06560", "#1F4972" , "#89A7AE"]);

d3.csv("data/factors.csv")
.then(function(factors_data) {

    var domainByFactors = {},
        factors = d3.keys(factors_data[0]).filter(function(d) {return d !== "level" && d !== "apm"; })
        n = factors.length;

    factors.forEach(function(factor) {
        domainByFactors[factor] = d3.extent(factors_data, function(d) { return +d[factor]; });
    });

    factors_apm_data = d3.extent(factors_data, function(d) {return +d["apm"]});

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    var brush = d3.brush()
        .on("start", brushstart)
        .on("brush", brushmove)
        .on("end", brushend)
        .extent([[0,0],[size,size]]);

    var svg = d3.select(".factors-plot").append("svg")
        .attr("width", size * n + padding)
        .attr("height", size * n + padding)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(factors)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
        .each(function(d) { x.domain(domainByFactors[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
        .data(factors)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { y.domain(factors_apm_data); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
        .data(cross(factors, factors))
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
        .each(plot);

    // Titles for the diagonal.
    cell.filter(function(d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

    cell.call(brush);

    function plot(p) {
        var cell = d3.select(this);

        x.domain(domainByFactors[p.x]);
        y.domain(factors_apm_data);

        cell.append("rect")
            .attr("class", "frame")
            .attr("x", padding / 2)
            .attr("y", padding / 2)
            .attr("width", size - padding)
            .attr("height", size - padding);

        cell.selectAll("circle")
            .data(factors_data)
        .enter().append("circle")
            .attr("cx", function(d) { return x(d[p.x]); })
            .attr("cy", function(d) { return y(d["apm"]); })
            .attr("r", 4)
            .style("fill", function(d) { return color(d.level); });
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
        if (brushCell !== this) {
        d3.select(brushCell).call(brush.move, null);
        brushCell = this;
        x.domain(domainByFactors[p.x]);
        y.domain(factors_apm_data);
        }
    }

    // Highlight the selected circles.
    function brushmove(p) {
        var e = d3.brushSelection(this);
        svg.selectAll("circle").classed("hidden", function(d) {
        return !e
            ? false
            : (
            e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
            || e[0][1] > y(+d["apm"]) || y(+d["apm"]) > e[1][1]
            );
        });
    }
    
    // If the brush is empty, select all circles.
    function brushend() {
        var e = d3.brushSelection(this);
        if (e === null) svg.selectAll(".hidden").classed("hidden", false);
    }

    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
            return c;
    }
})
.catch(function(error) {
    console.error(error)
});