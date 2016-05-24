import Ember from 'ember';
export {
    createRefreshingChart
};

function createRefreshingChart(dataType, chartData, div, width, height, chartDescription, refreshPeriod, chartType) {
    getDataFromAjaxCall(dataType, chartData, div, width, height, chartDescription, chartType);
    return setInterval(function() {
        getDataFromAjaxCall(dataType, chartData, div, width, height, chartDescription, chartType);
    }, refreshPeriod);
}
var getDataFromAjaxCall = function(dataType, chartData, div, width, height, chartDescription, chartType) {
    Ember.$.ajax({
        url: '/kujira/api/v1/' + dataType + 'ChartData',
        async: true,
        type: 'GET'
    }).success(function(response) {
        chartData = response.data;
        div.innerHTML = "";
        switch (chartType) {
            case 'pieChart':
                drawRoundChart(chartData, div, width, height, chartDescription, chartType);
                break;
            case 'donutChart':
                drawRoundChart(chartData, div, width, height, chartDescription, chartType);
                break;
            case 'barChart':
                drawBarChart(chartData, div, width, height, chartDescription, chartType);
                break;
            default:
                console.log('wrong type of chart');
        }
    });
};

var drawRoundChart = function(chartData, div, width, height, chartDescription, chartType) {

    var r = 0.35 * width,
        legendRectSize = 0.04 * width,
        legendSpacing = 0.004 * width,
        parametersNamesArray = [],
        parametersColorsArray = [],
        parametersValuesArray = [];
    fillArrays(parametersNamesArray, parametersColorsArray, parametersValuesArray, chartData, chartType);

    var color = d3.scale.ordinal()
        .range(parametersColorsArray);

    var canvas = d3.select(div)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var group = canvas.append("g")
        .attr("transform", "translate(" + r + "," + r + ")");

    var arc = d3.svg.arc()
        .innerRadius(
            function() {
                if (chartType === 'donutChart') {
                    return 0.5 * r;
                } else {
                    return 0;
                }
            }
        )
        .outerRadius(r);

    var pie = d3.layout.pie()
        .value(function(d) {
            return d;
        });

    var arcs = group.selectAll(".arc")
        .data(pie(parametersValuesArray))
        .enter()
        .append("g")
        .attr("class", "arc");

    canvas.append("g")
        .attr("transform", "translate(0," + 2 * r + ")")
        .append("text")
        .attr("font-size", "" + 0.002 * width + "em")
        .attr("transform", "translate(" + 0.015 * height + "," + 0.09 * height + ")")
        .text("" + chartDescription + "");


    arcs.append("path")
        .attr("d", arc)
        .attr("fill", function(d, i) {
            return color(i);
        });

    arcs.append("text")
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "" + 0.002 * width + "em")
        .text(function(d) {
            return d.data;
        });


    var legend = arcs.selectAll('.legend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            return 'translate(' + 0.4 * width + ',' + i * (legendRectSize + legendSpacing) + ')';
        });


    legend.append('rect')
        .attr('transform', 'translate(0,' + -0.8 * r + ')')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', color)
        .style('stroke', color);

    legend.append('text')
        .attr('transform', 'translate(0,' + -0.8 * r + ')')
        .attr("font-size", "" + 0.002 * width + "em")
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d, i) {
            d = parametersNamesArray[i];
            return d;
        });


};
var drawBarChart = function(chartData, div, width, height, chartDescription, chartType) {

    var scaling = 0,
        modif = (0.9 * width) / chartData.length,
        parametersNamesArray = [],
        parametersColorsArray = [],
        parametersValuesArray = [],
        parametersNamesPositionsArray = [];

    fillArrays(parametersNamesArray, parametersColorsArray, parametersValuesArray, chartData, chartType);
    parametersNamesArray[0] = "";
    parametersNamesPositionsArray[0] = 0;
    for (var i = 1; i < chartData.length + 1; i++) {
        parametersNamesPositionsArray[i] = i * 0.33 * modif + 0.66 * modif * (i - 1);
    }
    parametersNamesPositionsArray[chartData.length + 1] = 0.9 * width;


    for (i = 0; i < parametersValuesArray.length; i++) {
        if (parametersValuesArray[i] > scaling) {
            scaling = parametersValuesArray[i] + 0.2 * parametersValuesArray[i];
        }
    }

    var heightScale = d3.scale.linear()
        .domain([0, scaling])
        .range([0, 0.71 * height]);

    var yAxisScale = d3.scale.linear()
        .domain([0, scaling])
        .range([0.71 * height, 0]);


    var xAxisScale = d3.scale.ordinal()
        .domain(parametersNamesArray)
        .range(parametersNamesPositionsArray);

    var color = d3.scale.ordinal()
        .range(parametersColorsArray);

    var canvas = d3.select(div)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    var yAxis = d3.svg.axis()
        .scale(yAxisScale)
        .orient("right")
        .ticks(10);

    var xAxis = d3.svg.axis()
        .scale(xAxisScale)
        .orient("bottom")
        .ticks(chartData.length);

    canvas.selectAll("rect")
        .data(parametersValuesArray)
        .enter()
        .append("rect")
        .attr("height", function(d) {
            return heightScale(d);
        })
        .attr("width", 0.66 * modif)
        .attr("fill", function(d, i) {
            return color(i);
        })
        .attr("x", function(d, i) {
            return i * modif;
        })
        .attr("y", function(d) {
            return 0.71 * height - heightScale(d);
        });

    canvas.append("g")
        .attr("transform", "translate(" + 0.9 * width + ",0)")
        .call(yAxis);

    canvas.append("g")
        .attr("transform", "translate(0," + 0.71 * height + ")")
        .call(xAxis)
        .append("text")
        .attr("font-size", "" + 0.002 * width + "em")
        .attr("transform", "translate(" + 0.015 * height + "," + 0.2 * height + ")")
        .text("" + chartDescription + "");


};

var fillArrays = function(parametersNamesArray, parametersColorsArray, parametersValuesArray, chartData, chartType) {
    var l, k;
    switch (chartType) {
        case 'pieChart':
        case 'donutChart':
            l = 0;
            k = 0;
            break;
        case 'barChart':
            l = 1;
            k = 1;
            break;
    }
    for (l; l < chartData.length + 1; l++) {
        parametersNamesArray[l] = chartData.get(l - k + '.name');
    }

    for (l = 0; l < chartData.length; l++) {
        parametersColorsArray[l] = chartData.get(l + '.color');
        parametersValuesArray[l] = chartData.get(l + '.value');
    }
};
