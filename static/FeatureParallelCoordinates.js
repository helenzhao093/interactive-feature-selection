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
      <g className={'feature-axis'} id={this.props.name} transform={this.props.transform} style={{fontSize: 9}}>
        <text x={0} y={-5} fill={textColor} >{this.props.textname}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    //console.log(props)
    super(props)
    var margin = {left: 10, right: 30, top: 20, bottom: 30}
    var width = props.size[0] - margin.left - margin.right
    var height = props.size[1] - margin.top - margin.bottom

    //Object.keys(props.features).map((featurekey, index) =>
    //  props.features[featurekey].index = index
    //)

    props.features.sort(function(a, b) { return a.index - b.index })
    console.log(props.features)

    props.features.push(
      { index: props.features.length,
        display: true,
        name: "BOUNDARY",
        type: "continuous",
        range: [0,0]
      }
    )

    const displayFeatures = props.features
    const xScaleRange = displayFeatures.map((feature, index) =>
      width/(displayFeatures.length - 1) * index
    )
    const xScaleDomain = displayFeatures.map((feature, index) =>
      feature.name
    )
    const xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange)

    var yScalesDisplay = {}
    for (var i = 0; i < displayFeatures.length; i++) {
      if (displayFeatures[i].type == 'continuous') {
        const scale = d3.scaleLinear().domain(displayFeatures[i].range).range([0, height])
        yScalesDisplay[displayFeatures[i].name] = scale
      }
      else {
        const numSplits = displayFeatures[i].values.length - 1
        const rangeDomain = displayFeatures[i].values.map((v, i) => i * height/numSplits)
        yScalesDisplay[displayFeatures[i].name] = d3.scaleOrdinal().domain(displayFeatures[i].values).range(rangeDomain)
      }
    }
    var yScales = displayFeatures.map((feature) =>
      d3.scaleLinear().domain(feature.range).range([0, height])
    )

    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScalesDisplay[d[0]](d[1])
      })

    this.state = {
      margin: margin,
      width: width,
      height: height,
      displayFeatures: displayFeatures,
      xScale: xScale,
      xScaleDomain: xScaleDomain,
      yScales: yScales,
      yScalesDisplay: yScalesDisplay,
      draw: draw,
      dragging: {}
    }

    this.path = this.path.bind(this)
    this.position = this.position.bind(this)
  }

  componentDidMount() {
    var that = this
    console.log(d3.selectAll('.feature-axis'))
    d3.selectAll(".feature-axis").call(d3.drag()
      .on("start", function(d) {
        //that.state.dragging[attrId] = that.state.xScale(attrId)
      })
      .on("drag", function(d) {
        d3.select(this).attr('transform', function(d) { return 'translate(' + d3.event.x + ")" })
      })
      .on("end", function(d) {

        d3.select(this).attr('transform', function(d) { return 'translate(' + that.state.xScale(this.id) + ")" })
        const attrId = this.id
        that.state.dragging[attrId] = d3.event.x
        var features = that.state.displayFeatures
        features.sort(function(a, b) { return that.position(a.name) - that.position(b.name)})
        //console.log(d3.event.x)
        //console.log(that.position(this.id))
        //console.log(that.position("BOUNDARY"))
        //console.log(that.state.xScale("BOUNDARY"))
        //that.state.xScale.domain(that.state.displayFeatures)
        const xScaleDomain = features.map((feature, index) =>
          feature.name
        )
        delete that.state.dragging[attrId]
        if (xScaleDomain != that.state.xScaleDomain) {
          var xScale = that.state.xScale.domain(xScaleDomain)
          const allFeatureIndexes = features.map((feature) =>
            feature.index
          )
          const stopIndex = allFeatureIndexes.indexOf(features.length - 1);
          //console.log(stopIndex)
          allFeatureIndexes.splice(stopIndex)

          that.props.sendData("/calculateMI", { features: allFeatureIndexes })
          that.setState({
            xScale: xScale,
            xScaleDomain: xScaleDomain,
            displayFeatures: features
          })
        }
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

  position(d) {
    var value = this.state.dragging[d]
    var a = value == null ? this.state.xScale(d) : value;
    //console.log(a)
    return value == null ? this.state.xScale(d) : value;
  }

  path(data, drawFunction) {
    //console.log(drawFunction)
    //var drawData = data.map((point, index) =>
    //  [this.state.featureNames[index], point]
    //)
    //console.log(this.state.displayFeatures)
    var drawData = []

    for (var i = 0; i < this.state.displayFeatures.length; i++) {
      if (this.state.displayFeatures[i].name == "BOUNDARY") {
        break;
      } else {
        drawData.push([this.state.displayFeatures[i].name, data[this.state.displayFeatures[i].index]])
      }
    }
    /*i in this.state.displayFeatures.map((feature) =>
      [feature.name, data[feature.index]]
    )*/
    //console.log(drawData)
    //console.log(this.state.xScale(0), this.state.yScales[0](data[0]))
    return drawFunction(drawData)
  }

  render(){
    console.log('render feature parallels')
    console.log(this.state.displayFeatures)
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

    return (
      <svg className={'feature-parallels-svg'} width={this.props.size[0]} height={this.props.size[1]}>
        <g className={'feature-parallels'} transform={`translate(${this.state.margin.left},${this.state.margin.top})`} >
        <g className={'data-paths'}>
          {this.props.data.map((data, index) =>
            <path d={this.path(data.features, this.state.draw)} fill={"none"} stroke={this.props.colorFunction(data.target)}/>)
          }
        </g>
        {this.state.displayFeatures.map((feature, index) =>
            <Axis name={feature.name} textname={feature.name} axis={this.state.yScalesDisplay[feature.name]} transform={`translate(${this.state.xScale(feature.name)})`}/>
        )}
        </g>
      </svg>
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
