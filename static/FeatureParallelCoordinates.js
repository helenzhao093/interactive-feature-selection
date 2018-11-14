/*** @jsx React.DOM */
class Axis extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    var id = '#' + this.props.name;//className = ".feature-axis-" + this.props.name
    var axisG = d3.select(id).call(d3.axisRight(this.props.axis));//.tickFormat(d3.format(".3n")))
    if (this.props.name == 'BOUNDARY') {
      var g = d3.select(id)
      g.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5);
      g.select(".tick").style("display", "none")
    }
  }

  componentDidUpdate() {
    //console.log('axis update')
    var id = '#' + this.props.name;
    d3.select(id).selectAll('.tick').remove();
    var axisG = d3.select(id).call(d3.axisRight(this.props.axis));
    var g = d3.select(id);
    if (this.props.name == 'BOUNDARY') {
      g.select("path").attr("stroke", "darkgrey").attr("stroke-width", 5);
      g.select(".tick").style("display", "none")
    } else {
      g.select("path").attr("stroke", "black").attr("stroke-width", 1)
    }
  }

  render(){
    console.log('feature-axis');
    const textColor = this.props.name == "BOUNDARY" ? "darkgrey": "black";
    return (
      <g className={'feature-axis'} id={this.props.name} transform={this.props.transform}>
        <text x={10} y={-5} transform={'rotate(-45)'} fill={textColor} style={{fontWeight: "bold"}} >{this.props.textname}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    var margin = {left: 10, right: 30, top: 60, bottom:10};
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
    /*var yScales = this.props.features.map((feature) =>
      d3.scaleLinear().domain(feature.range).range([0, height])
    ); */

    this.state = {
      margin: margin,
      width: width,
      height: height,
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

    d3.selectAll('.feature-axis')
        .selectAll('.tick')
        .selectAll('text')
        .attr("transform", "rotate(-45)")
  }

  componentDidUpdate() {
    var that = this
      d3.selectAll('.feature-axis')
          .selectAll('.tick')
          .selectAll('text')
          .attr("transform", "rotate(-45)")

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
    //
    var xScale = this.props.xScale;
    var yScalesDisplay = this.state.yScalesDisplay;
    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScalesDisplay[d[0]](d[1])
      });

    var drawData = [];

    for (var i = 0; i < this.props.features.length; i++) {
      if (this.props.features[i].name == "BOUNDARY") {
        break;
      } else {
        drawData.push([this.props.features[i].name, data[this.props.features[i].index]])
      }
    }
    return draw(drawData)
  }

  render(){
    console.log('render feature parallels');
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
