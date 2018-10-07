class Legend extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {

  }

  componentDidUpdate() {

  }

  render() {
    console.log(this.props)
    return (
      <div className={"legend"}>
      {this.props.keys.map((key, index) =>
        <div>
          <div className={"series-marker"}  style={{background: this.props.colors[index]}}></div>
          <p>{key}</p>
        </div>
      )}
      </div>
    )
  }
}

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
   //console.log('update axis')
   var className = '.' + this.props.name
   d3.selectAll(className).call(this.props.axis)
 }

 render() {
   //console.log('render axis')
   return(
     <g className={this.props.name} transform={`translate(0,${this.props.top})`} style={{fontSize: 11, fontFamily: "san-serif"}}/>
   )
 }
}

class ProgressGraph extends React.Component {
  constructor(props) {
    console.log(props)
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
      selectedIndex: 0,
    }
    this.initializeMinMax = this.initializeMinMax.bind(this)
    this.getData = this.getData.bind(this)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  componentDidMount() {
    var that = this
    var id = '#progress-graph-' + this.props.name
    d3.select(id)
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - that.state.margin.left
        var keys = Object.keys(that.props.consistencyScores)
        //console.log(keys)
        var numDataPoints = (that.props.currentScores) ? that.props.consistencyScores[keys[0]].length + 1 : that.props.consistencyScores[keys[0]].length
        //console.log(numDataPoints)
        var range = (that.props.size[0] - that.state.margin.left - that.state.margin.right) / (numDataPoints - 1)
        //console.log(xPosition)
        //console.log(range)
        var mouseIndex = ((Math.ceil(xPosition/range) - xPosition/range) < 0.5) ? Math.ceil(xPosition/range) : Math.floor(xPosition/range)
        //console.log(mouseIndex)
        if (mouseIndex != that.props.selectedIndex) {
          that.setState({
            selectedIndex: mouseIndex
          })
        }
      })
      .on("mousedown", function(d) {
        console.log(that.state.selectedIndex)
        that.props.goToStep(that.state.selectedIndex)
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
  }

  getData(data) {
    return data.map((d, index) => [index, d])
  }

  onMouseEnter() {
    //d3.select(".focus").attr("display", "block")
  }

  onMouseLeave() {
    //d3.select(".focus").attr("display", "none")
  }


  render(){
    console.log("progress graph")
    var scores = {}
    //console.log(scores)
    var keys = Object.keys(this.props.consistencyScores)
  //  console.log(keys)
    keys.forEach((key) => {
      //console.log(this.props.consistencyScores[key])
      //console.log(this.props.consistencyScores[key].slice())
      scores[key] = this.props.consistencyScores[key].slice() //.push(this.props.currentScores[key])

    })
    //console.log(keys)
    //console.log(scores)
    if (this.props.currentScores) {
      if (this.props.currentScores["MI"] >= 0) {
        keys.map((key) => {
          scores[key].push(this.props.currentScores[key])
        })
      }
    }
    //console.log(this.props.consistencyScores)
    //console.log(scores)
    //var MB = this.props.consistencyMB.splice()
    //MB.push(this.props.currentMB)
    //var EK = this.props.consistencyEK
    var xScaleDomain = (scores[keys[0]].length > 1) ?
        scores[keys[0]].map((score, index) => index) :
        [0, 1]
    var xScaleRange = (scores[keys[0]].length > 1) ?
      scores[keys[0]].map((score, index) => this.state.width/(scores[keys[0]].length - 1) * index) :
      [0, this.state.width]
    //console.log(xScaleDomain)
    //console.log(xScaleRange)
    var xScale = d3.scaleOrdinal().domain(xScaleDomain).range(xScaleRange)

    keys.map((key) =>
      this.initializeMinMax(scores[key])
    )

    var yScale = d3.scaleLinear().domain([this.state.max, this.state.min]).range([0, this.state.height])
    var draw = d3.line().x(function(d) {return xScale(d[0])}).y(function(d) { return yScale(d[1])})

    var lineDataPoints = keys.map((key) =>
      this.getData(scores[key])
    )
    //var EKdata = this.getData(this.props.consistencyEK)
    //var MBdata = this.getData(this.props.consistencyMB)
    //var MIdata = this.getData(this.props.MI)
    //console.log(EKdata)
    var xAxis = d3.axisBottom(xScale)
    var yAxis = d3.axisLeft(yScale)
    //console.log(xAxis)
    //var datapoints = [this.props.consistencyEK, this.props.consistencyMB, this.props.MI]
    var colors = ["red", "green", "blue"]
    //console.log(lineDataPoints)
    return (
      <svg id={"progress-graph-" + this.props.name} width={this.props.size[0]} height={this.props.size[1]}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        <g className={"score-paths"} transform={`translate(${this.state.margin.left},${this.state.margin.top})`}>
          <LineAxis name={"progress-x-axis-" + this.props.name} axis={xAxis} top={this.state.height}/>
          <LineAxis name={"progress-y-axis-" + this.props.name} axis={yAxis} top={0}/>
          {
            lineDataPoints.map((points, index) =>
              <path className={"graphline"} d={draw(points)} stroke={this.props.colors[index]} stroke-width={3} fill={"none"} />
            )
          }
          <g className={"focus"} style={{fontSize: 11, fontFamily: "san-serif"}}>
            {keys.map((key, index) =>
              <g transform={`translate(${xScale(this.state.selectedIndex)},${yScale(scores[key][this.state.selectedIndex])})`}>
                <circle r={5} fill={this.props.colors[index]}/>
                <text x={9}>{scores[key][this.state.selectedIndex]}</text>
              </g>)
            }
          </g>
        </g>
      </svg>
    )
  }
}

/*
<path className={"graphline"} d={draw(EKdata)} stroke={"red"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MBdata)} stroke={"green"} stroke-width={3} fill={"none"}/>
<path className={"graphline"} d={draw(MIdata)} stroke={"blue"} stroke-width={3} fill={"none"}/>
*/
