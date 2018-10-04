class LineAxis extends React.Component {
 constructor(props) {
   console.log(props)
   super(props)
 }

 componentDidMount() {
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 componentDidUpdate() {
   console.log('update axis')
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 render() {
   console.log('render axis')
   return(
     <g className={this.props.name} transform={`translate(0,${this.props.top})`}/>
   )
 }
}

class ProgressGraph extends React.Component {
  constructor(props) {
    super(props)
    // array of consistency MB scores
    // array of consistency EK scores
    // array of MI scores
    var margin = {left: 30, right: 30, top: 20, bottom: 30}
    var width = props.size[0] - margin.left - margin.right
    var height = props.size[1] - margin.top - margin.bottom
    this.state = {
      margin: margin,
      width: width,
      height: height,
      min: 1,
      max: 0,
      selectedIndex: 0
    }
    this.initializeMinMax = this.initializeMinMax.bind(this)
    this.getData = this.getData.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  componentDidMount() {
    var that = this
    d3.select("#progress-graph")
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - that.state.margin.left
        var numDataPoints = that.props.consistencyEK.length
        var range = (that.props.size[0] - that.state.margin.left - that.state.margin.right) / (numDataPoints - 1)
        console.log(xPosition)
        console.log(range)
        var mouseIndex = ((Math.ceil(xPosition/range) - xPosition/range) < 0.5) ? Math.ceil(xPosition/range) : Math.floor(xPosition/range)
        console.log(mouseIndex)
        if (mouseIndex != that.props.mouseIndex) {
          that.setState({
            selectedIndex: mouseIndex
          })
        }
      })
  }

  componentDidUpdate() {
  }

  initializeMinMax(scores) {
    var max = scores.reduce(function(a, b) { return Math.max(a, b)})
    var min = scores.reduce(function(a, b) { return Math.min(a, b)})
    if (min < this.state.min) {
      this.state.min = min
    }
    if (max > this.state.max) {
      this.state.max = max
    }
    //var yScale = d3.scaleLinear().domain([min, max]).range([0, this.state.height])
    //return yScale
  }

  getData(data) {
    return data.map((d, index) => [index, d])
  }

  onMouseEnter() {
    d3.select(".focus").attr("display", "block")
  }

  onMouseMove() {
    console.log(d3.mouse(d3.select(".focus")))
  }

  onMouseLeave() {
    d3.select(".focus").attr("display", "none")
  }

  render(){
    var xScaleDomain = this.props.consistencyEK.map((score, index) => index)
    var xScaleRange = this.props.consistencyEK.map((score, index) =>
      this.state.width/(this.props.consistencyEK.length - 1) * index
    )
    console.log(xScaleDomain)
    console.log(xScaleRange)
    var xScale = d3.scaleOrdinal().domain(xScaleDomain).range(xScaleRange)

    this.initializeMinMax(this.props.consistencyEK)
    this.initializeMinMax(this.props.consistencyMB)
    this.initializeMinMax(this.props.MI)

    var yScale = d3.scaleLinear().domain([this.state.max, this.state.min]).range([0, this.state.height])
    var draw = d3.line().x(function(d) {return xScale(d[0])}).y(function(d) { return yScale(d[1])})
    var EKdata = this.getData(this.props.consistencyEK)
    var MBdata = this.getData(this.props.consistencyMB)
    var MIdata = this.getData(this.props.MI)
    console.log(EKdata)

    var xAxis = d3.axisBottom(xScale)
    var yAxis = d3.axisLeft(yScale)
    //console.log(xAxis)
    var datapoints = [this.props.consistencyEK, this.props.consistencyMB, this.props.MI]
    var colors = ["red", "green", "blue"]
    return (
      <svg id={"progress-graph"} width={this.props.size[0]} height={this.props.size[1]}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        <g className={"score-paths"} transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
          <LineAxis name={"progress-x-axis"} axis={xAxis} top={this.state.height}/>
          <LineAxis name={"progress-y-axis"} axis={yAxis} top={0}/>
          <path d={draw(EKdata)} stroke={"red"} stroke-width={3} fill={"none"}/>
          <path d={draw(MBdata)} stroke={"green"} stroke-width={3} fill={"none"}/>
          <path d={draw(MIdata)} stroke={"blue"} stroke-width={3} fill={"none"}/>
          <g className={"focus"} display={"none"}>
            {datapoints.map((points, index) =>
              <g transform={`translate(${xScale(this.state.selectedIndex)},${yScale(points[this.state.selectedIndex])})`}>
                <circle r={5} fill={colors[index]}/>
                <rect x={8} y={-5} width={22} height={12} fill={"grey"}/>
                <text x={9}>{points[this.state.selectedIndex]}</text>
              </g>)
            }
          </g>
        </g>
      </svg>
    )
  }
}
