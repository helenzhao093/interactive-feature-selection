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
      onMouseLeave={props.onMouseLeave}
    />
  )
}

function HistogramToolTip(props) {
  var className = props.data.isVisible ? "histogram-tooltip" : "histogram-tooltip hidden"
  return(
    <div className={className}
      style={{
        left: props.data.left,
        top: props.data.top,
      }}>
      {props.data.data}
    </div>
  )
}

class HistogramBinHorizontal extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  render(){
    console.log('render bin');
    console.log(this.props)
    var tp = this.props.data.TP.map(bar =>
      <HistogramBar
        className={`TP${bar.className}`}
        width={this.props.xScaleCount(bar.count)}
        height={this.props.yScale.bandwidth()}
        x={this.props.xScale(bar.previousSum)}
        y={this.props.yScale(bar.bin)}
        fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
        onMouseEnter={() => this.props.onMouseEnter(bar.count,
          this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2 + this.props.xScaleCount(bar.count),
          this.props.yScale(bar.bin) + 10
        )}
        onMouseLeave={() => this.props.onMouseLeave()}
      />
    )

    return(
      <g className={`bin${this.props.data.bin}`}>
        {tp}
        {this.props.data.FP.map(bar =>
          <HistogramBar
            className={`FP${bar.className}`}
            width={this.props.xScaleCount(bar.count)}
            height={this.props.yScale.bandwidth()}
            x={this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2}
            y={this.props.yScale(bar.bin)}
            fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(bar.previousSum) + this.props.yAxisStrokeWidth/2 + this.props.xScaleCount(bar.count),
              this.props.yScale(bar.bin) + 10
            )}
            onMouseLeave={() => this.props.onMouseLeave()}
          />
        )}
        {this.props.data.TN.map(bar=>
          <HistogramBar
            className={`TN${bar.className}`}
            width={this.props.xScaleCount(bar.count)}
            height={this.props.yScale.bandwidth()}
            x={this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count)}
            y={this.props.yScale(bar.bin)}
            fill={this.props.color(bar.className)} stroke={"none"} stroke-width={0}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count),
              this.props.yScale(bar.bin) + 10
            )}
            onMouseLeave={() => this.props.onMouseLeave()}
          />
        )}
        {this.props.data.FN.map(bar=>
          <HistogramBar
            className={`FN${bar.className}`}
            width={this.props.xScaleCount(bar.count) - this.props.fnStrokeWidth}
            height={this.props.yScale.bandwidth() - this.props.fnStrokeWidth}
            x={this.props.xScale(-bar.previousSum - bar.count) - this.props.fnStrokeWidth}
            y={this.props.yScale(bar.bin) + this.props.fnStrokeWidth/2}
            fill={"white"} stroke={this.props.color(bar.className)} stroke-width={this.props.fnStrokeWidth}
            onMouseEnter={() => this.props.onMouseEnter(bar.count,
              this.props.xScale(0) - this.props.xScaleCount(bar.previousSum) - this.props.xScaleCount(bar.count) + this.props.fnStrokeWidth/2,
              this.props.yScale(bar.bin) + 10
            )}
            onMouseLeave={() => this.props.onMouseLeave()}
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
    this.onMouseLeave = this.onMouseLeave.bind(this)
    // add tooltip to state

    this.state = {
      tooltip: { data: 0, left: 0, top: 0, isVisible: false },
      margin: props.margin,
      histogramHeight : props.size[1] - props.margin.top - props.margin.bottom,
      histogramWidth : props.size[0] - props.margin.left - props.margin.right,
      yAxisStrokeWidth : 2,
      fnStrokeWidth : 1,
      textLength : 40,
    }
    console.log(this.state)
  }

  componentDidMount() {
    this.createHistogram()
  }

  componentDidUpdate() {
    //d3.selectAll(".selection").attr("width", 0)

  }

  createHistogram() {
    //d3.selectAll(".histogram").call(this.props.brush)
    //d3.selectAll(".selection").attr("width", 0)
  }

  onMouseEnter(data, x, y) {
    // update histogram state with new tooltip
    //console.log('hi')
    //d3.selectAll(".histogram-tooltip").html(data)
    this.setState({tooltip: {data: data, left: x, top: y, isVisible: true}})
  }

  onMouseLeave() {
    this.setState({tooltip: {data: 0, left: 0, top: 0, isVisible: false }})
  }

  render() {
    console.log('render histogram')
    console.log(this.props)
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
        .rangeRound([0, this.props.size[1] - this.props.margin.top - this.props.margin.bottom]).padding(0.1)

    var axisTicks = [this.props.max, this.props.min + (this.props.max - this.props.min)/2, this.props.min]
    var axisScale = d3.scalePoint().domain(axisTicks).range([0, this.state.histogramHeight])
    var axis = d3.axisLeft(axisScale).tickFormat(d3.format(".2f"))

    var bins = this.props.data.data.map( bin =>
      <HistogramBinHorizontal data={bin} xScale={xScale} xScaleCount={xScaleCount} yScale={yScale} color={this.props.colorFunction}
        yAxisStrokeWidth={this.state.yAxisStrokeWidth} fnStrokeWidth={this.state.fnStrokeWidth} index={this.props.index}
        tooltipIncrement={this.props.size[1] + this.state.margin.top}
        onMouseEnter={(d, x, y) => this.onMouseEnter(d, x, y)}
        onMouseLeave={() => this.onMouseLeave()}
      />)

    return (
      <div className={"histogram-div"}>
        <HistogramToolTip data={this.state.tooltip} />
        <svg className={"histogram"} width={this.props.size[0]} height={this.props.size[1]}>
          <g transform={`translate(${this.props.margin.left},${this.props.margin.top})`}>
            {bins}
          </g>

          <HistogramYAxis name={'y-axis'} axis={axis} left={this.props.size[0]/2} top={this.state.margin.top}/>

          //TODO: Add styling to text
          <text
            className={"histogram-label"}
            x={ this.props.size[0]/2 - this.state.textLength/2}
            y={this.props.size[1]}
            textLength={this.state.textLength}
            fill={this.props.colorFunction(this.props.data.className)}
            >
            {this.props.data.className}
          </text>
          <g className={"brush"} />
        </svg>
      </div>
    )
  }
}

//export default Histogram
