/*** @jsx React.DOM */
class Axis extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    var id = '#' + this.props.name;//className = ".feature-axis-" + this.props.name
    var axisG = d3.select(id).call(d3.axisRight(this.props.axis))//.tickFormat(d3.format(".3n")))
    if (this.props.name == 'BOUNDARY') {
      var g = d3.select(id)
      g.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5)
      g.select(".tick").style("display", "none")
    }
  }

  componentDidUpdate() {
    var id = '#' + this.props.name;
    var axisG = d3.select(id).call(d3.axisRight(this.props.axis))
    var g = d3.select(id)
    if (this.props.name == 'BOUNDARY') {

      g.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5)
      g.select(".tick").style("display", "none")
    } else {
      g.select("path").attr("stroke", "black").attr("stroke-width", 1)
    }
  }

  render(){
    console.log('feature-axis')
    const textColor = this.props.name == "BOUNDARY" ? "darkgrey": "black"
    return (
      <g className={'feature-axis'} id={this.props.name} transform={this.props.transform} style={{fontSize: 11, fontFamily: "san-serif"}}>
        <text x={0} y={-5} fill={textColor} >{this.props.textname}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    var margin = {left: 10, right: 30, top: 20, bottom:10};
    var width = props.size[0] - margin.left - margin.right;
    var height = props.size[1] - margin.top - margin.bottom;

    var axisWidth = 30;

    var yScalesDisplay = {};
    for (var i = 0; i < this.props.features.length; i++) {
      if (this.props.features[i].type == 'continuous') {
        const scale = d3.scaleLinear().domain(this.props.features[i].range).range([0, height]);
        yScalesDisplay[this.props.features[i].name] = scale
      }
      else {
        const numSplits = this.props.features[i].values.length - 1;
        const rangeDomain = this.props.features[i].values.map((v, i) => i * height/numSplits);
        yScalesDisplay[this.props.features[i].name] = d3.scaleOrdinal().domain(this.props.features[i].values).range(rangeDomain)
      }
    }
    var yScales = this.props.features.map((feature) =>
      d3.scaleLinear().domain(feature.range).range([0, height])
    );

    this.state = {
      margin: margin,
      width: width,
      height: height,
      yScales: yScales,
      yScalesDisplay: yScalesDisplay,
      axisWidth: axisWidth
    };

    this.path = this.path.bind(this)
  }

  componentDidMount() {
    var that = this;
    //console.log(d3.selectAll('.feature-axis'))
    d3.selectAll(".feature-axis").call(d3.drag()
      .on("start", function(d) {
        //that.state.dragging[attrId] = that.state.xScale(attrId)
      })
      .on("drag", function(d) {
        d3.select(this).attr('transform', function(d) { return 'translate(' + d3.event.x + ")" })
      })
      .on("end", function(d) {
        that.props.featureAxisOnEnd(this)
      })
    )
    //{this.props.data.map((data, index) =>
    //  <path d={this.path(data.features, draw)} fill=
    //{"none"} stroke={this.props.colorFunction(data.target)}/>)
    /*d3.select(".feature-parallels")
      .append("g")
      .attr("class", "data-paths")
      .selectAll("path")
      .data(that.props.data)
      .enter().append("path")
      .attr("class", "datapath")
      .attr("d", function(d) {return that.path(d.features, that.state.draw)})
      .attr("fill", "none")
      .attr("stroke", function(d){ return that.props.colorFunction(d.target) })

    d3.select(".feature-parallels")
      .selectAll(".feature-axis")
      .data(this.state.displayFeatures)
      .enter().append("g")
      .attr("class", 'feature-axis')
      .attr("id", function(d) { console.log(d.name); return d.name})
      .attr("transform", function(d) {
        return "translate(" + that.state.xScale(d.name) + ")"
      })
      .each(function(d) { d3.select(this).call(d3.axisRight(that.state.yScalesDisplay[d.name])) })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -5)
      .attr("x", 0)
      .attr("fill", "black")
      .text(function(d) { return d.name })
    //}


      /*{displayFeatures.map((feature, index) =>
          <Axis name={'axis' + index} textname={feature.name} axis={yScalesDisplay[index]} transform={`translate(${xScale(index)})`}/>
      )}
      <g className={'feature-axis'} id={this.props.name} transform={this.props.transform} style={{fontSize: 9}}>
        <text x={0} y={-5} fill={"black"} >{this.props.textname}</text>
      </g>

      */

  }

  componentDidUpdate() {
    var that = this


    /*var selection = d3.select(".feature-parallels")
      .selectAll(".datapath")
      .data(that.props.data)
      .attr("d", function(d) {return that.path(d.features, that.state.draw)})
      .attr("fill", "none")
      .attr("stroke", function(d){ return that.props.colorFunction(d.target) })

    selection.enter()
      .append('path')
      .attr("d", function(d) {return that.path(d.features, that.state.draw)})
      .attr("fill", "none")
      .attr("stroke", function(d){ return that.props.colorFunction(d.target) })

    selection.exit().remove()*/
  }



  path(data) {
    //console.log(drawFunction)
    //var drawData = data.map((point, index) =>
    //  [this.state.featureNames[index], point]
    //)
    //console.log(this.state.displayFeatures)
    var xScale = this.props.xScale
    var yScalesDisplay = this.state.yScalesDisplay
    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScalesDisplay[d[0]](d[1])
      })

    var drawData = []

    for (var i = 0; i < this.props.features.length; i++) {
      if (this.props.features[i].name == "BOUNDARY") {
        break;
      } else {
        drawData.push([this.props.features[i].name, data[this.props.features[i].index]])
      }
    }
    /*i in this.state.displayFeatures.map((feature) =>
      [feature.name, data[feature.index]]
    )*/
    //console.log(this.state.xScale(0), this.state.yScales[0](data[0]))
    return draw(drawData)
  }

  render(){
    console.log('render feature parallels')
    //console.log(this.state.displayFeatures)
    //console.log(this.state.xScale('e'))
    /*var displayData = this.props.featureValues.filter((feature, index) =>
      this.props.dataIndex[index] == true
    )
    console.log(displayData)

    var displayTarget = this.props.targetValues.filter((feature, index) =>
      this.props.dataIndex[index] = true
    )
    console.log(displayTarget)
    */

    //var xScaleDomain = this.props.features.map((feature, index) =>
    //  feature.name
    //)
    //var xScale = this.state.xScale.domain(xScaleDomain)
    //var width = this.props.features.length * 75 + this.state.margin.left + this.state.margin.right;
    return (
        <div width={1000} style={{overflow: 'scroll'}}>
      <svg className={'feature-parallels-svg'} width={this.props.size[0]} height={this.props.size[1]}>
        <g className={'feature-parallels'} transform={`translate(${this.state.margin.left},${this.state.margin.top})`} >
        <g className={'data-paths'}>
          {this.props.data.map((data, index) =>
            <path d={this.path(data.features)} fill={"none"} stroke={this.props.colorFunction(data.target)} stroke-width={3}/>
          )}
        </g>
        {this.props.features.map((feature, index) =>
            <Axis name={feature.name} textname={feature.name} axis={this.state.yScalesDisplay[feature.name]} transform={`translate(${this.props.xScale(feature.name)})`}/>
        )}
        </g>
      </svg>
          </div>
    )
  }
}

// props: feature range
// x scale for the path
// y scale for each attribute
// function that returns a line for each datapoint
//
// create path component for each data item - function path
/*
<g className={'data-paths'}>
  {this.props.data.map((data, index) =>
    <path d={this.path(data.features, draw)} fill={"none"} stroke={this.props.colorFunction(data.target)}/>)
  }
</g>
{displayFeatures.map((feature, index) =>
    <Axis name={'axis' + index} textname={feature.name} axis={yScalesDisplay[index]} transform={`translate(${xScale(index)})`}/>
)}
*/
