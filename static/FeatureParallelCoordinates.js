/*** @jsx React.DOM */
class Axis extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    var className = ".feature-axis-" + this.props.name
    var axisG = d3.selectAll(className).call(d3.axisRight(this.props.axis).tickFormat(d3.format(".3n")))
  }

  componentDidUpdate() {
  }

  render(){
    console.log('feature-axis')
    return (
      <g className={'feature-axis-' + this.props.name} transform={this.props.transform} style={{fontSize: 9}}>
        <text x={0} y={-5} fill={"black"} >{this.props.name}</text>
      </g>
    )
  }
}

class FeatureParallelCoordinates extends React.Component {
  constructor(props) {
    console.log(props)
    super(props)
    var margin = {left: 10, right: 30, top: 20, bottom: 30}
    var width = props.size[0] - margin.left - margin.right
    var height = props.size[1] - margin.top - margin.bottom

    this.state = {
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

  path(data, drawFunction) {
    var drawData = data.map((point, index) => [index, point])
    //console.log(this.state.xScale(0), this.state.yScales[0](data[0]))
    return drawFunction(drawData)
  }

  render(){
    console.log('render feature parallels')
    //console.log(this.props)

    /*var displayData = this.props.featureValues.filter((feature, index) =>
      this.props.dataIndex[index] == true
    )
    console.log(displayData)

    var displayTarget = this.props.targetValues.filter((feature, index) =>
      this.props.dataIndex[index] = true
    )
    console.log(displayTarget)
    */
    var displayFeatures = this.props.features.filter((feature) =>
      feature.display == true
    )
    console.log(displayFeatures)

    var xScaleRange = displayFeatures.map((feature, index) =>
      this.state.width/(displayFeatures.length - 1) * index
    )

    var xScaleDomain = displayFeatures.map((feature, index) =>
      index
    )
    var xScale = d3.scaleOrdinal()
        .domain(xScaleDomain)
        .range(xScaleRange)

    var yScales = displayFeatures.map((feature) =>
      d3.scaleLinear().domain(feature.range).range([0, this.state.height])
    )

    var draw = d3.line()
      .x(function(d) {
        return xScale(d[0])
      })
      .y(function(d) {
        return yScales[d[0]](d[1])
      })


    return (
      <svg className={'feature-parallels-svg'} width={this.props.size[0]} height={this.props.size[1]}>
        <g className={'feature-parallels'} transform={`translate(${this.state.margin.left},${this.state.margin.top})`} >
          <g className={'data-paths'}>
            {this.props.data.map((data, index) =>
              <path d={this.path(data.features, draw)} fill={"none"} stroke={this.props.colorFunction(data.target)}/>)
            }
          </g>
          {displayFeatures.map((feature, index) =>
              <Axis name={feature.featureName} axis={yScales[index]} transform={`translate(${xScale(index)})`}/>
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
