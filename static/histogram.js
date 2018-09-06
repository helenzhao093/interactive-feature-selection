 /*** @jsx React.DOM */
// function that returns bars, set width, height, x, y, color
function HistogramBar(props) {
  return(
    <rect
      className={props.className}
      width={props.width} height={props.height}
      x={props.x} y={props.y}
      fill={props.fill} stroke={props.stroke} stroke-width={props.strokeWidth}
      onMouseEnter={props.onMouseEnter}
    />
  )
}

function HistogramToolTip(props) {
  console.log(props)
  return(
    <div className={"histogram-tooltip"}
      style={{
        left: props.data.left,
        top: props.data.top,
      }}>
      {props.data.data}
    </div>
  )
}

class HistogramYAxis extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    d3.selectAll(".y-axis").call(this.props.axis)
  }

  render() {
    return(
      <g className={"y-axis"} transform={`translate(${this.props.left},${this.props.top})` }/>
    )
  }
}

class HistogramBin extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  render(){
    //console.log('render bin');
    //console.log(this.props)
    console.log(this.props.index)

    return(
      <g className={`bin${this.props.data.bin}`}>
        {this.props.data.tp.map(bar =>
          <HistogramBar
            className={`TP${bar.className}`}
            width={this.props.xScaleCount(bar.count)}
            height={this.props.yScale.bandwidth()}
            x={this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2}
            y={this.props.yScale(bar.bin)}
            fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2 + this.props.xScaleCount(bar.count),
              this.props.yScale(bar.bin) + this.props.tooltipIncrement * this.props.index
            )}
          />
        )}
        {this.props.data.fp.map(bar =>
          <HistogramBar
            className={`FP${bar.className}`}
            width={this.props.xScaleCount(bar.count)}
            height={this.props.yScale.bandwidth()}
            x={this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2}
            y={this.props.yScale(bar.bin)}
            fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2 + this.props.xScaleCount(bar.count),
              this.props.yScale(bar.bin)
            )}
          />
        )}
        {this.props.data.tn.map(bar=>
          <HistogramBar
            className={`TN${bar.className}`}
            width={this.props.xScaleCount(bar.count)}
            height={this.props.yScale.bandwidth()}
            x={this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count) - this.props.yAxisStrokeWidth/2}
            y={this.props.yScale(bar.bin)}
            fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count) - this.props.yAxisStrokeWidth/2 + this.props.fnStrokeWidth/2,
              this.props.yScale(bar.bin)
            )}
          />
        )}
        {this.props.data.fn.map(bar=>
          <HistogramBar
            className={`FN${bar.className}`}
            width={this.props.xScaleCount(bar.count) - this.props.fnStrokeWidth}
            height={this.props.yScale.bandwidth() - this.props.fnStrokeWidth}
            x={this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count) - this.props.yAxisStrokeWidth/2 + this.props.fnStrokeWidth/2}
            y={this.props.yScale(bar.bin) + this.props.fnStrokeWidth/2}
            fill={"white"} stroke={this.props.color(bar.className)} stroke-width={this.props.fnStrokeWidth}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count) - this.props.yAxisStrokeWidth/2 + this.props.fnStrokeWidth/2,
              this.props.yScale(bar.bin)
            )}
          />
        )}
      </g>
    )
  }
}

class Histogram extends React.Component {
  constructor(props) {
    super(props)
    this.createHistogram = this.createHistogram.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    // add tooltip to state
    this.state = {
      colorRange: ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#a97856", "#a3a6af", "#48322e", "#ad8a85"],
      tooltip: { count: 0, left: 0, top: 0},
      margin: { top: 5, right: 0, bottom: 5, left: 0 },
      histogramHeight : this.props.size[1] - this.props.margin.top - this.props.margin.bottom,
      yAxisStrokeWidth : 2,
      fnStrokeWidth : 4,
      textLength : 40
    }
    console.log(this.state)
  }

  componentDidMount() {
    this.createHistogram()
  }

  componentDidUpdate() {
    this.createHistogram()
  }

  createHistogram() {
    //d3.selectAll(".histogram").call(this.props.brush)
    //d3.selectAll(".selection").attr("width", 0)

  }

  onMouseEnter(data, x, y) {
    // update histogram state with new tooltip
    console.log(data, x, y)
    //console.log('hi')
    //d3.selectAll(".histogram-tooltip").html(data)
    this.setState({tooltip: {data: data, left: x, top: y}})
  }

  render() {
    console.log('render histogram')
    var xDomainScale = Math.max(this.props.maxNeg, this.props.maxPos)

    var xScale = d3.scaleLinear()
        .domain([-xDomainScale, xDomainScale]).nice()
        .rangeRound([0, this.props.size[0]])

    var xScaleCount = d3.scaleLinear()
        .domain([0, xDomainScale*2])
        .rangeRound([0, this.props.size[0]])

    var yScale = d3.scaleBand()
        //.domain(settings.bins)
        .domain([9,8,7,6,5,4,3,2,1,0])
        .rangeRound([0, this.state.histogramHeight]).padding(0.1)

    //var colorRange = ["#00649b", "#bc4577", "#ff7e5a", "#b2bae4", "#a97856", "#a3a6af", "#48322e", "#ad8a85"]

    var color = d3.scaleOrdinal()
        .range(this.state.colorRange)
        .domain(["class0", "class1", "class2", "class3", "class4", "class5", "class6", "class7"])

    /*var margin = { top: 5, right: 0, bottom: 5, left: 0 }
    var totalHeight = this.props.size[1]
    var histogramHeight = totalHeight - margin.top - margin.bottom
    var yAxisStrokeWidth = 2
    var fnStrokeWidth = 4
    var textLength = 40 */

    //TODO: calculate tick marks
    console.log(this.props.min)
    var axisTicks = [this.props.min, this.props.min + (this.props.max - this.props.min)/2, this.props.max]
    var axisScale = d3.scalePoint().domain(axisTicks).range([0, this.state.histogramHeight])
    var axis = d3.axisLeft(axisScale).tickFormat(d3.format(".2f"))

    return (
      // TODO: convert to tooltip component
      <div className={"histogram-div"}>
        <HistogramToolTip data={this.state.tooltip} />
        <svg className={"histogram"} width={this.props.size[0]} height={this.props.size[1]}>
          <g transform={`translate(${this.props.margin.left},${this.props.margin.top})`}>
          {this.props.data.data.map( bin =>
            <HistogramBin data={bin} xScale={xScale} xScaleCount={xScaleCount} yScale={yScale} color={color}
              yAxisStrokeWidth={this.state.yAxisStrokeWidth} fnStrokeWidth={this.state.fnStrokeWidth} index={this.props.index}
              tooltipIncrement={this.props.size[1] + this.margin.top}
              onMouseEnter={(d, x, y) => this.onMouseEnter(d, x, y)}
            />
          )}
          </g>

          <HistogramYAxis axis={axis} left={this.props.size[0]/2} top={this.state.margin.top}/>

          //TODO: Add styling to text
          <text
            className={"histogram-label"}
            x={ this.props.size[0]/2 - this.state.textLength/2}
            y={this.props.size[1]}
            textLength={this.state.textLength}
            fill={color(this.props.data.className)}
            >
            {this.props.data.className}
          </text>
        </svg>
      </div>
    )
  }
}

//export default Histogram
