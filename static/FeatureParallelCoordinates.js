/*** @jsx React.DOM */
class Axis extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    var className = ".feature-axis-" + this.props.name
    var axisG = d3.selectAll(className).call(d3.axisRight(this.props.axis).tickFormat(d3.format(".2f")))
  }

  componentDidUpdate() {
  }

  render(){
    //console.log('feature-axis')
    return (
      <g className={'feature-axis-' + this.props.name} transform={this.props.transform} style={{fontSize: 9}}>
        <text x={0} y={-5} fill={"black"} textLength={40}>{this.props.name}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    super(props)
    var margin = {left: 10, right: 30, top: 20, bottom: 30}
    var width = props.size[0] - margin.left - margin.right
    var height = props.size[1] - margin.top - margin.bottom
    var xScaleRange = props.featureNames.map((feature, index) =>
      width/(props.featureNames.length - 1) * index
    )
    var xScaleDomain = props.featureNames.map((feature, index) =>
      index
    )
    var xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange)
    var yScales = props.featureRanges.map((domain) =>
      d3.scaleLinear().domain(domain).range([0, height]))
    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScales[d[0]](d[1])
      })

    this.state = {
      yScales: yScales,
      xScale: xScale,
      draw: draw,
      data: this.props.data,
      margin: margin,
      width: width,
      height: height
    }

    this.path = this.path.bind(this)
  }

  componentDidMount() {

  }

  componentDidUpdate() {
  }

  path(data) {
    var drawData = data.map((point, index) => [index, point])
    //console.log(this.state.xScale(0), this.state.yScales[0](data[0]))
    return this.state.draw(drawData)
  }

  render(){
    console.log('render feature parallels')
    console.log(this.props)

    //var axisTicks = [this.props.max, this.props.min + (this.props.max - this.props.min)/2, this.props.min]
    //var axisScale = d3.scalePoint().domain(axisTicks).range([0, this.state.histogramHeight])
    //var axis = d3.axisLeft(axisScale).tickFormat(d3.format(".2f"))

    return (
      <svg className={'feature-parallels-svg'} width={this.props.size[0]} height={this.props.size[1]}>
        <g className={'feature-parallels'} transform={`translate(${this.state.margin.left},${this.state.margin.top})`} >
          <g className={'data-paths'}>
            {this.state.data.map((data) =>
              <path d={this.path(data.features)} fill={"none"} stroke={this.props.colorFunction(data.target)}/>)
            }
          </g>
          {this.props.featureNames.map((name, index) =>
            <Axis name={name} axis={this.state.yScales[index]} transform={`translate(${this.state.xScale(index)})`} />
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
